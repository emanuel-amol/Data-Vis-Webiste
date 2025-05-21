const margin = { top: 60, right: 120, bottom: 50, left: 60 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("../data/police_enforcement_2023.csv").then(data => {
  const ageOrder = ["0-16", "17-25", "26-39", "40-64", "65 and over"];

  // ✅ Group and sum fines by AGE_GROUP
  const groupedData = d3.rollups(
    data,
    v => d3.sum(v, d => +d.FINES),
    d => d.AGE_GROUP
  ).map(([AGE_GROUP, total]) => ({
    AGE_GROUP,
    FINES: total
  }))
  .filter(d => ageOrder.includes(d.AGE_GROUP));

  // ✅ Ensure data is in the right order
  const filteredData = ageOrder.map(group => {
    const found = groupedData.find(d => d.AGE_GROUP === group);
    return {
      AGE_GROUP: group,
      FINES: found ? found.FINES : 0
    };
  });

  // Scales
  const x = d3.scaleBand()
    .domain(ageOrder)
    .range([0, width])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d.FINES)])
    .nice()
    .range([height, 0]);

  // Gridlines
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    );

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Bars
  svg.selectAll(".bar")
    .data(filteredData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.AGE_GROUP))
    .attr("y", d => y(d.FINES))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.FINES))
    .attr("fill", "steelblue");

  // ✅ ONE label per bar (sum)
  svg.selectAll(".label")
    .data(filteredData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.AGE_GROUP) + x.bandwidth() / 2)
    .attr("y", d => y(d.FINES) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(d => d.FINES.toLocaleString());

  // Title
  d3.select("svg")
    .append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 20)
    .attr("class", "title")
    .text("Bar Chart");

  // Legend
  d3.select("svg")
    .append("circle")
    .attr("cx", width + margin.left + 20)
    .attr("cy", margin.top - 30)
    .attr("r", 6)
    .style("fill", "steelblue");

  d3.select("svg")
    .append("text")
    .attr("x", width + margin.left + 30)
    .attr("y", margin.top - 26)
    .text("Sum(FINES)")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
});
