// Home Preview Charts - Create simple preview visualizations for the home page
// Create this as js/previews/home-previews.js

class HomePreviews {
  constructor() {
    this.data = null;
    this.isInitialized = false;
  }

  init(data) {
    this.data = data;
    this.isInitialized = true;
    
    this.createTrendPreview();
    this.createJurisdictionPreview();
    this.createAgePreview();
  }

  createTrendPreview() {
    const container = document.querySelector('#trend-preview .sparkline-container');
    if (!container || !this.data) return;

    container.innerHTML = '';

    // Get yearly data
    const yearlyData = this.data.processed?.byYear || [];
    if (yearlyData.length === 0) return;

    // Create mini sparkline
    const width = 200;
    const height = 60;
    const margin = { top: 5, right: 5, bottom: 5, left: 5 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(yearlyData, d => d.year))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(yearlyData, d => d.totalFines))
      .range([innerHeight, 0]);

    // Line
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    // Area
    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(innerHeight)
      .y1(d => yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    // Add area
    g.append('path')
      .datum(yearlyData)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.2)
      .attr('d', area);

    // Add line
    g.append('path')
      .datum(yearlyData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add peak year dot
    const peakYear = yearlyData.reduce((max, d) => d.totalFines > max.totalFines ? d : max);
    g.append('circle')
      .attr('cx', xScale(peakYear.year))
      .attr('cy', yScale(peakYear.totalFines))
      .attr('r', 3)
      .attr('fill', '#ef4444')
      .attr('stroke', 'white')
      .attr('stroke-width', 1);
  }

  createJurisdictionPreview() {
    const container = document.querySelector('#jurisdiction-preview .mini-bar-container');
    if (!container || !this.data) return;

    container.innerHTML = '';

    // Get jurisdiction data
    const jurisdictionData = this.data.processed?.byJurisdiction || [];
    if (jurisdictionData.length === 0) return;

    // Sort and take top 5
    const topJurisdictions = jurisdictionData
      .sort((a, b) => b.totalFines - a.totalFines)
      .slice(0, 5);

    // Create mini bar chart
    const width = 200;
    const height = 80;
    const margin = { top: 5, right: 5, bottom: 20, left: 5 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(topJurisdictions.map(d => d.jurisdiction))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(topJurisdictions, d => d.totalFines)])
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('.mini-bar')
      .data(topJurisdictions)
      .enter()
      .append('rect')
      .attr('class', 'mini-bar')
      .attr('x', d => xScale(d.jurisdiction))
      .attr('y', d => yScale(d.totalFines))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.totalFines))
      .attr('fill', (d, i) => i === 0 ? '#ef4444' : '#3b82f6')
      .attr('opacity', 0.8);

    // Labels
    g.selectAll('.mini-label')
      .data(topJurisdictions)
      .enter()
      .append('text')
      .attr('class', 'mini-label')
      .attr('x', d => xScale(d.jurisdiction) + xScale.bandwidth() / 2)
      .attr('y', innerHeight + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d.jurisdiction);
  }

  createAgePreview() {
    const container = document.querySelector('#age-preview .mini-pie-container');
    if (!container || !this.data) return;

    container.innerHTML = '';

    // Get age data
    const ageData = this.data.processed?.byAgeGroup || [];
    if (ageData.length === 0) return;

    // Create mini pie chart
    const width = 120;
    const height = 80;
    const radius = Math.min(width, height) / 2 - 10;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(ageData.map(d => d.ageGroup))
      .range(['#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c']);

    // Pie generator
    const pie = d3.pie()
      .value(d => d.totalFines)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Create pie slices
    const slices = g.selectAll('.mini-slice')
      .data(pie(ageData))
      .enter()
      .append('path')
      .attr('class', 'mini-slice')
      .attr('d', arc)
      .attr('fill', d => {
        // Highlight 40-64 age group
        return d.data.ageGroup === '40-64' ? '#ef4444' : colorScale(d.data.ageGroup);
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8);

    // Add center label for dominant group
    const dominantGroup = ageData.reduce((max, d) => d.totalFines > max.totalFines ? d : max);
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(dominantGroup.ageGroup);
  }

  showLoadingState() {
    // Show loading states for all previews
    const containers = [
      '#trend-preview .sparkline-container',
      '#jurisdiction-preview .mini-bar-container', 
      '#age-preview .mini-pie-container'
    ];

    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        container.innerHTML = '<div class="loading-state">Loading data...</div>';
      }
    });
  }
}

// Initialize home previews
const homePreviews = new HomePreviews();

// Show loading state initially
document.addEventListener('DOMContentLoaded', function() {
  homePreviews.showLoadingState();
});

// Initialize with data when ready
document.addEventListener('roadSafetyDataReady', function(event) {
  console.log("Home previews: Data ready");
  homePreviews.init(event.detail.data);
});

// Export for external use
window.homePreviews = homePreviews;