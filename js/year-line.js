const margin = { top: 60, right: 80, bottom: 50, left: 60 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create SVG group
const svg = d3.select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add tooltip div
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "rgba(0,0,0,0.8)")
  .style("color", "#fff")
  .style("padding", "6px 10px")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("z-index", 1000);

// Load and process CSV
d3.csv("../data/police_enforcement_2023.csv").then(data => {
  data.forEach(d => {
    d.YEAR = +d.YEAR;
    d.FINES = +d.FINES;
  });

  const finesByYear = d3.rollups(
    data,
    v => d3.sum(v, d => d.FINES),
    d => d.YEAR
  ).map(([YEAR, FINES]) => ({ YEAR, FINES }))
   .sort((a, b) => a.YEAR - b.YEAR);

  const years = d3.range(2008, 2024);
  const completeData = years.map(year => {
    const found = finesByYear.find(d => d.YEAR === year);
    return {
      YEAR: year,
      FINES: found ? found.FINES : 0
    };
  });

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(completeData, d => d.YEAR))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(completeData, d => d.FINES)])
    .nice()
    .range([height, 0]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickValues(years)
      .tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Gridlines
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    );

  // Line path
  const line = d3.line()
    .x(d => x(d.YEAR))
    .y(d => y(d.FINES));

  svg.append("path")
    .datum(completeData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Dots with tooltip interaction
  svg.selectAll("circle")
    .data(completeData)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.YEAR))
    .attr("cy", d => y(d.FINES))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.YEAR}</strong><br>Fines: ${d.FINES.toLocaleString()}`);
    })
    .on("mousemove", event => {
      tooltip
        .style("top", (event.pageY - 35) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // Title
  d3.select("svg")
    .append("text")
    .attr("x", margin.left)
    .attr("y", margin.top - 25)
    .attr("class", "title")
    .text("Total Fines Per Year (2008–2023)")
    .style("font-size", "18px")
    .style("font-weight", "bold");
});
