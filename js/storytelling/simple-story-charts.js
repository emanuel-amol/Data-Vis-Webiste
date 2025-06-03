// Simple charts for data story page

document.addEventListener('DOMContentLoaded', function() {
  // Only run on data story page
  if (!document.querySelector('.story-chapter')) return;

  const ageContainer = document.getElementById('age-distribution-story');
  const timelineContainer = document.getElementById('timeline-story');
  if (ageContainer) ageContainer.style.display = 'none';
  if (timelineContainer) timelineContainer.style.display = 'none';

  // Track if charts have been created
  let ageChartCreated = false;
  let timelineChartCreated = false;

  // Setup IntersectionObserver for story steps
  const steps = document.querySelectorAll('.story-step');
  if (!steps.length) return;

  const showChartForStep = (stepIndex) => {
    // Hide both by default
    if (ageContainer) {
      ageContainer.style.display = 'none';
      ageContainer.innerHTML = ''; // Clear previous chart
      ageChartCreated = false;
    }
    if (timelineContainer) {
      timelineContainer.style.display = 'none';
      timelineContainer.innerHTML = ''; // Clear previous chart
      timelineChartCreated = false;
    }

    // Show and create only the relevant chart
    if (stepIndex === 1 && ageContainer) {
      ageContainer.style.display = 'block';
      if (!ageChartCreated) {
        createAgeDistributionChart();
        ageChartCreated = true;
      }
    }
    if (stepIndex === 2 && timelineContainer) {
      timelineContainer.style.display = 'block';
      if (!timelineChartCreated) {
        createTimelineChart();
        timelineChartCreated = true;
      }
    }
  };

  // Initial state: show nothing
  showChartForStep(-1);

  // Observe steps
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stepIndex = Array.from(steps).indexOf(entry.target);
        showChartForStep(stepIndex);
      }
    });
  }, {
    root: null,
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0
  });

  steps.forEach(step => observer.observe(step));
});

function createAgeDistributionChart() {
  const container = document.getElementById('age-distribution-story');
  if (!container) return;

  const margin = { top: 20, right: 30, bottom: 60, left: 100 };
  const width = 600 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Data
  const data = [
    { ageGroup: '0-16', fines: 5000, percentage: 0.4 },
    { ageGroup: '17-25', fines: 298300, percentage: 21.0 },
    { ageGroup: '26-39', fines: 430000, percentage: 30.1 },
    { ageGroup: '40-64', fines: 604750, percentage: 42.4 },
    { ageGroup: '65+', fines: 145000, percentage: 10.2 }
  ];

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.fines)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.ageGroup))
    .range([0, height])
    .padding(0.2);

  // Add gridlines
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisTop(x)
      .tickSize(-height)
      .tickFormat('')
    )
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.3);

  // Add axes
  g.append('g')
    .call(d3.axisLeft(y))
    .style('font-size', '12px');

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
    .style('font-size', '12px');

  // Add bars
  const bars = g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('y', d => y(d.ageGroup))
    .attr('height', y.bandwidth())
    .attr('x', 0)
    .attr('width', 0)
    .attr('fill', d => d.ageGroup === '40-64' ? '#f59e0b' : '#3b82f6');

  // Animate bars
  bars.transition()
    .duration(1000)
    .delay((d, i) => i * 200)
    .attr('width', d => x(d.fines));

  // Add value labels
  g.selectAll('.label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.fines) + 5)
    .attr('y', d => y(d.ageGroup) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('font-weight', d => d.ageGroup === '40-64' ? 'bold' : 'normal')
    .style('fill', d => d.ageGroup === '40-64' ? '#f59e0b' : '#374151')
    .text(d => `${d.percentage}%`)
    .style('opacity', 0)
    .transition()
    .delay((d, i) => 1000 + i * 200)
    .duration(500)
    .style('opacity', 1);

  // Axis label
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + 45)
    .style('font-size', '12px')
    .style('fill', '#6b7280')
    .text('Number of Fines');
}

function createTimelineChart() {
  const container = document.getElementById('timeline-story');
  if (!container) return;

  const margin = { top: 20, right: 30, bottom: 40, left: 80 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Data (simplified)
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
    { year: 2021, fines: 650000 },
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

  // Line
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.fines))
    .curve(d3.curveMonotoneX);

  const path = g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 3)
    .attr('d', line);

  // Animate line
  const totalLength = path.node().getTotalLength();
  path
    .attr('stroke-dasharray', totalLength + ' ' + totalLength)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr('stroke-dashoffset', 0);

  // Add highlight area for 2019-2021
  setTimeout(() => {
    g.append('rect')
      .attr('x', x(2019))
      .attr('y', 0)
      .attr('width', x(2021) - x(2019))
      .attr('height', height)
      .attr('fill', '#f59e0b')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .attr('opacity', 0.1);

    // Add annotation
    g.append('text')
      .attr('x', x(2020))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .text('Technology deployment')
      .style('opacity', 0)
      .transition()
      .duration(500)
      .style('opacity', 1);
  }, 2200);

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
    .attr('y', -60)
    .style('font-size', '12px')
    .style('fill', '#6b7280')
    .text('Number of Fines');
}