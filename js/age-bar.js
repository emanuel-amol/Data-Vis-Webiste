// Set improved chart dimensions for better axis spacing and legend placement
const width = 700; // Reduced width to give space for legend
const height = 400;
const margin = { top: 60, right: 200, bottom: 70, left: 100 }; // Increased right margin for legend

// Remove any existing SVG
d3.select("#age-distribution-chart svg").remove();

// Create SVG with improved size and spacing
const svg = d3.select("#age-distribution-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .style("background-color", "#fff")
  .attr("role", "img") // ARIA role for image
  .attr("aria-label", "Bar chart showing distribution of fines across age groups");

// Chart group with proper margin
const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add clear title (no duplicate)
svg.append("text")
  .attr("x", (width + margin.left + margin.right) / 2)
  .attr("y", 32)
  .attr("text-anchor", "middle")
  .attr("class", "title")
  .text("Distribution of Fines Across Age Groups")
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .style("fill", "#1f2937");

// Add subtitle
svg.append("text")
  .attr("x", (width + margin.left + margin.right) / 2)
  .attr("y", 54)
  .attr("text-anchor", "middle")
  .attr("class", "subtitle")
  .text("Middle-aged adults (40-64) receive the most fines")
  .style("font-size", "13px")
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
  g.selectAll("*").remove();

  // Scales
  const x = d3.scaleBand()
    .domain(ageOrder)
    .range([0, width])
    .padding(0.18);

  const y = d3.scaleLinear()
    .domain([0, d3.max(orderedData, d => d.FINES) * 1.08])
    .nice()
    .range([height, 0]);

  // Add gridlines
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    )
    .selectAll("line")
    .attr("stroke", "#e5e7eb")
    .attr("stroke-dasharray", "2,2");

  // X Axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .call(g => g.selectAll("text")
      .attr("font-size", "13px")
      .attr("fill", "#374151")
      .attr("font-weight", d => d === "40-64" ? "bold" : "normal")
      .attr("transform", "rotate(-20)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em")
    );

  // Y Axis
  g.append("g")
    .call(d3.axisLeft(y)
      .ticks(8)
      .tickFormat(d3.format(",.0f"))
    )
    .call(g => g.selectAll("text")
      .attr("font-size", "13px")
      .attr("fill", "#374151")
    );

  // Axis labels
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 55) // slightly more space below x-axis
    .text("Age Group")
    .style("font-size", "14px")
    .style("fill", "#1f2937");

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -65) // <-- Move y-axis label further left to avoid clashing with tick labels
    .text("Number of Fines")
    .style("font-size", "14px")
    .style("fill", "#1f2937");

  // Color scale
  const colorScale = d3.scaleOrdinal()
    .domain(ageOrder)
    .range(["#c6dbef", "#9ecae1", "#6baed6", "#e31a1c", "#08519c"]);

  // Bars
  g.selectAll(".bar")
    .data(orderedData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.AGE_GROUP))
    .attr("y", d => y(d.FINES))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.FINES))
    .attr("fill", d => d.AGE_GROUP === "40-64" ? "#e31a1c" : colorScale(d.AGE_GROUP))
    .attr("stroke", "#222")
    .attr("stroke-width", d => d.AGE_GROUP === "40-64" ? 1.5 : 0.5)
    .attr("tabindex", 0)
    .attr("aria-label", d => `${d.AGE_GROUP}: ${d.FINES.toLocaleString()} fines`)
    .on("mouseover focus", function(event, d) {
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.AGE_GROUP}</strong><br>
          Fines: ${d.FINES.toLocaleString()}<br>
          <em>${ageContext[d.AGE_GROUP]}</em>
        `);
      d3.select(this)
        .attr("fill", "#f87171");
    })
    .on("mousemove", function(event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout blur", function(event, d) {
      tooltip.style("visibility", "hidden");
      d3.select(this)
        .attr("fill", d => d.AGE_GROUP === "40-64" ? "#e31a1c" : colorScale(d.AGE_GROUP));
    });

  // Value labels
  g.selectAll(".label")
    .data(orderedData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.AGE_GROUP) + x.bandwidth() / 2)
    .attr("y", d => y(d.FINES) - 8)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .style("font-weight", d => d.AGE_GROUP === "40-64" ? "bold" : "normal")
    .style("fill", "#222")
    .text(d => d.FINES > 0 ? d.FINES.toLocaleString() : "");

  // Legend (clear, concise, accessible)
  svg.selectAll(".legend").remove();
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + margin.left + 30},${margin.top + 30})`);

  const legendData = [
    { color: "#e31a1c", label: "40-64 (Middle-aged)" },
    { color: "#6baed6", label: "Other Age Groups" }
  ];

  legend.selectAll(".legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 32})`)
    .each(function(d) {
      d3.select(this)
        .append("rect")
        .attr("width", 22)
        .attr("height", 22)
        .attr("fill", d.color)
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5);

      d3.select(this)
        .append("text")
        .attr("x", 30)
        .attr("y", 16)
        .attr("font-size", "15px")
        .attr("fill", "#222")
        .text(d.label);
    });

  // Accessibility: add ARIA roles and keyboard navigation
  svg.attr("tabindex", 0);
}

// 🔁 Hook into global updateCharts so `script.js` reset works
window.updateCharts = updateChart;