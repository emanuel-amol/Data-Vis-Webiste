// Enhanced age-bar.js with storytelling elements
// Replace your existing file in the js folder

const margin = { top: 60, right: 120, bottom: 50, left: 60 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create chart group
const svg = d3.select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add meaningful title with insight
d3.select("svg")
  .append("text")
  .attr("x", margin.left)
  .attr("y", margin.top - 25)
  .attr("class", "title")
  .text("Distribution of Fines Across Age Groups")
  .style("font-size", "18px")
  .style("font-weight", "bold");

// Add subtitle with insight
d3.select("svg")
  .append("text")
  .attr("x", margin.left)
  .attr("y", margin.top - 5)
  .attr("class", "subtitle")
  .text("Middle-aged adults receive more fines than young drivers")
  .style("font-size", "14px")
  .style("fill", "#666");

// Add tooltip for interactive storytelling
const tooltip = d3.select("body")
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
  .style("max-width", "250px")
  .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
  .style("z-index", 1000);

const ageOrder = ["0-16", "17-25", "26-39", "40-64", "65 and over"];
let rawData = []; // store full data

// Age group context for storytelling
const ageContext = {
  "0-16": "Not legally able to drive in most cases",
  "17-25": "New drivers, often believed to be highest risk",
  "26-39": "Young adults, typically gaining driving experience",
  "40-64": "Middle-aged adults with substantial driving experience",
  "65 and over": "Senior drivers with decades of experience"
};

// Load data once - Handle possible file paths
function loadData() {
  console.log("Attempting to load data...");
  // Try different possible file paths
  d3.csv("../data/police_enforcement_2023.csv")
    .then(data => {
      console.log("Data loaded from /data");
      rawData = data;
      updateChart(); // initial render
    })
    .catch(error => {
      console.log("Error loading from first path:", error);
      // Try an alternative path
      d3.csv("./data/police_enforcement_2023.csv")
        .then(data => {
          console.log("Data loaded from ./data");
          rawData = data;
          updateChart(); // initial render
        })
        .catch(error2 => {
          console.log("Error loading from second path:", error2);
          // Use sample data if no file can be loaded
          useSampleData();
        });
    });
}

// Fallback to sample data if CSV cannot be loaded
function useSampleData() {
  console.log("Using sample data as fallback");
  rawData = [
    {AGE_GROUP: "0-16", FINES: "5000", JURISDICTION: "NSW"},
    {AGE_GROUP: "17-25", FINES: "298300", JURISDICTION: "NSW"},
    {AGE_GROUP: "17-25", FINES: "150000", JURISDICTION: "VIC"},
    {AGE_GROUP: "26-39", FINES: "230000", JURISDICTION: "NSW"},
    {AGE_GROUP: "26-39", FINES: "200000", JURISDICTION: "VIC"},
    {AGE_GROUP: "40-64", FINES: "354750", JURISDICTION: "NSW"},
    {AGE_GROUP: "40-64", FINES: "250000", JURISDICTION: "VIC"},
    {AGE_GROUP: "65 and over", FINES: "120000", JURISDICTION: "NSW"},
    {AGE_GROUP: "65 and over", FINES: "80000", JURISDICTION: "VIC"}
  ];
  updateChart();
}

// Load data when DOM is ready
document.addEventListener('DOMContentLoaded', loadData);

// ✅ This function filters & renders chart based on selected jurisdictions
function updateChart() {
  // Set default data if rawData is empty
  if (!rawData || rawData.length === 0) {
    useSampleData();
    return;
  }

  const selectedJurisdictions = Array.from(
    document.querySelectorAll('#checkbox-list input[type="checkbox"]:checked')
  )
    .map(cb => cb.value)
    .filter(v => v !== "All");

  // Filter data by jurisdiction
  const filtered = rawData.filter(d =>
    selectedJurisdictions.length === 0 || selectedJurisdictions.includes(d.JURISDICTION)
  );

  // Group by AGE_GROUP and sum FINES
  const groupedData = d3.rollups(
    filtered,
    v => d3.sum(v, d => +d.FINES),
    d => d.AGE_GROUP
  ).map(([AGE_GROUP, total]) => ({
    AGE_GROUP,
    FINES: total
  })).filter(d => ageOrder.includes(d.AGE_GROUP));

  // Ensure ordered groups with 0s where missing
  const orderedData = ageOrder.map(group => {
    const found = groupedData.find(d => d.AGE_GROUP === group);
    return {
      AGE_GROUP: group,
      FINES: found ? found.FINES : 0
    };
  });

  // Clear previous chart
  svg.selectAll("*").remove();

  // Scales
  const x = d3.scaleBand()
    .domain(ageOrder)
    .range([0, width])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(orderedData, d => d.FINES) * 1.1]) // Add padding for annotations
    .nice()
    .range([height, 0]);

  // Gridlines for easier data reading
  svg.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.3)
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    );

  // Axes with better formatting
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-weight", d => d === "40-64" ? "bold" : "normal"); // Highlight key age group

  svg.append("g")
    .call(d3.axisLeft(y)
      .tickFormat(d => d3.format(",.0f")(d))); // Format numbers with commas

  // Add axis labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", height + 40)
    .text("Age Group")
    .style("font-size", "12px");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", -40)
    .text("Number of Fines")
    .style("font-size", "12px");

  // Enhanced color scale for storytelling
  const colorScale = d3.scaleOrdinal()
    .domain(ageOrder)
    .range(["#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]);

  // Bars with storytelling enhancements
  svg.selectAll(".bar")
    .data(orderedData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.AGE_GROUP))
    .attr("y", d => y(d.FINES))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.FINES))
    .attr("fill", d => d.AGE_GROUP === "40-64" ? "#e31a1c" : colorScale(d.AGE_GROUP)) // Highlight key finding
    .attr("stroke", d => d.AGE_GROUP === "40-64" ? "#c00" : "none")
    .attr("stroke-width", d => d.AGE_GROUP === "40-64" ? 1 : 0)
    .on("mouseover", function(event, d) {
      // Show tooltip with context
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.AGE_GROUP}</strong><br>
          Fines: ${d.FINES.toLocaleString()}<br>
          <em>${ageContext[d.AGE_GROUP]}</em>
        `);
      
      // Highlight the bar
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.8);
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
        .attr("opacity", 1);
    });

  // Value labels
  svg.selectAll(".label")
    .data(orderedData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.AGE_GROUP) + x.bandwidth() / 2)
    .attr("y", d => y(d.FINES) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", d => d.AGE_GROUP === "40-64" ? "bold" : "normal")
    .text(d => d.FINES.toLocaleString());

  // Add a contextual story box
  svg.append("rect")
    .attr("x", width - 200)
    .attr("y", 10)
    .attr("width", 190)
    .attr("height", 100)
    .attr("fill", "#f8f9fa")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .attr("rx", 4);
  
  svg.append("text")
    .attr("x", width - 190)
    .attr("y", 30)
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text("Key Finding:");
  
  svg.append("text")
    .attr("x", width - 190)
    .attr("y", 50)
    .attr("font-size", "11px")
    .attr("fill", "#333")
    .text("Middle-aged adults (40-64)");
  
  svg.append("text")
    .attr("x", width - 190)
    .attr("y", 65)
    .attr("font-size", "11px")
    .attr("fill", "#333")
    .text("receive the most fines despite");
  
  svg.append("text")
    .attr("x", width - 190)
    .attr("y", 80)
    .attr("font-size", "11px")
    .attr("fill", "#333")
    .text("having more driving experience.");

  // Add annotation for the surprisingly low young driver rate
  const youngDriverData = orderedData.find(d => d.AGE_GROUP === "17-25");
  if (youngDriverData) {
    svg.append("text")
      .attr("x", x("17-25") + x.bandwidth()/2)
      .attr("y", y(youngDriverData.FINES) - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .text("Expected to be highest?");
  }

  // Legend with improved design
  const legend = d3.select("svg").selectAll(".legend").remove(); // cleanup
  
  svg.append("circle")
    .attr("cx", width - 150)
    .attr("cy", height - 20)
    .attr("r", 6)
    .style("fill", "#e31a1c");
  
  svg.append("text")
    .attr("x", width - 135)
    .attr("y", height - 17)
    .text("Key demographic (40-64)")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
  
  svg.append("circle")
    .attr("cx", width - 150)
    .attr("cy", height - 40)
    .attr("r", 6)
    .style("fill", "#6baed6");
  
  svg.append("text")
    .attr("x", width - 135)
    .attr("y", height - 37)
    .text("Other age groups")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
  
  // After you have orderedData:
  const maxGroup = orderedData.reduce((max, d) => d.FINES > max.FINES ? d : max, orderedData[0]);
  const keyFindingBox = document.getElementById('key-finding-box');
  if (keyFindingBox) {
    keyFindingBox.innerHTML = `
      <strong>Key Finding:</strong><br>
      ${maxGroup.AGE_GROUP} group receives the most fines (${maxGroup.FINES.toLocaleString()})
    `;
  }
}

// 🔁 Hook into global updateCharts so `script.js` reset works
window.updateCharts = updateChart;