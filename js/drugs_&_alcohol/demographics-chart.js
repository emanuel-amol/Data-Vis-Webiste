// js/drugs_&_alcohol/demographics-chart.js
// Fixed demographics analysis visualization - FOCUS ON FINES

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
      fines: '#3498db',        // PRIMARY - MAIN FOCUS
      arrests: '#95a5a6',      // SECONDARY - Muted
      charges: '#bdc3c7',      // TERTIARY - Very muted
      primary: '#3498db'       // Main color for fines
    };

    this.ageGroupColors = {
      '17-25': '#e74c3c',
      '26-39': '#f39c12', 
      '40-64': '#9b59b6',
      '65 and over': '#2ecc71'
    };

    this.focusOnFines = true; // PRIMARY FOCUS
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

    // Add title - FOCUS ON FINES
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Drugs & Alcohol FINES by Age Demographics');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Focusing on fine patterns across age groups');
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

    console.log('Rendering demographics chart - FINES focus');

    // Clear previous content
    this.chart.selectAll('*').remove();

    // Check for filtered data first - CRITICAL FIX
    let dataToUse = this.data;
    if (window.drugsAlcoholData?.filtered?.processed) {
      dataToUse = window.drugsAlcoholData.filtered.processed;
      console.log('Demographics: Using filtered data:', dataToUse);
    } else {
      console.log('Demographics: Using original data');
    }
    const ageGroupData = dataToUse.byAgeGroup;
    
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
    const ageOrder = ['17-25', '26-39', '40-64', '65 and over'];
    const sortedData = ageGroupData.sort((a, b) => {
      return ageOrder.indexOf(a.ageGroup) - ageOrder.indexOf(b.ageGroup);
    });

    // FOCUS ON FINES - Primary visualization
    this.renderFinesBarChart(sortedData);
  }

  renderFinesBarChart(data) {
    console.log('Rendering fines-focused bar chart');
    
    // Prepare data with FINES as primary focus
    const chartData = data.map(d => {
      const total = d.totalFines + d.totalArrests + d.totalCharges;
      return {
        ageGroup: d.ageGroup,
        totalFines: d.totalFines,
        totalArrests: d.totalArrests,
        totalCharges: d.totalCharges,
        total: total,
        // Calculate FINES percentage (primary focus)
        finesPercent: total > 0 ? (d.totalFines / total) * 100 : 0
      };
    });

    // Scales - FOCUS ON FINES
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.ageGroup))
      .range([0, this.dimensions.width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalFines) * 1.2]) // FOCUS ON FINES
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

    // Add axis labels - FOCUS ON FINES
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
      .text('Number of FINES'); // FOCUS ON FINES

    // Create FINES bars (primary focus)
    chartData.forEach(d => {
      const barGroup = this.chart.append('g')
        .attr('class', 'bar-group')
        .attr('transform', `translate(${xScale(d.ageGroup)},0)`);

      // Main FINES bar (prominent)
      barGroup.append('rect')
        .attr('class', 'fines-bar')
        .attr('x', 0)
        .attr('y', yScale(d.totalFines))
        .attr('width', xScale.bandwidth() * 0.8) // Wider for prominence
        .attr('height', this.dimensions.height - yScale(d.totalFines))
        .attr('fill', this.colors.fines)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => this.showTooltip(event, d, 'fines'))
        .on('mousemove', (event) => this.moveTooltip(event))
        .on('mouseout', () => this.hideTooltip());

      // Small indicators for arrests and charges (minimal)
      if (d.totalArrests > 0) {
        barGroup.append('rect')
          .attr('class', 'arrests-indicator')
          .attr('x', xScale.bandwidth() * 0.82)
          .attr('y', yScale(d.totalFines) - 15)
          .attr('width', xScale.bandwidth() * 0.08)
          .attr('height', 10)
          .attr('fill', this.colors.arrests)
          .style('opacity', 0.6)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => this.showTooltip(event, d, 'arrests'))
          .on('mousemove', (event) => this.moveTooltip(event))
          .on('mouseout', () => this.hideTooltip());
      }

      if (d.totalCharges > 0) {
        barGroup.append('rect')
          .attr('class', 'charges-indicator')
          .attr('x', xScale.bandwidth() * 0.92)
          .attr('y', yScale(d.totalFines) - 15)
          .attr('width', xScale.bandwidth() * 0.08)
          .attr('height', 10)
          .attr('fill', this.colors.charges)
          .style('opacity', 0.6)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => this.showTooltip(event, d, 'charges'))
          .on('mousemove', (event) => this.moveTooltip(event))
          .on('mouseout', () => this.hideTooltip());
      }

      // Add FINES value label on top
      if (d.totalFines > 0) {
        barGroup.append('text')
          .attr('x', xScale.bandwidth() * 0.4)
          .attr('y', yScale(d.totalFines) - 8)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', '#2c3e50')
          .text(d.totalFines.toLocaleString());
      }
    });

    // Add legend - FOCUS ON FINES
    this.addFinesFocusedLegend();

    // Add age group analysis - FOCUS ON FINES
    this.addFinesAgeGroupAnalysis(chartData);
  }

  showTooltip(event, d, type) {
    const value = d[`total${type.charAt(0).toUpperCase() + type.slice(1)}`];
    const percentage = d.total > 0 ? ((value / d.total) * 100).toFixed(1) : 0;
    
    let tooltipContent = `
      <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
        <strong>${d.ageGroup} - ${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Count:</strong> ${value.toLocaleString()}
      </div>`;
    
    if (type === 'fines') {
      // Enhanced tooltip for FINES (primary focus)
      tooltipContent += `
        <div style="margin-bottom: 6px;">
          <strong>🎯 PRIMARY METRIC:</strong> FINES
        </div>
        <div style="margin-bottom: 6px;">
          <strong>% of Age Group:</strong> ${percentage}%
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
          Total for ${d.ageGroup}: ${d.total.toLocaleString()}<br>
          <strong>FINES: ${d.totalFines.toLocaleString()}</strong>, 
          Arrests: ${d.totalArrests.toLocaleString()}, 
          Charges: ${d.totalCharges.toLocaleString()}
        </div>`;
    } else {
      tooltipContent += `
        <div style="margin-bottom: 6px;">
          <strong>% of Age Group:</strong> ${percentage}%
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
          <strong>Primary Focus: FINES (${d.totalFines.toLocaleString()})</strong><br>
          Secondary: Arrests (${d.totalArrests.toLocaleString()}), Charges (${d.totalCharges.toLocaleString()})
        </div>`;
    }
    
    this.tooltip
      .style('visibility', 'visible')
      .html(tooltipContent);
  }

  moveTooltip(event) {
    this.tooltip
      .style('top', (event.pageY - 10) + 'px')
      .style('left', (event.pageX + 15) + 'px');
  }

  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  addFinesFocusedLegend() {
    const legend = this.chart.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.dimensions.width + 20}, 50)`);

    const legendData = [
      { label: 'FINES (Primary)', color: this.colors.fines, primary: true },
      { label: 'Arrests', color: this.colors.arrests, primary: false },
      { label: 'Charges', color: this.colors.charges, primary: false }
    ];

    legendData.forEach((item, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${index * 25})`);

      legendItem.append('rect')
        .attr('width', item.primary ? 20 : 15)
        .attr('height', item.primary ? 18 : 12)
        .attr('fill', item.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', item.primary ? 2 : 1)
        .style('opacity', item.primary ? 1 : 0.6);

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .style('font-size', item.primary ? '12px' : '10px')
        .style('font-weight', item.primary ? 'bold' : 'normal')
        .style('fill', '#2c3e50')
        .text(item.label);
    });
  }

  addFinesAgeGroupAnalysis(data) {
    // Find the age group with highest FINES (primary focus)
    const topFinesAgeGroup = data.reduce((max, d) => d.totalFines > max.totalFines ? d : max);
    
    // Calculate FINES distribution insights
    const totalFines = d3.sum(data, d => d.totalFines);
    const finesDistribution = data.map(d => ({
      ageGroup: d.ageGroup,
      percentage: ((d.totalFines / totalFines) * 100).toFixed(1)
    }));

    // Add analysis box - FOCUS ON FINES
    const analysisBox = this.svg.append('g')
      .attr('class', 'analysis-box')
      .attr('transform', `translate(${this.dimensions.width + this.dimensions.margin.left + 20}, ${this.dimensions.margin.top + 150})`);

    analysisBox.append('rect')
      .attr('width', 140)
      .attr('height', 180)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#3498db')
      .attr('stroke-width', 2)
      .attr('rx', 8);

    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('FINES Analysis:');

    // Top age group for FINES
    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#3498db')
      .text(`🎯 Highest FINES:`);

    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 55)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#e74c3c')
      .text(`${topFinesAgeGroup.ageGroup}`);

    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 70)
      .style('font-size', '9px')
      .style('fill', '#34495e')
      .text(`${topFinesAgeGroup.totalFines.toLocaleString()} fines`);

    // FINES Distribution
    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 95)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('FINES Distribution:');

    finesDistribution.forEach((d, i) => {
      analysisBox.append('text')
        .attr('x', 10)
        .attr('y', 115 + i * 12)
        .style('font-size', '9px')
        .style('fill', '#34495e')
        .text(`${d.ageGroup}: ${d.percentage}%`);
    });

    // Total FINES
    analysisBox.append('text')
      .attr('x', 10)
      .attr('y', 170)
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#3498db')
      .text(`Total FINES: ${totalFines.toLocaleString()}`);
  }

  update() {
    console.log('Updating demographics chart - FINES focus');
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
    window.drugsAlcoholDemographicsChart = drugsAlcoholDemographicsChart; // <-- Ensure global assignment
    console.log('Demographics chart initialized - FINES focus enabled');
  }
});

// Export for use in other modules
window.DrugsAlcoholDemographicsChart = DrugsAlcoholDemographicsChart;
window.drugsAlcoholDemographicsChart = drugsAlcoholDemographicsChart;