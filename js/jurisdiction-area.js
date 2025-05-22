// jurisdiction-area.js - Interactive stacked area chart for jurisdictional analysis
// This file creates a responsive stacked area chart showing relative contributions

let jurisdictionAreaData = [];
let jurisdictionAreaSvg, jurisdictionAreaX, jurisdictionAreaY, jurisdictionAreaTooltip;

// Chart dimensions
const jurisdictionAreaMargin = { top: 60, right: 150, bottom: 50, left: 80 };
const jurisdictionAreaWidth = 800 - jurisdictionAreaMargin.left - jurisdictionAreaMargin.right;
const jurisdictionAreaHeight = 500 - jurisdictionAreaMargin.top - jurisdictionAreaMargin.bottom;

// Color scale for different jurisdictions (same as line chart for consistency)
const areaJurisdictionColors = {
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
const areaStateMapping = {
  "NSW": "New South Wales",
  "VIC": "Victoria", 
  "QLD": "Queensland",
  "SA": "South Australia",
  "WA": "Western Australia",
  "TAS": "Tasmania",
  "NT": "Northern Territory",
  "ACT": "Australian Capital Territory"
};

// Initialize the area chart
function initJurisdictionAreaChart() {
  const container = d3.select("#jurisdiction-area-chart");
  container.selectAll("*").remove(); // Clear any existing content
  
  // Create SVG
  const svg = d3.select("#jurisdiction-area-chart")
    .append("svg")
    .attr("width", jurisdictionAreaWidth + jurisdictionAreaMargin.left + jurisdictionAreaMargin.right)
    .attr("height", jurisdictionAreaHeight + jurisdictionAreaMargin.top + jurisdictionAreaMargin.bottom);

  jurisdictionAreaSvg = svg.append("g")
    .attr("transform", `translate(${jurisdictionAreaMargin.left},${jurisdictionAreaMargin.top})`);

  // Add title
  svg.append("text")
    .attr("x", jurisdictionAreaMargin.left + jurisdictionAreaWidth/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Relative Contribution by Jurisdiction (2008-2023)");

  // Add subtitle
  svg.append("text")
    .attr("x", jurisdictionAreaMargin.left + jurisdictionAreaWidth/2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text("Shows each jurisdiction's share of total enforcement activity");

  // Create tooltip
  jurisdictionAreaTooltip = d3.select("body")
    .append("div")
    .attr("class", "jurisdiction-area-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000");

  loadJurisdictionAreaData();
}

// Load and process data (reuse the same data loading logic)
function loadJurisdictionAreaData() {
  // Try to load the CSV file
  d3.csv("../data/police_enforcement_2023_fines_20240920.csv")
    .then(data => {
      console.log("Jurisdiction area data loaded successfully");
      jurisdictionAreaData = data;
      processJurisdictionAreaData();
      updateJurisdictionAreaChart();
    })
    .catch(error => {
      console.log("Error loading CSV, trying alternative path:", error);
      // Try alternative path
      d3.csv("./data/police_enforcement_2023_fines_20240920.csv")
        .then(data => {
          console.log("Jurisdiction area data loaded from alternative path");
          jurisdictionAreaData = data;
          processJurisdictionAreaData();
          updateJurisdictionAreaChart();
        })
        .catch(error2 => {
          console.log("Error loading from both paths, using sample data:", error2);
          createJurisdictionAreaSampleData();
        });
    });
}

// Create sample data if CSV loading fails
function createJurisdictionAreaSampleData() {
  console.log("Creating sample data for jurisdiction area chart");
  
  jurisdictionAreaData = [];
  const years = d3.range(2008, 2024);
  const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
  const methods = ["Camera", "Police"];
  
  // Base patterns for different states (same as line chart)
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
        
        jurisdictionAreaData.push({
          YEAR: year.toString(),
          JURISDICTION: jurisdiction,
          DETECTION_METHOD: method,
          FINES: fines.toString()
        });
      });
    });
  });
  
  processJurisdictionAreaData();
  updateJurisdictionAreaChart();
}

// Process the raw data
function processJurisdictionAreaData() {
  jurisdictionAreaData.forEach(d => {
    d.YEAR = +d.YEAR;
    d.FINES = +d.FINES;
    d.FULL_STATE_NAME = areaStateMapping[d.JURISDICTION] || d.JURISDICTION;
  });
}

// Update the chart based on filters
function updateJurisdictionAreaChart() {
  if (!jurisdictionAreaSvg) return;
  
  // Get selected filters
  const selectedYears = getSelectedAreaYears();
  const selectedMethods = getSelectedAreaDetectionMethods();
  
  console.log("Updating jurisdiction area chart with filters:", {
    years: selectedYears,
    methods: selectedMethods
  });
  
  // Filter data
  let filteredData = jurisdictionAreaData;
  
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
  
  // Group data by year and jurisdiction
  const yearlyData = d3.rollups(
    filteredData,
    v => d3.sum(v, d => d.FINES),
    d => d.YEAR,
    d => d.FULL_STATE_NAME
  );
  
  // Convert to format suitable for stacked area chart
  const processedData = yearlyData.map(([year, jurisdictionMap]) => {
    const yearData = { year };
    jurisdictionMap.forEach(([jurisdiction, fines]) => {
      yearData[jurisdiction] = fines;
    });
    return yearData;
  }).sort((a, b) => a.year - b.year);
  
  // Get all jurisdictions present in the data
  const allJurisdictions = [...new Set(filteredData.map(d => d.FULL_STATE_NAME))];
  
  // Fill missing values with 0
  processedData.forEach(d => {
    allJurisdictions.forEach(jurisdiction => {
      if (!d[jurisdiction]) d[jurisdiction] = 0;
    });
  });
  
  // Clear previous chart
  jurisdictionAreaSvg.selectAll("*").remove();
  
  if (processedData.length === 0) {
    jurisdictionAreaSvg.append("text")
      .attr("x", jurisdictionAreaWidth / 2)
      .attr("y", jurisdictionAreaHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("No data available for selected filters");
    return;
  }
  
  // Set up scales
  jurisdictionAreaX = d3.scaleLinear()
    .domain(d3.extent(processedData, d => d.year))
    .range([0, jurisdictionAreaWidth]);
  
  // Calculate max total for each year
  const maxTotal = d3.max(processedData, d => {
    return d3.sum(allJurisdictions, jurisdiction => d[jurisdiction] || 0);
  });
  
  jurisdictionAreaY = d3.scaleLinear()
    .domain([0, maxTotal])
    .nice()
    .range([jurisdictionAreaHeight, 0]);
  
  // Create stack generator
  const stack = d3.stack()
    .keys(allJurisdictions)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  const stackedData = stack(processedData);
  
  // Add gridlines
  jurisdictionAreaSvg.append("g")
    .attr("class", "grid")
    .style("stroke-dasharray", "3,3")
    .style("stroke", "#e0e0e0")
    .call(d3.axisLeft(jurisdictionAreaY)
      .tickSize(-jurisdictionAreaWidth)
      .tickFormat("")
    );
  
  // Add axes
  jurisdictionAreaSvg.append("g")
    .attr("transform", `translate(0,${jurisdictionAreaHeight})`)
    .call(d3.axisBottom(jurisdictionAreaX)
      .tickFormat(d3.format("d")));
      
  jurisdictionAreaSvg.append("g")
    .call(d3.axisLeft(jurisdictionAreaY)
      .tickFormat(d => d3.format(",.0f")(d)));
  
  // Add axis labels
  jurisdictionAreaSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", jurisdictionAreaWidth/2)
    .attr("y", jurisdictionAreaHeight + 40)
    .text("Year")
    .style("font-size", "12px");
    
  jurisdictionAreaSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -jurisdictionAreaHeight/2)
    .attr("y", -50)
    .text("Number of Fines")
    .style("font-size", "12px");
  
  // Area generator
  const area = d3.area()
    .x(d => jurisdictionAreaX(d.data.year))
    .y0(d => jurisdictionAreaY(d[0]))
    .y1(d => jurisdictionAreaY(d[1]))
    .curve(d3.curveMonotoneX);
  
  // Draw areas for each jurisdiction
  jurisdictionAreaSvg.selectAll(".area")
    .data(stackedData)
    .enter()
    .append("path")
    .attr("class", "area")
    .attr("d", area)
    .attr("fill", d => areaJurisdictionColors[d.key] || "#999")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .style("opacity", 0.8)
    .on("mouseover", function(event, d) {
      // Highlight the area
      d3.select(this)
        .style("opacity", 1)
        .attr("stroke-width", 2);
      
      // Show tooltip with jurisdiction info
      const mouseX = d3.pointer(event, this)[0];
      const year = Math.round(jurisdictionAreaX.invert(mouseX));
      const yearData = processedData.find(yd => yd.year === year);
      
      if (yearData) {
        const fines = yearData[d.key] || 0;
        const total = d3.sum(allJurisdictions, j => yearData[j] || 0);
        const percentage = total > 0 ? ((fines / total) * 100).toFixed(1) : 0;
        
        jurisdictionAreaTooltip.style("visibility", "visible")
          .html(`<strong>${d.key}</strong><br>Year: ${year}<br>Fines: ${fines.toLocaleString()}<br>Share: ${percentage}%`);
      }
    })
    .on("mousemove", function(event) {
      jurisdictionAreaTooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
      // Reset area appearance
      d3.select(this)
        .style("opacity", 0.8)
        .attr("stroke-width", 0.5);
      
      jurisdictionAreaTooltip.style("visibility", "hidden");
    });
  
  // Add legend
  const legend = jurisdictionAreaSvg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${jurisdictionAreaWidth + 20}, 20)`);
  
  const legendItems = legend.selectAll(".legend-item")
    .data(allJurisdictions.filter(j => stackedData.find(s => s.key === j)))
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);
  
  legendItems.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => areaJurisdictionColors[d] || "#999")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5);
  
  legendItems.append("text")
    .attr("x", 20)
    .attr("y", 12)
    .style("font-size", "12px")
    .text(d => d.length > 15 ? d.substring(0, 12) + "..." : d);
  
  // Add annotations for key insights
  const peakYear = processedData.reduce((max, d) => {
    const total = d3.sum(allJurisdictions, j => d[j] || 0);
    return total > (max.total || 0) ? { year: d.year, total } : max;
  }, {});
  
  if (peakYear.year) {
    jurisdictionAreaSvg.append("line")
      .attr("x1", jurisdictionAreaX(peakYear.year))
      .attr("x2", jurisdictionAreaX(peakYear.year))
      .attr("y1", 0)
      .attr("y2", jurisdictionAreaHeight)
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5");
    
    jurisdictionAreaSvg.append("text")
      .attr("x", jurisdictionAreaX(peakYear.year))
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text(`Peak: ${peakYear.year}`);
  }
}

// Helper functions
function getSelectedAreaYears() {
  const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedAreaDetectionMethods() {
  const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if we're on the jurisdictions page and the area chart container exists
  if (document.getElementById('jurisdiction-area-chart')) {
    console.log("Initializing jurisdiction area chart");
    initJurisdictionAreaChart();
  }
});

// Register update function globally
window.updateJurisdictionAreaChart = updateJurisdictionAreaChart;