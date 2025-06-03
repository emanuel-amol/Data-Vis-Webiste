// js/drugs_&_alcohol/overview-chart.js
// Overview visualization for drugs and alcohol enforcement data

class DrugsAlcoholOverviewChart {
  constructor() {
    this.data = null;
    this.svg = null;
    this.chart = null;
    this.tooltip = null;
    this.dimensions = {
      width: 800,
      height: 500,
      margin: { top: 60, right: 150, bottom: 80, left: 100 }
    };
    
    this.colors = {
      alcohol: '#e74c3c',
      drugs: '#9b59b6',
      combined: '#3498db',
      fines: '#f39c12',
      arrests: '#e67e22',
      charges: '#c0392b'
    };
  }

  init() {
    this.createSVG();
    this.createTooltip();
    this.loadData();
  }

  createSVG() {
    const container = d3.select('#overview-chart');
    container.selectAll('*').remove();

    this.svg = container
      .append('svg')
      .attr('width', this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right)
      .attr('height', this.dimensions.height + this.dimensions.margin.top + this.dimensions.margin.bottom)
      .attr('viewBox', `0 0 ${this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right} ${this.dimensions.height + this.dimensions.margin.top + this.dimensions.margin.bottom}`)
      .style('background', '#fafafa');

    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.dimensions.margin.left},${this.dimensions.margin.top})`);

    // Add title
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Drugs & Alcohol Enforcement Overview');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Breakdown by violation type and enforcement outcome');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'drugs-alcohol-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('color', '#fff')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('max-width', '300px')
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.3)')
      .style('z-index', 1000);
  }

  loadData() {
    if (window.drugsAlcoholData && window.drugsAlcoholData.processed) {
      this.data = window.drugsAlcoholData.processed;
      this.render();
    } else {
      document.addEventListener('drugsAlcoholDataReady', (event) => {
        this.data = event.detail.data.processed;
        this.render();
      });
    }
  }

  render() {
    if (!this.data) return;

    // Clear previous content
    this.chart.selectAll('*').remove();

    // Create a comprehensive overview with multiple small charts
    this.renderMetricBreakdown();
    this.renderOutcomeComparison();
    this.renderTopJurisdictions();
  }

  renderMetricBreakdown() {
    // Pie chart showing breakdown by violation type
    const pieData = this.data.byMetric;
    const radius = 120;
    const centerX = 150;
    const centerY = 150;

    // Pie generator
    const pie = d3.pie()
      .value(d => d.totalFines + d.totalArrests + d.totalCharges)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(40)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(40)
      .outerRadius(radius + 10);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(pieData.map(d => d.metric))
      .range(d3.schemeSet3);

    // Create pie chart group
    const pieGroup = this.chart.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // Add pie slices
    const slices = pieGroup.selectAll('.pie-slice')
      .data(pie(pieData))
      .enter()
      .append('path')
      .attr('class', 'pie-slice')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.metric))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add interactivity
    slices
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('d', arcHover);

        const total = d.data.totalFines + d.data.totalArrests + d.data.totalCharges;
        const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
        
        this.tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.data.metric}</strong><br>
            Total: ${total.toLocaleString()}<br>
            Fines: ${d.data.totalFines.toLocaleString()}<br>
            Arrests: ${d.data.totalArrests.toLocaleString()}<br>
            Charges: ${d.data.totalCharges.toLocaleString()}<br>
            Share: ${percentage}%
          `);
      })
      .on('mousemove', (event) => {
        this.tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 15) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('d', arc);
        
        this.tooltip.style('visibility', 'hidden');
      });

    // Add center text
    pieGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Violation');

    pieGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Types');

    // Add title
    this.chart.append('text')
      .attr('x', centerX)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#34495e')
      .text('Breakdown by Violation Type');
  }

  renderOutcomeComparison() {
    // Bar chart comparing fines, arrests, and charges
    const outcomeData = [
      { type: 'Fines', value: d3.sum(this.data.byMetric, d => d.totalFines), color: this.colors.fines },
      { type: 'Arrests', value: d3.sum(this.data.byMetric, d => d.totalArrests), color: this.colors.arrests },
      { type: 'Charges', value: d3.sum(this.data.byMetric, d => d.totalCharges), color: this.colors.charges }
    ];

    const barWidth = 60;
    const barSpacing = 20;
    const chartX = 400;
    const chartY = 80;
    const chartHeight = 200;

    // Scales
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(outcomeData, d => d.value)])
      .range([chartHeight, 0]);

    const xScale = d3.scaleBand()
      .domain(outcomeData.map(d => d.type))
      .range([0, (barWidth + barSpacing) * outcomeData.length])
      .padding(0.1);

    // Create bar chart group
    const barGroup = this.chart.append('g')
      .attr('transform', `translate(${chartX},${chartY})`);

    // Add bars
    barGroup.selectAll('.outcome-bar')
      .data(outcomeData)
      .enter()
      .append('rect')
      .attr('class', 'outcome-bar')
      .attr('x', d => xScale(d.type))
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => chartHeight - yScale(d.value))
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);

        this.tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.type}</strong><br>
            Total: ${d.value.toLocaleString()}<br>
            Average per record: ${(d.value / window.drugsAlcoholData.stats.totalRecords).toFixed(1)}
          `);
      })
      .on('mousemove', (event) => {
        this.tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 15) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('opacity', 1);
        
        this.tooltip.style('visibility', 'hidden');
      });

    // Add value labels on bars
    barGroup.selectAll('.outcome-label')
      .data(outcomeData)
      .enter()
      .append('text')
      .attr('class', 'outcome-label')
      .attr('x', d => xScale(d.type) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text(d => d.value.toLocaleString());

    // Add x-axis labels
    barGroup.selectAll('.outcome-x-label')
      .data(outcomeData)
      .enter()
      .append('text')
      .attr('class', 'outcome-x-label')
      .attr('x', d => xScale(d.type) + xScale.bandwidth() / 2)
      .attr('y', chartHeight + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#7f8c8d')
      .text(d => d.type);

    // Add chart title
    this.chart.append('text')
      .attr('x', chartX + (barWidth + barSpacing) * outcomeData.length / 2)
      .attr('y', chartY - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#34495e')
      .text('Enforcement Outcomes');
  }

  renderTopJurisdictions() {
    // Horizontal bar chart of top jurisdictions
    const jurisdictionData = this.data.byJurisdiction
      .map(d => ({
        jurisdiction: d.jurisdiction,
        total: d.totalFines + d.totalArrests + d.totalCharges
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5

    const chartX = 400;
    const chartY = 320;
    const chartWidth = 300;
    const chartHeight = 150;

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(jurisdictionData, d => d.total)])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(jurisdictionData.map(d => d.jurisdiction))
      .range([0, chartHeight])
      .padding(0.2);

    // Create jurisdiction chart group
    const jurisdictionGroup = this.chart.append('g')
      .attr('transform', `translate(${chartX},${chartY})`);

    // Add bars
    jurisdictionGroup.selectAll('.jurisdiction-bar')
      .data(jurisdictionData)
      .enter()
      .append('rect')
      .attr('class', 'jurisdiction-bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.jurisdiction))
      .attr('width', d => xScale(d.total))
      .attr('height', yScale.bandwidth())
      .attr('fill', this.colors.combined)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('fill', '#2980b9');

        this.tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.jurisdiction}</strong><br>
            Total enforcement: ${d.total.toLocaleString()}<br>
            Rank: #${jurisdictionData.indexOf(d) + 1}
          `);
      })
      .on('mousemove', (event) => {
        this.tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 15) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('fill', this.colors.combined);
        
        this.tooltip.style('visibility', 'hidden');
      });

    // Add jurisdiction labels
    jurisdictionGroup.selectAll('.jurisdiction-label')
      .data(jurisdictionData)
      .enter()
      .append('text')
      .attr('class', 'jurisdiction-label')
      .attr('x', -10)
      .attr('y', d => yScale(d.jurisdiction) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#2c3e50')
      .text(d => d.jurisdiction);

    // Add value labels
    jurisdictionGroup.selectAll('.jurisdiction-value')
      .data(jurisdictionData)
      .enter()
      .append('text')
      .attr('class', 'jurisdiction-value')
      .attr('x', d => xScale(d.total) + 5)
      .attr('y', d => yScale(d.jurisdiction) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text(d => d.total.toLocaleString());

    // Add chart title
    this.chart.append('text')
      .attr('x', chartX + chartWidth / 2)
      .attr('y', chartY - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#34495e')
      .text('Top 5 Jurisdictions');
  }

  update() {
    // Re-render with current data
    this.render();
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
    }
  }
}

// Initialize the overview chart
let drugsAlcoholOverviewChart;

document.addEventListener('DOMContentLoaded', function() {
  const overviewContainer = document.getElementById('overview-chart');
  if (overviewContainer) {
    drugsAlcoholOverviewChart = new DrugsAlcoholOverviewChart();
    drugsAlcoholOverviewChart.init();
  }
});

// Export for use in other modules
window.DrugsAlcoholOverviewChart = DrugsAlcoholOverviewChart;
window.drugsAlcoholOverviewChart = drugsAlcoholOverviewChart;