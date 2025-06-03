// js/drugs_&_alcohol/detection-chart.js
// Detection methods analysis visualization for drugs and alcohol enforcement data

class DrugsAlcoholDetectionChart {
  constructor() {
    this.data = null;
    this.svg = null;
    this.chart = null;
    this.tooltip = null;
    this.dimensions = {
      width: 800,
      height: 500,
      margin: { top: 60, right: 150, bottom: 100, left: 100 }
    };
    
    this.colors = {
      roadside: '#3498db',
      laboratory: '#e74c3c',
      breathTest: '#f39c12',
      traffic: '#9b59b6',
      patrol: '#2ecc71',
      other: '#95a5a6'
    };

    this.detectionMethodColors = {
      'Roadside testing': this.colors.roadside,
      'Random breath test': this.colors.breathTest,
      'Laboratory or Toxicology (Stage 3)': this.colors.laboratory,
      'Traffic stop': this.colors.traffic,
      'Police patrol': this.colors.patrol,
      'Not applicable': this.colors.other
    };
  }

  init() {
    this.createSVG();
    this.createTooltip();
    this.loadData();
  }

  createSVG() {
    const container = d3.select('#detection-chart');
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
      .text('Detection Methods for Drugs & Alcohol Violations');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Comparison of enforcement detection technologies and methods');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'drugs-alcohol-detection-tooltip')
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
      .style('z-index', 1004);
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

    const detectionData = this.data.byDetectionMethod;
    
    if (!detectionData || detectionData.length === 0) {
      this.chart.append('text')
        .attr('x', this.dimensions.width / 2)
        .attr('y', this.dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#7f8c8d')
        .text('No detection method data available');
      return;
    }

    // Sort by total enforcement actions
    const sortedData = detectionData
      .map(d => ({
        ...d,
        total: d.totalFines + d.totalArrests + d.totalCharges
      }))
      .sort((a, b) => b.total - a.total);

    this.renderDonutChart(sortedData);
    this.renderMethodComparison(sortedData);
  }

  renderDonutChart(data) {
    const radius = 120;
    const innerRadius = 60;
    const centerX = 180;
    const centerY = 180;

    // Pie generator
    const pie = d3.pie()
      .value(d => d.total)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius + 15);

    // Create donut chart group
    const donutGroup = this.chart.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.method))
      .range(data.map(d => this.detectionMethodColors[d.method] || this.colors.other));

    // Add donut slices
    const slices = donutGroup.selectAll('.donut-slice')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('class', 'donut-slice')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.method))
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

        const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
        const effectiveness = this.calculateEffectiveness(d.data);
        
        this.tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
              <strong>${d.data.method}</strong>
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Total Actions:</strong> ${d.data.total.toLocaleString()}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Share:</strong> ${percentage}%
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Breakdown:</strong><br>
              Fines: ${d.data.totalFines.toLocaleString()}<br>
              Arrests: ${d.data.totalArrests.toLocaleString()}<br>
              Charges: ${d.data.totalCharges.toLocaleString()}
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
              Effectiveness Score: ${effectiveness.toFixed(1)}/10
            </div>
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
    donutGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Detection');

    donutGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Methods');

    // Add total in center
    const totalActions = d3.sum(data, d => d.total);
    donutGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '2.5em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#3498db')
      .text(totalActions.toLocaleString());

    donutGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3.8em')
      .style('font-size', '10px')
      .style('fill', '#7f8c8d')
      .text('Total Actions');

    // Add legend
    this.addDonutLegend(data, colorScale);
  }

  renderMethodComparison(data) {
    // Horizontal bar chart comparing methods
    const chartX = 420;
    const chartY = 80;
    const chartWidth = 300;
    const chartHeight = 300;

    // Take top 6 methods
    const topMethods = data.slice(0, 6);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(topMethods, d => d.total)])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(topMethods.map(d => d.method))
      .range([0, chartHeight])
      .padding(0.2);

    // Create comparison chart group
    const comparisonGroup = this.chart.append('g')
      .attr('transform', `translate(${chartX},${chartY})`);

    // Add bars
    comparisonGroup.selectAll('.method-bar')
      .data(topMethods)
      .enter()
      .append('rect')
      .attr('class', 'method-bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.method))
      .attr('width', d => xScale(d.total))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => this.detectionMethodColors[d.method] || this.colors.other)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);

        const effectiveness = this.calculateEffectiveness(d);
        const rank = topMethods.indexOf(d) + 1;

        this.tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
              <strong>${d.method}</strong>
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Rank:</strong> #${rank} of ${topMethods.length}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Total Actions:</strong> ${d.total.toLocaleString()}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Effectiveness:</strong> ${effectiveness.toFixed(1)}/10
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
              Success Rate: ${this.calculateSuccessRate(d).toFixed(1)}%
            </div>
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

    // Add method labels
    comparisonGroup.selectAll('.method-label')
      .data(topMethods)
      .enter()
      .append('text')
      .attr('class', 'method-label')
      .attr('x', -10)
      .attr('y', d => yScale(d.method) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', '#2c3e50')
      .style('font-weight', '600')
      .text(d => this.truncateMethodName(d.method));

    // Add value labels
    comparisonGroup.selectAll('.method-value')
      .data(topMethods)
      .enter()
      .append('text')
      .attr('class', 'method-value')
      .attr('x', d => xScale(d.total) + 5)
      .attr('y', d => yScale(d.method) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text(d => d.total.toLocaleString());

    // Add comparison chart title
    this.chart.append('text')
      .attr('x', chartX + chartWidth / 2)
      .attr('y', chartY - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#34495e')
      .text('Method Effectiveness Ranking');

    // Add effectiveness analysis
    this.addEffectivenessAnalysis(topMethods, chartX, chartY + chartHeight + 40);
  }

  addDonutLegend(data, colorScale) {
    const legend = this.chart.append('g')
      .attr('class', 'donut-legend')
      .attr('transform', `translate(50, 350)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data.slice(0, 6)) // Show top 6 in legend
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${(i % 3) * 120}, ${Math.floor(i / 3) * 25})`);

    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => colorScale(d.method))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 7.5)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('fill', '#2c3e50')
      .text(d => this.truncateMethodName(d.method));
  }

  addEffectivenessAnalysis(data, x, y) {
    const analysisGroup = this.chart.append('g')
      .attr('class', 'effectiveness-analysis')
      .attr('transform', `translate(${x}, ${y})`);

    // Background
    analysisGroup.append('rect')
      .attr('width', 300)
      .attr('height', 100)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#bdc3c7')
      .attr('stroke-width', 1)
      .attr('rx', 8);

    // Title
    analysisGroup.append('text')
      .attr('x', 15)
      .attr('y', 20)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Effectiveness Analysis:');

    // Most effective method
    const mostEffective = data.reduce((max, d) => {
      const effectiveness = this.calculateEffectiveness(d);
      const maxEffectiveness = this.calculateEffectiveness(max);
      return effectiveness > maxEffectiveness ? d : max;
    });

    analysisGroup.append('text')
      .attr('x', 15)
      .attr('y', 40)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#27ae60')
      .text(`Most Effective: ${this.truncateMethodName(mostEffective.method)}`);

    analysisGroup.append('text')
      .attr('x', 15)
      .attr('y', 55)
      .style('font-size', '9px')
      .style('fill', '#34495e')
      .text(`Score: ${this.calculateEffectiveness(mostEffective).toFixed(1)}/10`);

    // Total methods
    analysisGroup.append('text')
      .attr('x', 15)
      .attr('y', 75)
      .style('font-size', '10px')
      .style('fill', '#34495e')
      .text(`Total Methods: ${data.length}`);

    // Success rate range
    const successRates = data.map(d => this.calculateSuccessRate(d));
    const minSuccess = Math.min(...successRates);
    const maxSuccess = Math.max(...successRates);

    analysisGroup.append('text')
      .attr('x', 15)
      .attr('y', 90)
      .style('font-size', '9px')
      .style('fill', '#34495e')
      .text(`Success Rate: ${minSuccess.toFixed(1)}% - ${maxSuccess.toFixed(1)}%`);
  }

  calculateEffectiveness(methodData) {
    // Calculate effectiveness based on multiple factors
    const total = methodData.total;
    const successRate = this.calculateSuccessRate(methodData);
    const arrestRatio = methodData.totalArrests > 0 ? (methodData.totalArrests / total) : 0;
    
    // Weighted score (0-10)
    const volumeScore = Math.min(total / 1000, 5); // Up to 5 points for volume
    const successScore = (successRate / 100) * 3; // Up to 3 points for success rate
    const qualityScore = arrestRatio * 2; // Up to 2 points for arrest ratio
    
    return Math.min(volumeScore + successScore + qualityScore, 10);
  }

  calculateSuccessRate(methodData) {
    // Calculate success rate as (arrests + charges) / total actions
    const total = methodData.total;
    if (total === 0) return 0;
    
    const successful = methodData.totalArrests + methodData.totalCharges;
    return (successful / total) * 100;
  }

  truncateMethodName(methodName) {
    if (methodName.length > 20) {
      return methodName.substring(0, 17) + '...';
    }
    return methodName;
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

// Initialize the detection chart
let drugsAlcoholDetectionChart;

document.addEventListener('DOMContentLoaded', function() {
  const detectionContainer = document.getElementById('detection-chart');
  if (detectionContainer) {
    drugsAlcoholDetectionChart = new DrugsAlcoholDetectionChart();
    drugsAlcoholDetectionChart.init();
  }
});

// Export for use in other modules
window.DrugsAlcoholDetectionChart = DrugsAlcoholDetectionChart;
window.drugsAlcoholDetectionChart = drugsAlcoholDetectionChart;