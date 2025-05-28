// jurisdiction-line.js - Interactive line chart for jurisdictional analysis
// This file creates a responsive line chart that shows trends by jurisdiction

let jurisdictionLineData = [];
let jurisdictionLineSvg, jurisdictionLineX, jurisdictionLineY, jurisdictionLineTooltip;

// Chart dimensions
const jurisdictionLineMargin = { top: 60, right: 150, bottom: 50, left: 80 };
const jurisdictionLineWidth = 800 - jurisdictionLineMargin.left - jurisdictionLineMargin.right;
const jurisdictionLineHeight = 500 - jurisdictionLineMargin.top - jurisdictionLineMargin.bottom;

// Color scale for different jurisdictions
const jurisdictionColors = {
  "New South Wales": "#1f77b4",
  "Victoria": "#ff7f0e", 
  "Queensland": "#2ca02c",
  "South Australia": "#d62728",
  "Western Australia": "#9467bd",
  "Tasmania": "#8c564b",
  "Northern Territory": "#e377c2",
  "Australian Capital Territory": "#7f7f7f"
};

// State abbreviation mapping
const stateMapping = {
  "NSW": "New South Wales",
  "VIC": "Victoria", 
  "QLD": "Queensland",
  "SA": "South Australia",
  "WA": "Western Australia",
  "TAS": "Tasmania",
  "NT": "Northern Territory",
  "ACT": "Australian Capital Territory"
};

// Initialize the line chart
function initJurisdictionLineChart() {
  const container = d3.select("#jurisdiction-line-chart");
  container.selectAll("*").remove(); // Clear any existing content
  
  // Create SVG
  const svg = d3.select("#jurisdiction-line-chart")
    .append("svg")
    .attr("width", jurisdictionLineWidth + jurisdictionLineMargin.left + jurisdictionLineMargin.right)
    .attr("height", jurisdictionLineHeight + jurisdictionLineMargin.top + jurisdictionLineMargin.bottom);

  jurisdictionLineSvg = svg.append("g")
    .attr("transform", `translate(${jurisdictionLineMargin.left},${jurisdictionLineMargin.top})`);

  // Add title
  svg.append("text")
    .attr("x", jurisdictionLineMargin.left + jurisdictionLineWidth/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Fine Trends by Jurisdiction (2008-2023)");

  // Add subtitle
  svg.append("text")
    .attr("x", jurisdictionLineMargin.left + jurisdictionLineWidth/2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text("NSW shows dramatic growth from 2020-2021");

  // Create tooltip
  jurisdictionLineTooltip = d3.select("body")
    .append("div")
    .attr("class", "jurisdiction-line-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000");

  loadJurisdictionLineData();
}

// Load and process data
function loadJurisdictionLineData() {
  // Try to load the CSV file
  d3.csv("../data/police_enforcement_2023_fines_20240920.csv")
    .then(data => {
      console.log("Jurisdiction line data loaded successfully");
      jurisdictionLineData = data;
      processJurisdictionLineData();
      updateJurisdictionLineChart();
    })
    .catch(error => {
      console.log("Error loading CSV, trying alternative path:", error);
      // Try alternative path
      d3.csv("./data/police_enforcement_2023_fines_20240920.csv")
        .then(data => {
          console.log("Jurisdiction line data loaded from alternative path");
          jurisdictionLineData = data;
          processJurisdictionLineData();
          updateJurisdictionLineChart();
        })
        .catch(error2 => {
          console.log("Error loading from both paths, using sample data:", error2);
          createJurisdictionLineSampleData();
        });
    });
}

// Create sample data if CSV loading fails
function createJurisdictionLineSampleData() {
  console.log("Creating sample data for jurisdiction line chart");
  
  jurisdictionLineData = [];
  const years = d3.range(2008, 2024);
  const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
  const methods = ["Camera", "Police"];
  
  // Base patterns for different states
  const basePatterns = {
    "NSW": [15000, 18000, 22000, 28000, 35000, 42000, 55000, 70000, 90000, 115000, 145000, 180000, 220000, 310000, 280000, 270000],
    "VIC": [20000, 25000, 32000, 40000, 50000, 62000, 78000, 95000, 115000, 135000, 158000, 180000, 205000, 240000, 235000, 230000],
    "QLD": [8000, 10000, 13000, 16000, 20000, 25000, 32000, 40000, 50000, 62000, 75000, 90000, 105000, 125000, 120000, 115000],
    "SA": [5000, 6000, 7500, 9000, 11000, 13500, 16000, 19000, 23000, 27000, 32000, 38000, 44000, 52000, 50000, 48000],
    "WA": [6000, 7500, 9000, 11000, 13500, 16500, 20000, 24000, 29000, 35000, 42000, 50000, 58000, 68000, 65000, 62000],
    "TAS": [1500, 1800, 2200, 2600, 3100, 3700, 4400, 5200, 6100, 7100, 8200, 9400, 10700, 12200, 11800, 11400],
    "NT": [800, 950, 1100, 1300, 1500, 1750, 2000, 2300, 2650, 3000, 3400, 3850, 4300, 4800, 4600, 4400],
    "ACT": [1200, 1400, 1650, 1900, 2200, 2550, 2950, 3400, 3900, 4450, 5000, 5600, 6250, 6950, 6700, 6450]
  };
  
  years.forEach((year, yearIndex) => {
    jurisdictions.forEach(jurisdiction => {
      methods.forEach(method => {
        const baseValue = basePatterns[jurisdiction][yearIndex];
        const methodFactor = method === "Camera" ? 0.65 : 0.35;
        const fines = Math.round(baseValue * methodFactor * (0.9 + Math.random() * 0.2));
        
        jurisdictionLineData.push({
          YEAR: year.toString(),
          JURISDICTION: jurisdiction,
          DETECTION_METHOD: method,
          FINES: fines.toString()
        });
      });
    });
  });
  
  processJurisdictionLineData();
  updateJurisdictionLineChart();
}

// Process the raw data
function processJurisdictionLineData() {
  jurisdictionLineData.forEach(d => {
    d.YEAR = +d.YEAR;
    d.FINES = +d.FINES;
    d.FULL_STATE_NAME = stateMapping[d.JURISDICTION] || d.JURISDICTION;
  });
}

// Update the chart based on filters
function updateJurisdictionLineChart() {
  if (!jurisdictionLineSvg) return;
  
  // Get selected filters
  const selectedYears = getSelectedYears();
  const selectedMethods = getSelectedDetectionMethods();
  
  console.log("Updating jurisdiction line chart with filters:", {
    years: selectedYears,
    methods: selectedMethods
  });
  
  // Filter data
  let filteredData = jurisdictionLineData;
  
  if (selectedYears.length > 0) {
    filteredData = filteredData.filter(d => selectedYears.includes(d.YEAR.toString()));
  }
  
  if (selectedMethods.length > 0) {
    filteredData = filteredData.filter(d => {
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
  
  // Group data by jurisdiction and year
  const groupedData = d3.rollups(
    filteredData,
    v => d3.sum(v, d => d.FINES),
    d => d.FULL_STATE_NAME,
    d => d.YEAR
  );
  
  // Convert to nested structure
  const jurisdictionData = groupedData.map(([jurisdiction, yearData]) => ({
    jurisdiction,
    values: yearData.map(([year, fines]) => ({ year, fines }))
      .sort((a, b) => a.year - b.year)
  }));
  
  // Clear previous chart
  jurisdictionLineSvg.selectAll("*").remove();
  
  // Set up scales
  const allYears = [...new Set(filteredData.map(d => d.YEAR))].sort();
  const maxFines = d3.max(jurisdictionData, d => d3.max(d.values, v => v.fines));
  
  jurisdictionLineX = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, jurisdictionLineWidth]);
    
  jurisdictionLineY = d3.scaleLinear()
    .domain([0, maxFines * 1.1])
    .nice()
    .range([jurisdictionLineHeight, 0]);
  
  // Add gridlines
  jurisdictionLineSvg.append("g")
    .attr("class", "grid")
    .style("stroke-dasharray", "3,3")
    .style("stroke", "#e0e0e0")
    .call(d3.axisLeft(jurisdictionLineY)
      .tickSize(-jurisdictionLineWidth)
      .tickFormat("")
    );
  
  // Add axes
  jurisdictionLineSvg.append("g")
    .attr("transform", `translate(0,${jurisdictionLineHeight})`)
    .call(d3.axisBottom(jurisdictionLineX)
      .tickFormat(d3.format("d")));
      
  jurisdictionLineSvg.append("g")
    .call(d3.axisLeft(jurisdictionLineY)
      .tickFormat(d => d3.format(",.0f")(d)));
  
  // Add axis labels
  jurisdictionLineSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", jurisdictionLineWidth/2)
    .attr("y", jurisdictionLineHeight + 40)
    .text("Year")
    .style("font-size", "12px");
    
  jurisdictionLineSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -jurisdictionLineHeight/2)
    .attr("y", -50)
    .text("Number of Fines")
    .style("font-size", "12px");
  
  // Line generator
  const line = d3.line()
    .x(d => jurisdictionLineX(d.year))
    .y(d => jurisdictionLineY(d.fines))
    .curve(d3.curveMonotoneX);
  
  // Draw lines for each jurisdiction
  jurisdictionData.forEach(d => {
    if (d.values.length > 0) {
      const color = jurisdictionColors[d.jurisdiction] || "#999";
      
      // Draw line
      jurisdictionLineSvg.append("path")
        .datum(d.values)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", d.jurisdiction === "New South Wales" || d.jurisdiction === "Victoria" ? 3 : 2)
        .attr("d", line)
        .style("opacity", 0.8)
        // Tooltip for the line itself
        .on("mousemove", function(event) {
          const [mx] = d3.pointer(event);
          // Find the closest year (x value)
          const x0 = jurisdictionLineX.invert(mx);
          const bisect = d3.bisector(p => p.year).left;
          const i = bisect(d.values, x0);
          const point = d.values[Math.min(i, d.values.length - 1)];
          jurisdictionLineTooltip
            .style("visibility", "visible")
            .html(`<strong>${d.jurisdiction}</strong><br>Year: ${point.year}<br>Fines: ${point.fines.toLocaleString()}`)
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function() {
          jurisdictionLineTooltip.style("visibility", "hidden");
        });
      
      // Add dots
      jurisdictionLineSvg.selectAll(`.dots-${d.jurisdiction.replace(/\s+/g, '-')}`)
        .data(d.values)
        .enter()
        .append("circle")
        .attr("class", `dots-${d.jurisdiction.replace(/\s+/g, '-')}`)
        .attr("cx", v => jurisdictionLineX(v.year))
        .attr("cy", v => jurisdictionLineY(v.fines))
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, v) {
          jurisdictionLineTooltip.style("visibility", "visible")
            .html(`<strong>${d.jurisdiction}</strong><br>Year: ${v.year}<br>Fines: ${v.fines.toLocaleString()}`);
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 6);
        })
        .on("mousemove", function(event) {
          jurisdictionLineTooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
          jurisdictionLineTooltip.style("visibility", "hidden");
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 4);
        });
    }
  });
  
  // Add legend
  const legend = jurisdictionLineSvg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${jurisdictionLineWidth + 20}, 20)`);
  
  const legendItems = legend.selectAll(".legend-item")
    .data(jurisdictionData.filter(d => d.values.length > 0))
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);
  
  legendItems.append("line")
    .attr("x1", 0)
    .attr("x2", 15)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", d => jurisdictionColors[d.jurisdiction] || "#999")
    .attr("stroke-width", 2);
  
  legendItems.append("text")
    .attr("x", 20)
    .attr("y", 0)
    .attr("dy", "0.35em")
    .style("font-size", "12px")
    .text(d => d.jurisdiction.length > 15 ? d.jurisdiction.substring(0, 12) + "..." : d.jurisdiction);
  
  // Show message if no data
  if (jurisdictionData.length === 0 || jurisdictionData.every(d => d.values.length === 0)) {
    jurisdictionLineSvg.append("text")
      .attr("x", jurisdictionLineWidth / 2)
      .attr("y", jurisdictionLineHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("No data available for selected filters");
  }
}

// Helper functions
function getSelectedYears() {
  const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedDetectionMethods() {
  const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if we're on the jurisdictions page and the line chart container exists
  if (document.getElementById('jurisdiction-line-chart')) {
    console.log("Initializing jurisdiction line chart");
    initJurisdictionLineChart();
  }
});

// Register update function globally
window.updateJurisdictionLineChart = updateJurisdictionLineChart;


