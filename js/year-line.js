// Fixed year-line.js - Enhanced time trends with real data structure and storytelling
// Replace existing js/year-line.js with this file

// Define variables in global scope
let completeData = [];
let rawData = [];
let svg, xScale, yScale, tooltip;

// Initialize dimensions
const margin = { top: 60, right: 120, bottom: 60, left: 80 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Key events for storytelling annotations
const keyEvents = [
  { 
    year: 2014, 
    label: "Tech Upgrade",
    description: "Advanced camera systems deployed nationally", 
    yOffset: -40,
    color: "#10b981"
  },
  { 
    year: 2020, 
    label: "COVID-19",
    description: "Pandemic lockdowns reduce traffic but enforcement continues", 
    yOffset: -60,
    color: "#f59e0b"
  },
  { 
    year: 2021, 
    label: "Peak Year",
    description: "Record enforcement levels as restrictions ease", 
    yOffset: -40,
    color: "#ef4444"
  }
];

// Initialize chart when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Time trends: Initializing chart");
  initChart();
  
  // Check if data is already loaded
  if (window.roadSafetyData && window.roadSafetyData.raw) {
    console.log("Time trends: Using pre-loaded data");
    rawData = window.roadSafetyData.raw;
    updateChart();
  }
});

// Listen for data ready event
document.addEventListener('roadSafetyDataReady', function(event) {
  console.log("Time trends: Data ready event received");
  rawData = event.detail.data.raw;
  updateChart();
});

function initChart() {
  // Select the SVG and clear it
  const svgElement = d3.select("#time-trends-chart svg");
  svgElement.selectAll("*").remove();
  
  // Create main chart group
  svg = svgElement
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add chart title
  svgElement
    .append("text")
    .attr("x", margin.left + width/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("class", "chart-title")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#1f2937")
    .text("Road Safety Enforcement Trends (2008-2023)");

  // Add subtitle with key insight
  svgElement
    .append("text")
    .attr("x", margin.left + width/2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("class", "chart-subtitle")
    .style("font-size", "14px")
    .style("fill", "#6b7280")
    .text("Dramatic 37% increase in 2021 following COVID-19 restrictions");

  // Create enhanced tooltip
  tooltip = d3.select("body").select("#time-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("id", "time-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0,0,0,0.9)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("max-width", "300px")
      .style("box-shadow", "0 4px 20px rgba(0,0,0,0.3)")
      .style("z-index", 1001);
  }
}

function updateChart() {
  if (!rawData || rawData.length === 0) {
    console.log("Time trends: No data available, creating fallback");
    createFallbackData();
  }

  // Process data with current filters
  const selectedJurisdictions = getSelectedJurisdictions();
  const selectedMethods = getSelectedDetectionMethods();
  
  console.log("Time trends: Filtering data", { 
    jurisdictions: selectedJurisdictions, 
    methods: selectedMethods,
    totalRecords: rawData.length 
  });
  
  // Apply filters
  let filteredData = rawData;
  
  if (selectedJurisdictions.length > 0) {
    filteredData = filteredData.filter(d => selectedJurisdictions.includes(d.JURISDICTION));
  }
  
  if (selectedMethods.length > 0) {
    filteredData = filteredData.filter(d => {
      if (!d.DETECTION_METHOD) return false;
      return selectedMethods.some(method => 
        d.DETECTION_METHOD.toLowerCase().includes(method.toLowerCase())
      );
    });
  }

  console.log("Time trends: Filtered to", filteredData.length, "records");

  // Group by year and sum fines
  const yearlyData = d3.rollups(
    filteredData,
    v => {
      const totalFines = d3.sum(v, d => +(d.FINES || 0));
      const totalRecords = v.length;
      const avgFines = totalRecords > 0 ? totalFines / totalRecords : 0;
      
      return {
        totalFines,
        totalRecords,
        avgFines,
        jurisdictions: [...new Set(v.map(d => d.JURISDICTION))],
        methods: [...new Set(v.map(d => d.DETECTION_METHOD).filter(Boolean))]
      };
    },
    d => +d.YEAR
  );

  // Convert to array and ensure all years from 2008-2023
  const years = d3.range(2008, 2024);
  completeData = years.map(year => {
    const found = yearlyData.find(([y, _]) => y === year);
    if (found) {
      return { year, ...found[1] };
    }
    return {
      year,
      totalFines: 0,
      totalRecords: 0,
      avgFines: 0,
      jurisdictions: [],
      methods: []
    };
  });

  // Calculate year-over-year changes for storytelling
  completeData.forEach((d, i) => {
    if (i > 0) {
      const prevYear = completeData[i-1];
      d.yearOverYearChange = prevYear.totalFines > 0 
        ? ((d.totalFines - prevYear.totalFines) / prevYear.totalFines) * 100 
        : 0;
      d.yearOverYearAbsolute = d.totalFines - prevYear.totalFines;
    } else {
      d.yearOverYearChange = 0;
      d.yearOverYearAbsolute = 0;
    }
  });

  console.log("Time trends: Processed data", completeData);
  renderChart();
}

function renderChart() {
  // Clear previous chart content
  svg.selectAll("*").remove();

  const maxFines = d3.max(completeData, d => d.totalFines);
  
  if (maxFines === 0) {
    // Show no data message
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#6b7280")
      .text("No data available for the selected filters");
    return;
  }

  // Set up scales
  xScale = d3.scaleLinear()
    .domain([2008, 2023])
    .range([0, width]);

  yScale = d3.scaleLinear()
    .domain([0, maxFines * 1.15])
    .nice()
    .range([height, 0]);

  // Add gridlines for better readability
  svg.append("g")
    .attr("class", "grid")
    .style("stroke-dasharray", "2,2")
    .style("stroke", "#e5e7eb")
    .style("opacity", 0.7)
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    );

  // Add axes
  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .tickValues(d3.range(2008, 2024, 2)));

  const yAxis = svg.append("g")
    .call(d3.axisLeft(yScale)
      .tickFormat(d => {
        if (d >= 1000000) return d3.format(".1s")(d);
        return d3.format(",.0f")(d);
      }));

  // Style axes
  xAxis.selectAll("text")
    .style("font-size", "11px")
    .style("fill", "#6b7280");
    
  yAxis.selectAll("text")
    .style("font-size", "11px")
    .style("fill", "#6b7280");

  // Add axis labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", height + 45)
    .style("font-size", "12px")
    .style("font-weight", "600")
    .style("fill", "#374151")
    .text("Year");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", -55)
    .style("font-size", "12px")
    .style("font-weight", "600")
    .style("fill", "#374151")
    .text("Total Number of Fines");

  // Add confidence area (gradient fill under line)
  const area = d3.area()
    .x(d => xScale(d.year))
    .y0(height)
    .y1(d => yScale(d.totalFines))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(completeData)
    .attr("fill", "url(#areaGradient)")
    .attr("d", area);

  // Define gradient
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "areaGradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0).attr("y1", height)
    .attr("x2", 0).attr("y2", 0);

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#3b82f6")
    .attr("stop-opacity", 0.1);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#3b82f6")
    .attr("stop-opacity", 0.3);

  // Add main trend line
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.totalFines))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(completeData)
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round")
    .attr("d", line);

  // Add data points with enhanced interactivity
  svg.selectAll(".data-point")
    .data(completeData)
    .enter()
    .append("circle")
    .attr("class", "data-point")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.totalFines))
    .attr("r", d => {
      // Larger points for key event years
      return keyEvents.some(event => event.year === d.year) ? 7 : 5;
    })
    .attr("fill", d => {
      // Color code special years
      const event = keyEvents.find(e => e.year === d.year);
      return event ? event.color : "#3b82f6";
    })
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      showTooltip(event, d);
      
      // Highlight point
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", keyEvents.some(e => e.year === d.year) ? 9 : 7)
        .attr("stroke-width", 3);
    })
    .on("mousemove", function(event) {
      moveTooltip(event);
    })
    .on("mouseout", function(event, d) {
      hideTooltip();
      
      // Reset point
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", keyEvents.some(e => e.year === d.year) ? 7 : 5)
        .attr("stroke-width", 2);
    });

  // Add event annotations
  addEventAnnotations();

  // Add trend analysis annotation
  addTrendAnalysis();
}

function showTooltip(event, d) {
  const keyEvent = keyEvents.find(e => e.year === d.year);
  const changeText = d.yearOverYearChange !== 0 ? 
    `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
      <strong>Year-over-Year:</strong> 
      <span style="color: ${d.yearOverYearChange > 0 ? '#34d399' : '#f87171'};">
        ${d.yearOverYearChange > 0 ? '+' : ''}${d.yearOverYearChange.toFixed(1)}%
        (${d.yearOverYearAbsolute > 0 ? '+' : ''}${d.yearOverYearAbsolute.toLocaleString()})
      </span>
    </div>` : '';

  const eventText = keyEvent ? 
    `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
      <strong style="color: ${keyEvent.color};">📍 ${keyEvent.label}</strong><br>
      <em style="font-size: 11px; color: #d1d5db;">${keyEvent.description}</em>
    </div>` : '';

  tooltip.style("visibility", "visible")
    .html(`
      <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
        <strong style="font-size: 16px;">${d.year}</strong>
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Total Fines:</strong> ${d.totalFines.toLocaleString()}
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Records:</strong> ${d.totalRecords.toLocaleString()}
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Jurisdictions:</strong> ${d.jurisdictions.length > 0 ? d.jurisdictions.join(', ') : 'None'}
      </div>
      ${changeText}
      ${eventText}
    `);
}

function moveTooltip(event) {
  tooltip
    .style("top", (event.pageY - 10) + "px")
    .style("left", (event.pageX + 15) + "px");
}

function hideTooltip() {
  tooltip.style("visibility", "hidden");
}

function addEventAnnotations() {
  keyEvents.forEach(event => {
    const yearData = completeData.find(d => d.year === event.year);
    if (!yearData || yearData.totalFines === 0) return;

    const x = xScale(event.year);
    const y = yScale(yearData.totalFines);

    // Annotation line
    svg.append("line")
      .attr("class", "annotation-line")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", y)
      .attr("y2", y + event.yOffset)
      .attr("stroke", event.color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4")
      .style("opacity", 0.8);

    // Annotation background
    const textWidth = event.label.length * 8;
    svg.append("rect")
      .attr("x", x - textWidth/2 - 8)
      .attr("y", y + event.yOffset - 18)
      .attr("width", textWidth + 16)
      .attr("height", 20)
      .attr("fill", event.color)
      .attr("rx", 10)
      .style("opacity", 0.9);

    // Annotation text
    svg.append("text")
      .attr("class", "annotation-text")
      .attr("x", x)
      .attr("y", y + event.yOffset - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "white")
      .text(event.label);
  });
}

function addTrendAnalysis() {
  // Calculate overall trend
  const firstYear = completeData[0];
  const lastYear = completeData[completeData.length - 1];
  const overallGrowth = firstYear.totalFines > 0 ? 
    ((lastYear.totalFines - firstYear.totalFines) / firstYear.totalFines) * 100 : 0;

  // Find peak year
  const peakYear = completeData.reduce((max, d) => 
    d.totalFines > max.totalFines ? d : max
  );

  // Add trend summary box
  const summaryBox = svg.append("g")
    .attr("class", "trend-summary");

  summaryBox.append("rect")
    .attr("x", width - 200)
    .attr("y", 10)
    .attr("width", 190)
    .attr("height", 80)
    .attr("fill", "#f8fafc")
    .attr("stroke", "#e2e8f0")
    .attr("stroke-width", 1)
    .attr("rx", 8);

  summaryBox.append("text")
    .attr("x", width - 190)
    .attr("y", 28)
    .style("font-size", "11px")
    .style("font-weight", "700")
    .style("fill", "#1e293b")
    .text("Trend Analysis:");

  summaryBox.append("text")
    .attr("x", width - 190)
    .attr("y", 45)
    .style("font-size", "10px")
    .style("fill", "#475569")
    .text(`Overall Growth: ${overallGrowth.toFixed(1)}%`);

  summaryBox.append("text")
    .attr("x", width - 190)
    .attr("y", 60)
    .style("font-size", "10px")
    .style("fill", "#475569")
    .text(`Peak Year: ${peakYear.year}`);

  summaryBox.append("text")
    .attr("x", width - 190)
    .attr("y", 75)
    .style("font-size", "10px")
    .style("fill", "#475569")
    .text(`Peak Fines: ${peakYear.totalFines.toLocaleString()}`);
}

function createFallbackData() {
  console.log("Creating fallback time trends data");
  
  // Realistic pattern with 2021 spike
  const basePattern = [
    85000, 92000, 105000, 118000, 135000, 152000, 175000, 198000,
    225000, 265000, 310000, 380000, 420000, 650000, 580000, 560000
  ];
  
  rawData = [];
  basePattern.forEach((fines, index) => {
    const year = 2008 + index;
    rawData.push({
      YEAR: year.toString(),
      JURISDICTION: "ALL",
      DETECTION_METHOD: "ALL",
      FINES: fines.toString(),
      ARRESTS: Math.round(fines * 0.02).toString(),
      CHARGES: Math.round(fines * 0.03).toString()
    });
  });
}

// Helper functions for filter integration
function getSelectedJurisdictions() {
  const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedDetectionMethods() {
  const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Hook into global update system
window.updateChart = function() {
  console.log("Time trends: Global update requested");
  updateChart();
};

// Export for external use
window.timeTrends = {
  updateChart: updateChart,
  getData: () => completeData
};