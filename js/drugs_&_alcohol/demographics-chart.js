// js/drugs_&_alcohol/demographics-chart.js
// Demographics analysis visualization for drugs and alcohol enforcement data

class DrugsAlcoholDemographicsChart {
  constructor() {
    this.data = null;
    this.svg = null;
    this.chart = null;
    this.tooltip = null;
    this.dimensions = {
      width: 800,
      height: 500,
      margin: { top: 60, right: 120, bottom: 100, left: 100 }
    };
    
    this.colors = {
      ageGroup1: '#3498db',
      ageGroup2: '#e74c3c',
      ageGroup3: '#f39c12',
      ageGroup4: '#9b59b6',
      ageGroup5: '#2ecc71',
      male: '#3498db',
      female: '#e74c3c',
      fines: '#f39c12',
      arrests: '#e67e22',
      charges: '#c0392b'
    };

    this.ageGroupColors = {
      '0-16': this.colors.ageGroup1,
      '17-25': this.colors.ageGroup2,
      '26-39': this.colors.ageGroup3,
      '40-64': this.colors.ageGroup4,
      '65 and over': this.colors.ageGroup5
    };
  }

  init() {
    this.createSVG();
    this.createTooltip();
    this.loadData();
  }

  createSVG() {
    const container = d3.select('#demographics-chart');
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
      .text('Drugs & Alcohol Violations by Age Demographics');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Age group patterns in drug and alcohol-related driving offenses');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'drugs-alcohol-demographics-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('color', '#fff')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('max-width', '350px')
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.3)')
      .style('z-index', 1003);
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

    const ageGroupData = this.data.byAgeGroup;
    
    if (!ageGroupData || ageGroupData.length === 0) {
      this.chart.append('text')
        .attr('x', this.dimensions.width / 2)
        .attr('y', this.dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#7f8c8d')
        .text('No demographic data available');
      return;
    }

    // Sort age groups in logical order
    const ageOrder = ['0-16', '17-25', '26-39', '40-64', '65 and over'];
    const sortedData = ageGroupData.sort((a, b) => {
      return ageOrder.indexOf(a.ageGroup) - ageOrder.indexOf(b.ageGroup);
    });

    this.renderStackedBarChart(sortedData);
  }

  renderStackedBarChart(data) {
    // Prepare stacked data
    const metrics = ['totalFines', 'totalArrests', 'totalCharges'];
    const colors = [this.colors.fines, this.colors.arrests, this.colors.charges];
    
    // Create stacked data
    const stackedData = data.map(d => {
      const total = d.totalFines + d.totalArrests + d.totalCharges;
      return {
        ageGroup: d.ageGroup,
        totalFines: d.totalFines,
        totalArrests: d.totalArrests,
        totalCharges: d.totalCharges,
        total: total,
        // Calculate percentages for stacking
        finesPercent: total > 0 ? (d.totalFines / total) * 100 : 0,
        arrestsPercent: total > 0 ? (d.totalArrests / total) * 100 : 0,
        chargesPercent: total > 0 ? (d.totalCharges / total) * 100 : 0
      };
    });

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.ageGroup))
      .range([0, this.dimensions.width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalFines + d.totalArrests + d.totalCharges) * 1.1])
      .nice()
      .range([this.dimensions.height, 0]);

    // Add gridlines
    this.chart.append('g')
      .attr('class', 'grid')
      .style('stroke-dasharray', '2,2')
      .style('stroke', '#e0e0e0')
      .style('opacity', 0.7)
      .call(d3.axisLeft(yScale)
        .tickSize(-this.dimensions.width)
        .tickFormat('')
      );

    // Add axes
    const xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${this.dimensions.height})`)
      .call(d3.axisBottom(xScale));

    const yAxis = this.chart.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => d >= 1000 ? d3.format('.1s')(d) : d3.format(',.0f')(d)));

    // Style axes
    xAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#7f8c8d')
      .style('font-weight', '600');
      
    yAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#7f8c8d');

    // Add axis labels
    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', this.dimensions.width / 2)
      .attr('y', this.dimensions.height + 60)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text('Age Group');

    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.dimensions.height / 2)
      .attr('y', -70)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text('Number of Enforcement Actions');

    // Create stacked bars
    stackedData.forEach(d => {
      const barGroup = this.chart.append('g')
        .attr('class', 'bar-group')
        .attr('transform', `translate(${xScale(d.ageGroup)},0)`);

      let yPos = yScale(0);

      // Fines (bottom)
      if (d.totalFines > 0) {
        const finesHeight = yScale(0) - yScale(d.totalFines);
        yPos -= finesHeight;
        
        barGroup.append('rect')
          .attr('class', 'fines-bar')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('width', xScale.bandwidth())
          .attr('height', finesHeight)
          .attr('fill', this.colors.fines)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => this.showTooltip(event, d, 'fines'))
          .on('mousemove', (event) => this.moveTooltip(event))
          .on('mouseout', () => this.hideTooltip());
      }

      // Arrests (middle)
      if (d.totalArrests > 0) {
        const arrestsHeight = yScale(0) - yScale(d.totalArrests);
        yPos -= arrestsHeight;
        
        barGroup.append('rect')
          .attr('class', 'arrests-bar')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('width', xScale.bandwidth())
          .attr('height', arrestsHeight)
          .attr('fill', this.colors.arrests)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => this.showTooltip(event, d, 'arrests'))
          .on('mousemove', (event) => this.moveTooltip(event))
          .on('mouseout', () => this.hideTooltip());
      }

      // Charges (top)
      if (d.totalCharges > 0) {
        const chargesHeight = yScale(0) - yScale(d.totalCharges);
        yPos -= chargesHeight;
        
        barGroup.append('rect')
          .attr('class', 'charges-bar')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('width', xScale.bandwidth())
          .attr('height', chargesHeight)
          .attr('fill', this.colors.charges)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => this.showTooltip(event, d, 'charges'))
          .on('mousemove', (event) => this.moveTooltip(event))
          .on('mouseout', () => this.hideTooltip());
      }

      // Add total value label on top
      if (d.total > 0) {
        barGroup.append('text')
          .attr('x', xScale.bandwidth() / 2)
          .attr('y', yPos - 8)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('fill', '#2c3e50')
          .text(d.total.toLocaleString());
      }
    });

    // Add legend
    this.addLegend();

    // Add age group analysis
    this.addAgeGroupAnalysis(stackedData);
  }

  showTooltip(event, d, type) {
    const value = d[`total${type.charAt(0).toUpperCase() + type.slice(1)}`];
    const percentage = d.total > 0 ? ((value / d.total) * 100).toFixed(1) : 0;
    
    this.tooltip
      .style('visibility', 'visible')
      .html(`
        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
          <strong>${d.ageGroup} - ${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Count:</strong> ${value.toLocaleString()}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>% of Age Group:</strong> ${percentage}%
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
          Total for ${d.ageGroup}: ${d.total.toLocaleString()}<br>
          Fines: ${d.totalFines.toLocaleString()}, 
          Arrests: ${d.totalArrests.toLocaleString()}, 
          Charges: ${d.totalCharges.toLocaleString()}
        </div>
      `);
  }

  moveTooltip(event) {
    this.tooltip
      .style('top', (event.pageY - 10) + 'px')
      .style('left', (event.pageX + 15) + 'px');
  }

  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  addLegend() {
    const legend = this.chart.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.dimensions.width + 20}, 50)`);

    const legendData = [
      { label: 'Fines', color: this.colors.fines },
      { label: 'Arrests', color: this.colors.arrests },
      { label: 'Charges', color: this.colors.charges }
    ];

    legendData.forEach((item, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${index * 25})`);

      legendItem.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', item.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('fill', '#2c3e50')
        .text(item.label);
    });
  }

  addAgeGroupAnalysis(data) {
    // Find the age group with highest violations
    const topAgeGroup = data.reduce((max, d) => d.total > max.total ? d : max);
    
    // Calculate distribution insights
    const totalViolations = d3.sum(data, d => d.total);
    const distribution = data.map(d => ({
      ageGroup: d.ageGroup,
      percentage: ((d.total / totalViolations) * 100).toFixed(1)
    }));

    // Add analysis box
    const analysisBox = this.svg.append('g')
      .attr('class', 'analysis-box')
      .attr('transform', `translate(${this.dimensions.width + this.dimensions.margin.left + 20}, ${this.dimensions.margin.top + 150})`);

    analysisBox.append('rect')
      .attr('width', 140)
      .attr('height', 160)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#bdc3c7')
      .attr('stroke-width', 1)
      .attr('rx', 8);

    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Age Group Analysis:');

    // Top age group
    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#e74c3c')
      .text(`Highest: ${topAgeGroup.ageGroup}`);

    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 55)
      .style('font-size', '9px')
      .style('fill', '#34495e')
      .text(`${topAgeGroup.total.toLocaleString()} violations`);

    // Distribution
    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 80)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Distribution:');

    distribution.forEach((d, i) => {
      analysisBox.append('text')
        .attr('x', 10)
        .attr('y', 100 + i * 12)
        .style('font-size', '9px')
        .style('fill', '#34495e')
        .text(`${d.ageGroup}: ${d.percentage}%`);
    });
  }

  update() {
    this.render();
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
    }
  }
}

// Initialize the demographics chart
let drugsAlcoholDemographicsChart;

document.addEventListener('DOMContentLoaded', function() {
  const demographicsContainer = document.getElementById('demographics-chart');
  if (demographicsContainer) {
    drugsAlcoholDemographicsChart = new DrugsAlcoholDemographicsChart();
    drugsAlcoholDemographicsChart.init();
  }
});

// Export for use in other modules
window.DrugsAlcoholDemographicsChart = DrugsAlcoholDemographicsChart;
window.drugsAlcoholDemographicsChart = drugsAlcoholDemographicsChart;