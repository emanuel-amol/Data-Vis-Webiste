// jurisdiction-line.js - Time series line chart showing jurisdictions over time
// This version integrates with dataLoader.js to use the actual road safety data
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if the chart container exists
  if (!document.getElementById('jurisdiction-line-chart')) return;
  
  // Define variables in global scope for updating later
  let svg, x, y, tooltip, lineChart;
  
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
    const existingSvg = d3.select("#jurisdiction-line-chart svg");
    if (!existingSvg.empty()) {
      existingSvg.remove();
    }
    
    // Create new SVG
    svg = d3.select("#jurisdiction-line-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
      
    // Add chart group
    lineChart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title to the chart
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 25)
      .attr("class", "title")
      .text("Fine Trends by Jurisdiction (2008-2023)")
      .style("font-size", "18px")
      .style("font-weight", "bold");

    // Add subtitle with storytelling context
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top - 5)
      .attr("class", "subtitle")
      .text("Note how NSW and VIC trends diverge significantly after 2019")
      .style("font-size", "14px")
      .style("fill", "#666");

    // Add tooltip div if it doesn't exist
    if (!document.getElementById('jurisdiction-tooltip')) {
      tooltip = d3.select("body")
        .append("div")
        .attr("id", "jurisdiction-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("max-width", "220px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
        .style("z-index", 1000);
    } else {
      tooltip = d3.select("#jurisdiction-tooltip");
    }
  }

  // Define key events to annotate (add storytelling context)
  const keyEvents = [
    { year: 2019, description: "NSW implements mobile phone detection cameras", y: -30 },
    { year: 2020, description: "COVID-19 lockdowns reduce traffic volumes", y: -50 },
    { year: 2021, description: "Record enforcement year for most jurisdictions", y: -30 }
  ];

  // Render chart when data is available
  function renderChart() {
    console.log("Rendering jurisdiction line chart with road safety data");
    updateChart();
  }

  // Update chart based on current filter selections
  function updateChart() {
    // Clear previous chart content
    lineChart.selectAll("*").remove();
    
    // Check if data is available
    if (!window.roadSafetyData || !window.roadSafetyData.finesData) {
      console.warn("Road safety data not available for line chart");
      lineChart.append("text")
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
    
    console.log("Updating jurisdiction line chart with filters:", {
      jurisdictions: selectedJurisdictions,
      years: selectedYears,
      methods: selectedMethods
    });
    
    // Get all available years from the data
    const allYears = window.roadSafetyData.finesData.years.sort((a, b) => a - b);
    
    // Process data based on filters
    const processedData = processDataByFilters(selectedJurisdictions, selectedYears, selectedMethods);
    
    // Check if we have data to display
    if (Object.keys(processedData).length === 0) {
      lineChart.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("No data available for the selected filters");
      return;
    }
    
    // Find the maximum fine value for y-axis scale
    const maxFines = d3.max(
      Object.values(processedData).map(jurisdictionData => 
        d3.max(jurisdictionData, d => d.fines)
      )
    );
    
    // Set up scales
    x = d3.scaleLinear()
      .domain([d3.min(allYears), d3.max(allYears)])
      .range([0, width]);
      
    y = d3.scaleLinear()
      .domain([0, maxFines * 1.1]) // Add 10% padding for annotations
      .nice()
      .range([height, 0]);
    
    // Add x-axis
    lineChart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(allYears.filter(y => y % 2 === 0)) // Show every other year
        .tickFormat(d3.format("d")));
    
    // Add y-axis with formatted ticks
    lineChart.append("g")
      .call(d3.axisLeft(y)
        .tickFormat(d => d3.format(",.0f")(d))); // Format with commas
    
    // Add axis labels
    lineChart.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width/2)
      .attr("y", height + 40)
      .text("Year")
      .style("font-size", "12px");
      
    lineChart.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height/2)
      .attr("y", -40)
      .text("Number of Fines")
      .style("font-size", "12px");
    
    // Add grid lines for better readability
    lineChart.append("g")
      .attr("class", "grid")
      .style("stroke-dasharray", "3,3")
      .style("stroke", "#e0e0e0")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      );
    
    // Line generator
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.fines))
      .curve(d3.curveMonotoneX); // Use monotone curve for smoother lines
    
    // Draw a line for each jurisdiction
    Object.keys(processedData).forEach(jurisdiction => {
      // Only draw if we have data for this jurisdiction
      if (processedData[jurisdiction] && processedData[jurisdiction].some(d => d.fines > 0)) {
        // Draw the line
        lineChart.append("path")
          .datum(processedData[jurisdiction])
          .attr("fill", "none")
          .attr("stroke", jurisdictionColors(jurisdiction))
          .attr("stroke-width", 2.5)
          .attr("d", line)
          .attr("class", `line-${jurisdiction}`);
        
        // Add dots for each data point
        lineChart.selectAll(`.dot-${jurisdiction}`)
          .data(processedData[jurisdiction])
          .enter()
          .append("circle")
          .attr("class", `dot-${jurisdiction}`)
          .attr("cx", d => x(d.year))
          .attr("cy", d => y(d.fines))
          .attr("r", 4)
          .attr("fill", jurisdictionColors(jurisdiction))
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .on("mouseover", function(event, d) {
            // Show tooltip
            tooltip.style("visibility", "visible")
              .html(`
                <strong>${stateAbbreviations[d.jurisdiction] || d.jurisdiction}</strong><br>
                Year: ${d.year}<br>
                Fines: ${d.fines.toLocaleString()}
              `);
            
            // Highlight the datapoint
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 6);
          })
          .on("mousemove", function(event) {
            tooltip
              .style("top", (event.pageY - 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          })
          .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 4);
          });
      }
    });
    
    // Add annotations for key events
    keyEvents.forEach(event => {
      // Check if this year is included in our data
      const yearInData = allYears.includes(event.year);
      if (!yearInData) return;
      
      // Find the jurisdiction with the highest fines for this year
      const jurisdictionsWithData = Object.keys(processedData).filter(j => 
        processedData[j].some(d => d.year === event.year && d.fines > 0)
      );
      
      if (jurisdictionsWithData.length === 0) return;
      
      const topJurisdiction = jurisdictionsWithData.sort((a, b) => {
        const aData = processedData[a].find(d => d.year === event.year);
        const bData = processedData[b].find(d => d.year === event.year);
        return (bData?.fines || 0) - (aData?.fines || 0);
      })[0];
      
      if (topJurisdiction) {
        const yearData = processedData[topJurisdiction].find(d => d.year === event.year);
        if (yearData && yearData.fines > 0) {
          // Add annotation line
          lineChart.append("line")
            .attr("class", "annotation-line")
            .attr("x1", x(event.year))
            .attr("x2", x(event.year))
            .attr("y1", y(yearData.fines) - 10)
            .attr("y2", y(yearData.fines) + event.y)
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
          
          // Add annotation background
          lineChart.append("rect")
            .attr("x", x(event.year) - 65)
            .attr("y", y(yearData.fines) + event.y - 20)
            .attr("width", 130)
            .attr("height", 20)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5)
            .attr("rx", 4);
          
          // Add annotation text
          lineChart.append("text")
            .attr("class", "annotation-text")
            .attr("x", x(event.year))
            .attr("y", y(yearData.fines) + event.y - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .text(event.description);
        }
      }
    });
    
    // Add legend
    const legend = lineChart.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 20}, 0)`);
    
    Object.keys(processedData).forEach((jurisdiction, i) => {
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
  }

  // Process data based on selected filters
  function processDataByFilters(selectedJurisdictions, selectedYears, selectedMethods) {
    const finesData = window.roadSafetyData.finesData;
    const allYears = finesData.years.sort((a, b) => a - b);
    
    // Create the result object to store data by jurisdiction
    const result = {};
    
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
    
    // Initialize result with empty arrays for each jurisdiction
    jurisdictions.forEach(jurisdiction => {
      result[jurisdiction] = [];
    });
    
    // Process each year and method
    years.forEach(year => {
      if (finesData.byYearAndMethod[year]) {
        methods.forEach(method => {
          if (finesData.byYearAndMethod[year][method]) {
            // For each jurisdiction, add the fines to the result
            jurisdictions.forEach(jurisdiction => {
              const stateName = stateAbbreviations[jurisdiction];
              
              // Get fines for this jurisdiction, year, and method
              const fines = finesData.byYearAndMethod[year][method][stateName] || 0;
              
              // Find if we already have an entry for this year
              const existingEntry = result[jurisdiction].find(d => d.year === year);
              
              if (existingEntry) {
                // Add to existing entry
                existingEntry.fines += fines;
              } else {
                // Create new entry
                result[jurisdiction].push({
                  jurisdiction,
                  year,
                  fines
                });
              }
            });
          }
        });
      }
    });
    
    // Sort data by year
    Object.keys(result).forEach(jurisdiction => {
      result[jurisdiction].sort((a, b) => a.year - b.year);
      
      // Fill in any missing years with 0 values
      const existingYears = result[jurisdiction].map(d => d.year);
      const missingYears = allYears.filter(year => !existingYears.includes(year));
      
      missingYears.forEach(year => {
        result[jurisdiction].push({
          jurisdiction,
          year,
          fines: 0
        });
      });
      
      // Sort again after adding missing years
      result[jurisdiction].sort((a, b) => a.year - b.year);
    });
    
    // Remove any jurisdictions with no data
    Object.keys(result).forEach(jurisdiction => {
      if (result[jurisdiction].every(d => d.fines === 0)) {
        delete result[jurisdiction];
      }
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
  window.jurisdictionLineChart = {
    update: updateChart
  };
  
  // Hook into global updateCharts function
  const originalUpdateCharts = window.updateCharts || function() {};
  window.updateCharts = function() {
    originalUpdateCharts();
    if (window.jurisdictionLineChart && window.jurisdictionLineChart.update) {
      window.jurisdictionLineChart.update();
    }
  };
});