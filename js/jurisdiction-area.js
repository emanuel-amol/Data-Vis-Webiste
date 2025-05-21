// jurisdiction-area.js - Stacked area chart showing relative jurisdiction contributions over time
// This version integrates with dataLoader.js to use the actual road safety data
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if the chart container exists
  if (!document.getElementById('jurisdiction-area-chart')) return;
  
  // Define variables in global scope for updating later
  let svg, x, y, tooltip, areaChart;
  
  // Map state abbreviations to full names for tooltip display
  const stateAbbreviations = {
    "NSW": "New South Wales",
    "VIC": "Victoria",
    "QLD": "Queensland",
    "SA": "South Australia",
    "WA": "Western Australia",
    "TAS": "Tasmania",
    "NT": "Northern Territory",
    "ACT": "Australian Capital Territory"
  };
  
  // Map full names to abbreviations for data processing
  const stateFullNameToAbbr = Object.entries(stateAbbreviations).reduce((acc, [abbr, fullName]) => {
    acc[fullName] = abbr;
    return acc;
  }, {});
  
  // Color scheme for jurisdictions - using the same scheme as the map for consistency
  const jurisdictionColors = d3.scaleOrdinal()
    .domain(Object.keys(stateAbbreviations))
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"]);

  // Initialize dimensions
  const margin = { top: 60, right: 180, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  // Initialize the chart container
  initChart();
  
  // Check if data is already loaded, otherwise wait for the event
  if (window.roadSafetyData) {
    renderChart();
  } else {
    document.addEventListener('roadSafetyDataReady', renderChart);
    
    // If dataLoader.js hasn't been loaded yet, use window.loadRoadSafetyData if available
    if (typeof window.loadRoadSafetyData === 'function') {
      window.loadRoadSafetyData();
    }
  }

  // Create the initial chart container
  function initChart() {
    // Create SVG element if it doesn't already exist
    const existingSvg = d3.select("#jurisdiction-area-chart svg");
    if (!existingSvg.empty()) {
      existingSvg.remove();
    }
    
    // Create new SVG
    svg = d3.select("#jurisdiction-area-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
      
    // Add chart group
    areaChart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title to the chart
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 25)
      .attr("class", "title")
      .text("Relative Contribution by Jurisdiction (2008-2023)")
      .style("font-size", "18px")
      .style("font-weight", "bold");

    // Add subtitle with storytelling context
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 5)
      .attr("class", "subtitle")
      .text("NSW and VIC increasingly dominate road safety enforcement")
      .style("font-size", "14px")
      .style("fill", "#666");

    // Add tooltip div if it doesn't exist
    if (!document.getElementById('area-tooltip')) {
      tooltip = d3.select("body")
        .append("div")
        .attr("id", "area-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("max-width", "250px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
        .style("z-index", 1000);
    } else {
      tooltip = d3.select("#area-tooltip");
    }
  }
  
  // Render chart when data is available
  function renderChart() {
    console.log("Rendering jurisdiction area chart with road safety data");
    updateChart();
  }

  // Update chart based on current filter selections
  function updateChart() {
    // Clear previous chart content
    areaChart.selectAll("*").remove();
    
    // Check if data is available
    if (!window.roadSafetyData || !window.roadSafetyData.finesData) {
      console.warn("Road safety data not available for area chart");
      areaChart.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Loading data...");
      return;
    }
    
    // Get filter selections
    const selectedJurisdictions = getSelectedJurisdictions();
    const selectedYears = getSelectedYears();
    const selectedMethods = getSelectedDetectionMethods();
    
    console.log("Updating jurisdiction area chart with filters:", {
      jurisdictions: selectedJurisdictions,
      years: selectedYears,
      methods: selectedMethods
    });
    
    // Get all available years from the data
    const allYears = window.roadSafetyData.finesData.years.sort((a, b) => a - b);
    
    // Process data for stacked area chart
    const processedData = processDataForStackedArea(selectedJurisdictions, selectedYears, selectedMethods);
    
    // Check if we have data to display
    if (processedData.length === 0) {
      areaChart.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("No data available for the selected filters");
      return;
    }
    
    // Create scales
    x = d3.scaleLinear()
      .domain([d3.min(allYears), d3.max(allYears)])
      .range([0, width]);
    
    y = d3.scaleLinear()
      .domain([0, 1]) // We're using percentages (0-100%)
      .range([height, 0]);
      
    // Get jurisdictions used in the data
    const jurisdictions = Array.from(new Set(processedData.map(d => d.jurisdiction)));
    
    // Create the stacked data
    const stackData = [];
    
    // Group by year first
    const yearGroups = d3.group(processedData, d => d.year);
    
    // For each year, create an object with year and jurisdiction percentages
    yearGroups.forEach((yearData, year) => {
      const obj = { year: +year };
      
      // Calculate total for the year
      const yearTotal = d3.sum(yearData, d => d.fines);
      
      // Add each jurisdiction's percentage
      yearData.forEach(d => {
        obj[d.jurisdiction] = yearTotal > 0 ? d.fines / yearTotal : 0;
      });
      
      // Make sure all jurisdictions have a value (even if 0)
      jurisdictions.forEach(j => {
        if (!(j in obj)) {
          obj[j] = 0;
        }
      });
      
      stackData.push(obj);
    });
    
    // Sort by year
    stackData.sort((a, b) => a.year - b.year);
    
    // Create the stack generator
    const stack = d3.stack()
      .keys(jurisdictions)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
    
    // Generate the stacked data
    const series = stack(stackData);
    
    // Add x-axis
    areaChart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(allYears.filter(y => y % 2 === 0)) // Show every other year
        .tickFormat(d3.format("d")));
    
    // Add y-axis as percentage
    areaChart.append("g")
      .call(d3.axisLeft(y)
        .tickFormat(d => d3.format(".0%")(d))); // Format as percentage
    
    // Add axis labels
    areaChart.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width/2)
      .attr("y", height + 40)
      .text("Year")
      .style("font-size", "12px");
      
    areaChart.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height/2)
      .attr("y", -40)
      .text("Percentage of Total Fines")
      .style("font-size", "12px");
    
    // Area generator
    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);
    
    // Draw areas
    areaChart.selectAll(".area")
      .data(series)
      .enter()
      .append("path")
      .attr("class", "area")
      .attr("d", area)
      .attr("fill", d => jurisdictionColors(d.key))
      .attr("opacity", 0.85)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        // Highlight this area
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1);
          
        // Show tooltip at mouse position
        tooltip.style("visibility", "visible");
        
        // Update tooltip position on mousemove
        updateTooltip(event, d);
      })
      .on("mousemove", updateTooltip)
      .on("mouseout", function() {
        // Restore normal opacity
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.85);
          
        // Hide tooltip
        tooltip.style("visibility", "hidden");
      });
    
    // Function to update tooltip content and position
    function updateTooltip(event, d) {
      // Get the year based on mouse position
      const xPos = d3.pointer(event)[0];
      const year = Math.round(x.invert(xPos));
      
      // Find the data for this year
      const yearData = stackData.find(item => item.year === year);
      if (!yearData) return;
      
      // Calculate the percentage for this jurisdiction
      const jurisdictionKey = d.key;
      const jurisdictionPct = yearData[jurisdictionKey];
      
      // Get total for this point in the stack
      const index = stackData.indexOf(yearData);
      const value = d[index];
      const percentage = (value[1] - value[0]) * 100;
      
      // Format the tooltip
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 25) + "px")
        .html(`
          <strong>${stateAbbreviations[jurisdictionKey] || jurisdictionKey}</strong><br>
          Year: ${year}<br>
          Percentage: ${percentage.toFixed(1)}%<br>
          <small>Hover over other areas to compare</small>
        `);
    }
    
    // Add legend
    const legend = areaChart.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 20}, 0)`);
      
    jurisdictions.forEach((jurisdiction, i) => {
      const group = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
      
      group.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", jurisdictionColors(jurisdiction));
      
      group.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(stateAbbreviations[jurisdiction] || jurisdiction)
        .style("font-size", "12px");
    });
    
    // Add a note about stacked areas
    areaChart.append("text")
      .attr("x", width - 20)
      .attr("y", height - 10)
      .attr("text-anchor", "end")
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .text("Chart shows proportional contribution of each jurisdiction to total fines");
  }

  // Process data for stacked area chart
  function processDataForStackedArea(selectedJurisdictions, selectedYears, selectedMethods) {
    const finesData = window.roadSafetyData.finesData;
    const allYears = finesData.years.sort((a, b) => a - b);
    
    // Result array to store data
    const result = [];
    
    // Get jurisdictions from data if none are specifically selected
    const jurisdictions = selectedJurisdictions.length > 0 
      ? selectedJurisdictions 
      : Object.keys(stateAbbreviations);
    
    // Get years from data if none are specifically selected
    const years = selectedYears.length > 0 
      ? selectedYears.map(y => parseInt(y)) 
      : allYears;
    
    // Get methods from data if none are specifically selected
    const methods = selectedMethods.length > 0 
      ? selectedMethods 
      : finesData.methods;
    
    // Get total fines by jurisdiction and year
    jurisdictions.forEach(jurisdiction => {
      years.forEach(year => {
        // Skip if this year isn't in the data
        if (!finesData.byYearAndMethod[year]) return;
        
        // Get total fines for this jurisdiction and year
        let totalFines = 0;
        
        methods.forEach(method => {
          // Skip if this method isn't in the data for this year
          if (!finesData.byYearAndMethod[year][method]) return;
          
          // Get state name from abbreviation
          const stateName = stateAbbreviations[jurisdiction];
          
          // Add fines for this method
          totalFines += finesData.byYearAndMethod[year][method][stateName] || 0;
        });
        
        // Add to result if there are fines
        if (totalFines > 0) {
          result.push({
            jurisdiction,
            year,
            fines: totalFines
          });
        } else {
          // Add with 0 fines to ensure we have all years
          result.push({
            jurisdiction,
            year,
            fines: 0
          });
        }
      });
    });
    
    return result;
  }

  // Helper function to get selected jurisdictions from checkboxes
  function getSelectedJurisdictions() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // Helper function to get selected years from checkboxes
  function getSelectedYears() {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // Helper function to get selected detection methods from checkboxes
  function getSelectedDetectionMethods() {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // Register this chart with the global update function
  window.jurisdictionAreaChart = {
    update: updateChart
  };
  
  // Hook into global updateCharts function
  const originalUpdateCharts = window.updateCharts || function() {};
  window.updateCharts = function() {
    originalUpdateCharts();
    if (window.jurisdictionAreaChart && window.jurisdictionAreaChart.update) {
      window.jurisdictionAreaChart.update();
    }
  };
});