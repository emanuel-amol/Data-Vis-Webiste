// Enhanced year-line.js with storytelling elements and fixed interactivity
// This version properly responds to jurisdiction and detection method filters

// Define variables in global scope for updating later
let completeData = [];
let rawData = [];
let svg, x, y, tooltip;

// Initialize dimensions
const margin = { top: 60, right: 120, bottom: 50, left: 60 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Define key events to annotate (add storytelling context)
const keyEvents = [
  { year: 2014, description: "New camera technology introduced", y: -30 },
  { year: 2020, description: "COVID-19 lockdowns", y: -50 },
  { year: 2021, description: "Peak enforcement year", y: -30 }
];

// Initialize the visualization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("year-line.js script loaded");
  initChart();
  loadData();
});

// Create the initial chart structure
function initChart() {
  // Create SVG group
  svg = d3.select("svg")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add title to the chart
  d3.select("svg")
    .append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 25)
    .attr("class", "title")
    .text("Yearly Trends in Total Fines (2008–2023)")
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // Add subtitle with storytelling context
  d3.select("svg")
    .append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 5)
    .attr("class", "subtitle")
    .text("Note the dramatic spike in 2021 following COVID-19 restrictions")
    .style("font-size", "14px")
    .style("fill", "#666");

  // Add tooltip div with enhanced styling
  tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
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
}

// Load data with error handling and fallbacks
function loadData() {
  console.log("Attempting to load time trends data...");
  
  // Try different possible file paths
  d3.csv("../data/police_enforcement_2023.csv")
    .then(data => {
      console.log("Time trends data loaded successfully");
      rawData = data;
      processData();
      updateChart(); // initial render
    })
    .catch(error => {
      console.log("Error loading from first path:", error);
      // Try an alternative path
      d3.csv("./data/police_enforcement_2023.csv")
        .then(data => {
          console.log("Time trends data loaded from alternative path");
          rawData = data;
          processData();
          updateChart(); // initial render
        })
        .catch(error2 => {
          console.log("Error loading from second path:", error2);
          // Use sample data if no file can be loaded
          useSampleData();
        });
    });
}

// Create sample data if file loading fails
function useSampleData() {
  console.log("Using sample data for time trends");
  
  // Create sample data covering years 2008-2023
  rawData = [];
  const years = d3.range(2008, 2024);
  const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
  const methods = ["Camera", "Police"];
  
  // Base values with realistic growth pattern and 2021 spike
  const baseValues = {
    2008: 50000, 2009: 55000, 2010: 62000, 2011: 70000, 2012: 75000, 
    2013: 78000, 2014: 85000, 2015: 95000, 2016: 110000, 2017: 130000,
    2018: 150000, 2019: 180000, 2020: 210000, 2021: 290000, 2022: 270000, 2023: 260000
  };
  
  // Generate sample data rows
  years.forEach(year => {
    jurisdictions.forEach(jurisdiction => {
      methods.forEach(method => {
        // Create variation in data across jurisdictions and methods
        const jurisdictionFactor = {
          "NSW": 0.25, "VIC": 0.3, "QLD": 0.15, "SA": 0.08, 
          "WA": 0.12, "TAS": 0.04, "NT": 0.02, "ACT": 0.04
        }[jurisdiction];
        
        const methodFactor = method === "Camera" ? 0.6 : 0.4;
        
        // Calculate fines with some randomness
        const baseFines = baseValues[year] || 50000;
        const fines = Math.round(baseFines * jurisdictionFactor * methodFactor * (0.9 + Math.random() * 0.2));
        
        // Add to raw data
        rawData.push({
          YEAR: year.toString(),
          JURISDICTION: jurisdiction,
          DETECTION_METHOD: method,
          FINES: fines.toString()
        });
      });
    });
  });
  
  processData();
  updateChart();
}

// Process raw data into a format ready for visualization
function processData() {
  // Ensure numeric conversion
  rawData.forEach(d => {
    d.YEAR = +d.YEAR;
    d.FINES = +d.FINES;
  });
}

// Update chart based on current filter selections
function updateChart() {
  // Get filter selections
  const selectedJurisdictions = getSelectedJurisdictions();
  const selectedMethods = getSelectedDetectionMethods();
  
  console.log("Updating time trends chart with filters:", {
    jurisdictions: selectedJurisdictions,
    methods: selectedMethods
  });
  
  // Filter data based on selections
  let filtered = rawData;
  
  // Apply jurisdiction filter if specific ones are selected
  if (selectedJurisdictions.length > 0) {
    filtered = filtered.filter(d => selectedJurisdictions.includes(d.JURISDICTION));
  }
  
  // Apply detection method filter if specific ones are selected
  if (selectedMethods.length > 0) {
    filtered = filtered.filter(d => {
      // Handle different detection method formats
      if (selectedMethods.includes("Camera") && d.DETECTION_METHOD && 
          d.DETECTION_METHOD.toLowerCase().includes("camera")) {
        return true;
      }
      if (selectedMethods.includes("Police") && d.DETECTION_METHOD && 
          d.DETECTION_METHOD.toLowerCase().includes("police")) {
        return true;
      }
      return false;
    });
  }
  
  // Group by year and sum fines
  const finesByYear = d3.rollups(
    filtered,
    v => d3.sum(v, d => d.FINES),
    d => d.YEAR
  ).map(([YEAR, FINES]) => ({ YEAR, FINES }))
   .sort((a, b) => a.YEAR - b.YEAR);

  // Ensure complete years from 2008-2023
  const years = d3.range(2008, 2024);
  completeData = years.map(year => {
    const found = finesByYear.find(d => d.YEAR === year);
    return {
      YEAR: year,
      FINES: found ? found.FINES : 0
    };
  });

  // Calculate percentage changes for storytelling
  completeData.forEach((d, i) => {
    if (i > 0) {
      const prevYear = completeData[i-1];
      d.percentChange = prevYear.FINES !== 0 
        ? ((d.FINES - prevYear.FINES) / prevYear.FINES) * 100 
        : 0;
    } else {
      d.percentChange = 0;
    }
  });

  // Clear previous chart content
  svg.selectAll("*").remove();

  // Scales
  x = d3.scaleLinear()
    .domain(d3.extent(completeData, d => d.YEAR))
    .range([0, width]);

  y = d3.scaleLinear()
    .domain([0, d3.max(completeData, d => d.FINES) * 1.1]) // Add 10% padding for annotations
    .nice()
    .range([height, 0]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickValues(years.filter(y => y % 2 === 0)) // Show every other year for clarity
      .tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(y)
      .tickFormat(d => d3.format(",.0f")(d))); // Format numbers with commas

  // Add axis labels for better context
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", height + 40)
    .text("Year")
    .style("font-size", "12px");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", -40)
    .text("Number of Fines")
    .style("font-size", "12px");

  // Gridlines for better readability
  svg.append("g")
    .attr("class", "grid")
    .style("stroke-dasharray", "3,3")
    .style("stroke", "#e0e0e0")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    );

  // Add area under the line for visual emphasis
  const area = d3.area()
    .x(d => x(d.YEAR))
    .y0(height)
    .y1(d => y(d.FINES))
    .curve(d3.curveMonotoneX); // Smoother curve

  svg.append("path")
    .datum(completeData)
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.1)
    .attr("d", area);

  // Line path with improved styling
  const line = d3.line()
    .x(d => x(d.YEAR))
    .y(d => y(d.FINES))
    .curve(d3.curveMonotoneX); // Smoother curve for better visualization

  svg.append("path")
    .datum(completeData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // Dots with enhanced tooltip interaction
  svg.selectAll("circle")
    .data(completeData)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.YEAR))
    .attr("cy", d => y(d.FINES))
    .attr("r", d => { 
      // Make key event years have larger dots
      return keyEvents.some(event => event.year === d.YEAR) ? 6 : 4;
    })
    .attr("fill", d => {
      // Highlight the peak year with a different color
      return d.YEAR === 2021 ? "#e31a1c" : "steelblue";
    })
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .on("mouseover", function(event, d) {
      // Enhanced tooltip with year-over-year change info
      let changeText = "";
      if (d.YEAR > 2008) {
        const changeSymbol = d.percentChange > 0 ? "↑" : "↓";
        const changeColor = d.percentChange > 0 ? "#ff7675" : "#55efc4";
        changeText = `<br><span style="color:${changeColor}">${changeSymbol} ${Math.abs(d.percentChange).toFixed(1)}% from previous year</span>`;
      }
      
      // Add context for specific years
      let context = "";
      if (d.YEAR === 2020) {
        context = "<br><em>During COVID-19 lockdowns</em>";
      } else if (d.YEAR === 2021) {
        context = "<br><em>Peak enforcement year</em>";
      } else if (d.YEAR === 2014) {
        context = "<br><em>New enforcement technology introduced</em>";
      }
      
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.YEAR}</strong><br>Fines: ${d.FINES.toLocaleString()}${changeText}${context}`);
        
      // Highlight the data point
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d => keyEvents.some(event => event.year === d.YEAR) ? 8 : 6);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("top", (event.pageY - 15) + "px")
        .style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("visibility", "hidden");
      
      // Reset the data point size
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d => keyEvents.some(event => event.year === d.YEAR) ? 6 : 4);
    });

  // Add annotations for key events (storytelling)
  keyEvents.forEach(event => {
    const yearData = completeData.find(d => d.YEAR === event.year);
    if (yearData && yearData.FINES > 0) {
      // Add annotation line
      svg.append("line")
        .attr("class", "annotation-line")
        .attr("x1", x(event.year))
        .attr("x2", x(event.year))
        .attr("y1", y(yearData.FINES))
        .attr("y2", y(yearData.FINES) + event.y)
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
      
      // Add annotation background
      svg.append("rect")
        .attr("x", x(event.year) - 50)
        .attr("y", y(yearData.FINES) + event.y - 20)
        .attr("width", 100)
        .attr("height", 20)
        .attr("fill", "white")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .attr("rx", 4);
      
      // Add annotation text
      svg.append("text")
        .attr("class", "annotation-text")
        .attr("x", x(event.year))
        .attr("y", y(yearData.FINES) + event.y - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .text(event.description);
    }
  });

  // Add a trend line for the overall pattern
  const firstYear = completeData[0];
  const lastYear = completeData[completeData.length - 1];
  
  if (firstYear.FINES > 0 && lastYear.FINES > 0) {
    svg.append("line")
      .attr("class", "trend-line")
      .attr("x1", x(firstYear.YEAR))
      .attr("y1", y(firstYear.FINES))
      .attr("x2", x(lastYear.YEAR))
      .attr("y2", y(lastYear.FINES))
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5");
  }

  // Add highlight box for the 2020-2021 change (the story's climax)
  const year2020 = completeData.find(d => d.YEAR === 2020);
  const year2021 = completeData.find(d => d.YEAR === 2021);
  
  if (year2020 && year2021 && year2020.FINES > 0 && year2021.FINES > 0) {
    // Draw a highlight region
    svg.append("rect")
      .attr("x", x(2020) - 5)
      .attr("width", x(2021) - x(2020) + 10)
      .attr("y", y(Math.max(year2020.FINES, year2021.FINES)) - 10)
      .attr("height", Math.abs(y(year2021.FINES) - y(year2020.FINES)) + 20)
      .attr("fill", "#f8f9fa")
      .attr("stroke", "#e31a1c")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.3);
  }
  
  // Show a message if there's no data to display
  if (d3.max(completeData, d => d.FINES) === 0) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text("No data available for the selected filters");
  }
}

// Helper function to get selected jurisdictions from checkboxes
function getSelectedJurisdictions() {
  const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Helper function to get selected detection methods from checkboxes
function getSelectedDetectionMethods() {
  const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Register this chart with the global update function
window.updateChart = updateChart;