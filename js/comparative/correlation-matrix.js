// js/comparative/correlation-matrix.js
// Fixed correlation matrix visualization with drugs & alcohol integration

class CorrelationMatrixChart {
  constructor() {
    this.data = null;
    this.svg = null;
    this.dimensions = {
      width: 600,
      height: 500,
      margin: { top: 60, right: 120, bottom: 120, left: 120 }
    };
    this.correlationData = null;
    this.tooltip = null;
  }

  init() {
    this.createSVG();
    this.createTooltip();
    this.loadData();
  }

  createSVG() {
    const container = d3.select('#correlation-matrix');
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
      .text('Correlation Matrix: Enforcement Variables');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Relationships between enforcement metrics across jurisdictions');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'correlation-tooltip')
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
      .style('z-index', 1005);
  }

  loadData() {
    // Check if we have road safety data
    if (window.roadSafetyData && window.roadSafetyData.processed) {
      this.data = window.roadSafetyData.processed;
    }
    
    // Also check for drugs & alcohol data
    if (window.drugsAlcoholData && window.drugsAlcoholData.processed) {
      this.drugsAlcoholData = window.drugsAlcoholData.processed;
    }

    // Listen for data ready events
    document.addEventListener('roadSafetyDataReady', (event) => {
      this.data = event.detail.data.processed;
      this.render();
    });

    document.addEventListener('drugsAlcoholDataReady', (event) => {
      this.drugsAlcoholData = event.detail.data.processed;
      this.render();
    });

    if (this.data || this.drugsAlcoholData) {
      this.render();
    }
  }

  render() {
    if (!this.data && !this.drugsAlcoholData) return;

    // Clear previous content
    this.chart.selectAll('*').remove();

    // Prepare correlation data
    this.correlationData = this.calculateCorrelations();
    
    if (!this.correlationData || this.correlationData.length === 0) {
      this.chart.append('text')
        .attr('x', this.dimensions.width / 2)
        .attr('y', this.dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#7f8c8d')
        .text('Insufficient data for correlation analysis');
      return;
    }

    this.renderMatrix();
  }

  calculateCorrelations() {
    // Combine both datasets for comprehensive analysis
    let combinedData = [];
    
    // Use road safety data if available
    if (this.data && this.data.byJurisdiction) {
      combinedData = this.data.byJurisdiction.map(d => ({
        jurisdiction: d.jurisdiction,
        totalFines: d.totalFines || 0,
        totalArrests: d.totalArrests || 0,
        totalCharges: d.totalCharges || 0,
        population: this.getPopulation(d.jurisdiction),
        type: 'general'
      }));
    }

    // Add drugs & alcohol data if available
    if (this.drugsAlcoholData && this.drugsAlcoholData.byJurisdiction) {
      const drugsData = this.drugsAlcoholData.byJurisdiction.map(d => ({
        jurisdiction: d.jurisdiction,
        drugFines: d.totalFines || 0,
        drugArrests: d.totalArrests || 0,
        drugCharges: d.totalCharges || 0,
        type: 'drugs_alcohol'
      }));

      // Merge with existing data
      combinedData = combinedData.map(item => {
        const drugMatch = drugsData.find(d => d.jurisdiction === item.jurisdiction);
        return {
          ...item,
          drugFines: drugMatch ? drugMatch.drugFines : 0,
          drugArrests: drugMatch ? drugMatch.drugArrests : 0,
          drugCharges: drugMatch ? drugMatch.drugCharges : 0
        };
      });

      // Add any missing jurisdictions from drugs data
      drugsData.forEach(drugItem => {
        if (!combinedData.find(item => item.jurisdiction === drugItem.jurisdiction)) {
          combinedData.push({
            jurisdiction: drugItem.jurisdiction,
            totalFines: 0,
            totalArrests: 0,
            totalCharges: 0,
            population: this.getPopulation(drugItem.jurisdiction),
            drugFines: drugItem.drugFines,
            drugArrests: drugItem.drugArrests,
            drugCharges: drugItem.drugCharges,
            type: 'drugs_alcohol'
          });
        }
      });
    }

    if (combinedData.length === 0) return null;

    // Calculate per-capita rates
    combinedData = combinedData.map(d => ({
      ...d,
      finesPerCapita: d.population > 0 ? (d.totalFines / d.population) * 100000 : 0,
      arrestsPerCapita: d.population > 0 ? (d.totalArrests / d.population) * 100000 : 0,
      chargesPerCapita: d.population > 0 ? (d.totalCharges / d.population) * 100000 : 0,
      drugFinesPerCapita: d.population > 0 ? ((d.drugFines || 0) / d.population) * 100000 : 0,
      enforcementEfficiency: d.totalFines > 0 ? ((d.totalArrests + d.totalCharges) / d.totalFines) : 0
    }));

    // Define variables for correlation analysis
    const variables = [
      { key: 'totalFines', label: 'Total Fines' },
      { key: 'totalArrests', label: 'Total Arrests' },
      { key: 'totalCharges', label: 'Total Charges' },
      { key: 'finesPerCapita', label: 'Fines per 100k' },
      { key: 'enforcementEfficiency', label: 'Enforcement Efficiency' }
    ];

    // Add drugs & alcohol variables if available
    if (this.drugsAlcoholData) {
      variables.push(
        { key: 'drugFines', label: 'Drug/Alcohol Fines' },
        { key: 'drugFinesPerCapita', label: 'Drug Fines per 100k' }
      );
    }

    // Calculate correlation matrix
    const correlations = [];
    
    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        
        const values1 = combinedData.map(d => d[var1.key]).filter(v => !isNaN(v) && isFinite(v));
        const values2 = combinedData.map(d => d[var2.key]).filter(v => !isNaN(v) && isFinite(v));
        
        if (values1.length > 2 && values2.length > 2) {
          const correlation = this.pearsonCorrelation(values1, values2);
          correlations.push({
            x: i,
            y: j,
            var1: var1.label,
            var2: var2.label,
            correlation: correlation,
            significance: this.getSignificance(correlation, Math.min(values1.length, values2.length))
          });
        } else {
          correlations.push({
            x: i,
            y: j,
            var1: var1.label,
            var2: var2.label,
            correlation: 0,
            significance: 'insufficient_data'
          });
        }
      }
    }

    this.variables = variables;
    return correlations;
  }

  pearsonCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  getSignificance(r, n) {
    if (n < 3) return 'insufficient_data';
    
    const tStat = Math.abs(r) * Math.sqrt((n - 2) / (1 - r * r));
    
    if (tStat > 2.576) return 'very_significant'; // p < 0.01
    if (tStat > 1.96) return 'significant'; // p < 0.05
    if (tStat > 1.645) return 'marginally_significant'; // p < 0.1
    return 'not_significant';
  }

  renderMatrix() {
    const cellSize = Math.min(
      this.dimensions.width / this.variables.length,
      this.dimensions.height / this.variables.length
    ) - 2;

    // Color scale for correlations
    const colorScale = d3.scaleSequential(d3.interpolateRdBu)
      .domain([1, -1]); // Note: reversed for intuitive colors

    // Add cells
    const cells = this.chart.selectAll('.correlation-cell')
      .data(this.correlationData)
      .enter()
      .append('rect')
      .attr('class', 'correlation-cell')
      .attr('x', d => d.x * (cellSize + 2))
      .attr('y', d => d.y * (cellSize + 2))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => colorScale(d.correlation))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        this.showTooltip(event, d);
      })
      .on('mousemove', (event) => {
        this.moveTooltip(event);
      })
      .on('mouseout', () => {
        this.hideTooltip();
      });

    // Add correlation values
    this.chart.selectAll('.correlation-text')
      .data(this.correlationData)
      .enter()
      .append('text')
      .attr('class', 'correlation-text')
      .attr('x', d => d.x * (cellSize + 2) + cellSize / 2)
      .attr('y', d => d.y * (cellSize + 2) + cellSize / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', `${Math.min(cellSize / 4, 12)}px`)
      .style('font-weight', 'bold')
      .style('fill', d => Math.abs(d.correlation) > 0.5 ? '#fff' : '#000')
      .text(d => d.correlation.toFixed(2))
      .style('pointer-events', 'none');

    // Add variable labels (x-axis)
    this.chart.selectAll('.x-label')
      .data(this.variables)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', (d, i) => i * (cellSize + 2) + cellSize / 2)
      .attr('y', this.variables.length * (cellSize + 2) + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text(d => this.truncateLabel(d.label))
      .attr('transform', (d, i) => `rotate(-45, ${i * (cellSize + 2) + cellSize / 2}, ${this.variables.length * (cellSize + 2) + 20})`);

    // Add variable labels (y-axis)
    this.chart.selectAll('.y-label')
      .data(this.variables)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', (d, i) => i * (cellSize + 2) + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text(d => this.truncateLabel(d.label));

    // Add color legend
    this.addColorLegend(colorScale);

    // Add significance indicators
    this.addSignificanceIndicators();
  }

  addColorLegend(colorScale) {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = this.dimensions.width - legendWidth - 10;
    const legendY = -40;

    // Create gradient definition
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.selectAll('stop')
      .data(d3.range(-1, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', d => ((d + 1) / 2) * 100 + '%')
      .attr('stop-color', d => colorScale(d));

    // Add legend rectangle
    this.chart.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#correlation-gradient)')
      .style('stroke', '#999')
      .style('stroke-width', 1);

    // Add legend labels
    this.chart.append('text')
      .attr('x', legendX - 5)
      .attr('y', legendY + legendHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text('-1');

    this.chart.append('text')
      .attr('x', legendX + legendWidth + 5)
      .attr('y', legendY + legendHeight / 2)
      .attr('text-anchor', 'start')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text('1');

    this.chart.append('text')
      .attr('x', legendX + legendWidth / 2)
      .attr('y', legendY - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Correlation Coefficient');
  }

  addSignificanceIndicators() {
    // Add significance legend
    const sigLegend = this.chart.append('g')
      .attr('class', 'significance-legend')
      .attr('transform', `translate(${this.dimensions.width - 150}, ${this.dimensions.height - 80})`);

    sigLegend.append('rect')
      .attr('width', 140)
      .attr('height', 70)
      .attr('fill', '#f8f9fa')
      .attr('stroke', '#dee2e6')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    sigLegend.append('text')
      .attr('x', 70)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Significance Levels');

    const significanceData = [
      { level: '|r| > 0.7', description: 'Strong correlation' },
      { level: '|r| > 0.5', description: 'Moderate correlation' },
      { level: '|r| > 0.3', description: 'Weak correlation' }
    ];

    significanceData.forEach((sig, i) => {
      const y = 30 + i * 12;
      
      sigLegend.append('text')
        .attr('x', 10)
        .attr('y', y)
        .style('font-size', '9px')
        .style('font-weight', 'bold')
        .style('fill', '#495057')
        .text(sig.level);

      sigLegend.append('text')
        .attr('x', 50)
        .attr('y', y)
        .style('font-size', '9px')
        .style('fill', '#6c757d')
        .text(sig.description);
    });
  }

  showTooltip(event, d) {
    const strength = Math.abs(d.correlation);
    let strengthText = 'Very weak';
    if (strength > 0.7) strengthText = 'Strong';
    else if (strength > 0.5) strengthText = 'Moderate';
    else if (strength > 0.3) strengthText = 'Weak';

    const direction = d.correlation > 0 ? 'positive' : 'negative';
    
    this.tooltip
      .style('visibility', 'visible')
      .html(`
        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
          <strong>${d.var1} vs ${d.var2}</strong>
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Correlation:</strong> ${d.correlation.toFixed(3)}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Strength:</strong> ${strengthText}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Direction:</strong> ${direction}
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
          ${d.significance === 'very_significant' ? '⭐⭐ Highly significant (p < 0.01)' :
            d.significance === 'significant' ? '⭐ Significant (p < 0.05)' :
            d.significance === 'marginally_significant' ? '~ Marginally significant (p < 0.1)' :
            '○ Not statistically significant'}
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

  truncateLabel(label) {
    return label.length > 12 ? label.substring(0, 10) + '...' : label;
  }

  getPopulation(jurisdiction) {
    const populations = {
      ACT: 431000,
      NSW: 8166000,
      NT: 249000,
      QLD: 5260000,
      SA: 1803000,
      TAS: 571000,
      VIC: 6680000,
      WA: 2787000
    };
    return populations[jurisdiction] || 1000000;
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

// Initialize the correlation matrix chart
document.addEventListener('DOMContentLoaded', function() {
  const correlationContainer = document.getElementById('correlation-matrix');
  if (correlationContainer) {
    const correlationChart = new CorrelationMatrixChart();
    correlationChart.init();
    window.correlationChart = correlationChart;
  }
});