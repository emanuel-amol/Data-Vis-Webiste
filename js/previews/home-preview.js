// Simple preview chart for homepage
document.addEventListener('DOMContentLoaded', function() {
  // Only run on homepage
  const previewContainer = document.getElementById('preview-chart');
  if (!previewContainer) return;

  // Chart dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 70 };
  const width = 860 - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select('#preview-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .style('background', '#fafafa');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Sample data for preview
  const data = [
    { year: 2008, fines: 85000 },
    { year: 2009, fines: 92000 },
    { year: 2010, fines: 105000 },
    { year: 2011, fines: 118000 },
    { year: 2012, fines: 135000 },
    { year: 2013, fines: 152000 },
    { year: 2014, fines: 175000 },
    { year: 2015, fines: 198000 },
    { year: 2016, fines: 225000 },
    { year: 2017, fines: 265000 },
    { year: 2018, fines: 310000 },
    { year: 2019, fines: 380000 },
    { year: 2020, fines: 420000 },
    { year: 2021, fines: 650000 }, // 37% spike
    { year: 2022, fines: 580000 },
    { year: 2023, fines: 560000 }
  ];

  // Scales
  const x = d3.scaleLinear()
    .domain([2008, 2023])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.fines)])
    .nice()
    .range([height, 0]);

  // Add gridlines
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat('')
    )
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.3);

  // Add axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d3.format('d'))
      .tickValues([2008, 2012, 2016, 2020, 2023]))
    .style('font-size', '12px');

  g.append('g')
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
    .style('font-size', '12px');

  // Area under line
  const area = d3.area()
    .x(d => x(d.year))
    .y0(height)
    .y1(d => y(d.fines))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', '#e0e7ff')
    .attr('d', area);

  // Line
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.fines))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 3)
    .attr('d', line);

  // Highlight 2021 spike
  const spike2021 = data.find(d => d.year === 2021);
  
  g.append('circle')
    .attr('cx', x(2021))
    .attr('cy', y(spike2021.fines))
    .attr('r', 6)
    .attr('fill', '#f59e0b')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  // Add annotation for 2021
  g.append('line')
    .attr('x1', x(2021))
    .attr('x2', x(2021))
    .attr('y1', y(spike2021.fines) - 10)
    .attr('y2', y(spike2021.fines) - 40)
    .attr('stroke', '#f59e0b')
    .attr('stroke-width', 2);

  g.append('text')
    .attr('x', x(2021))
    .attr('y', y(spike2021.fines) - 45)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#f59e0b')
    .text('2021: +37%');

  // Axis labels
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + 35)
    .style('font-size', '12px')
    .style('fill', '#6b7280')
    .text('Year');

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -50)
    .style('font-size', '12px')
    .style('fill', '#6b7280')
    .text('Number of Fines');

  // Simple animation on load
  const path = g.select('path[stroke="#3b82f6"]');
  const totalLength = path.node().getTotalLength();
  
  path
    .attr('stroke-dasharray', totalLength + ' ' + totalLength)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr('stroke-dashoffset', 0);
});