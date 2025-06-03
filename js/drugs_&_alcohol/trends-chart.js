// js/drugs_&_alcohol/trends-chart.js
// Time trends visualization for drugs and alcohol enforcement data

class DrugsAlcoholTrendsChart {
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
      totalFines: '#3498db',
      totalArrests: '#e74c3c',
      totalCharges: '#f39c12',
      drugRelated: '#9b59b6',
      alcoholRelated: '#e67e22'
    };
  }

  init() {
    this.createSVG();
    this.createTooltip();
    this.loadData();
  }

  createSVG() {
    const container = d3.select('#trends-chart');
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
      .text('Drugs & Alcohol Enforcement Trends (2008-2023)');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Evolution of enforcement outcomes over time');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'drugs-alcohol-trends-tooltip')
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
      .style('z-index', 1001);
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

    const timeData = this.data.byYear;
    
    if (!timeData || timeData.length === 0) {
      this.chart.append('text')
        .attr('x', this.dimensions.width / 2)
        .attr('y', this.dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#7f8c8d')
        .text('No time trend data available');
      return;
    }

    // Prepare data
    const years = timeData.map(d => d.year);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, this.dimensions.width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => Math.max(d.totalFines, d.totalArrests, d.totalCharges)) * 1.1])
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
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.format('d'))
        .ticks(8));

    const yAxis = this.chart.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => d >= 1000 ? d3.format('.1s')(d) : d3.format(',.0f')(d)));

    // Style axes
    xAxis.selectAll('text').style('font-size', '12px').style('fill', '#7f8c8d');
    yAxis.selectAll('text').style('font-size', '12px').style('fill', '#7f8c8d');

    // Add axis labels
    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', this.dimensions.width / 2)
      .attr('y', this.dimensions.height + 60)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text('Year');

    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.dimensions.height / 2)
      .attr('y', -70)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text('Number of Enforcement Actions');

    // Line generators
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Prepare line data
    const lines = [
      {
        key: 'totalFines',
        label: 'Fines',
        color: this.colors.totalFines,
        data: timeData.map(d => ({ year: d.year, value: d.totalFines }))
      },
      {
        key: 'totalArrests',
        label: 'Arrests',
        color: this.colors.totalArrests,
        data: timeData.map(d => ({ year: d.year, value: d.totalArrests }))
      },
      {
        key: 'totalCharges',
        label: 'Charges',
        color: this.colors.totalCharges,
        data: timeData.map(d => ({ year: d.year, value: d.totalCharges }))
      }
    ];

    // Draw lines
    lines.forEach((lineData, index) => {
      // Draw line
      this.chart.append('path')
        .datum(lineData.data)
        .attr('fill', 'none')
        .attr('stroke', lineData.color)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('d', line)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          // Highlight line
          d3.select(event.target)
            .transition()
            .duration(200)
            .attr('stroke-width', 4);

          this.tooltip
            .style('visibility', 'visible')
            .html(`
              <strong>${lineData.label} Trend</strong><br>
              Click points for detailed values
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
            .attr('stroke-width', 3);
          
          this.tooltip.style('visibility', 'hidden');
        });

      // Draw points
      this.chart.selectAll(`.point-${lineData.key}`)
        .data(lineData.data)
        .enter()
        .append('circle')
        .attr('class', `point-${lineData.key}`)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', lineData.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.target)
            .transition()
            .duration(200)
            .attr('r', 6);

          // Find corresponding data for all metrics in this year
          const yearData = timeData.find(td => td.year === d.year);
          const yearOverYearChange = this.calculateYearOverYearChange(timeData, d.year, lineData.key);

          this.tooltip
            .style('visibility', 'visible')
            .html(`
              <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
                <strong>${d.year} - ${lineData.label}</strong>
              </div>
              <div style="margin-bottom: 6px;">
                <strong>Value:</strong> ${d.value.toLocaleString()}
              </div>
              ${yearOverYearChange !== null ? `
                <div style="margin-bottom: 6px;">
                  <strong>YoY Change:</strong> 
                  <span style="color: ${yearOverYearChange > 0 ? '#2ecc71' : '#e74c3c'};">
                    ${yearOverYearChange > 0 ? '+' : ''}${yearOverYearChange.toFixed(1)}%
                  </span>
                </div>
              ` : ''}
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
                All ${d.year}: Fines: ${yearData.totalFines.toLocaleString()}, 
                Arrests: ${yearData.totalArrests.toLocaleString()}, 
                Charges: ${yearData.totalCharges.toLocaleString()}
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
            .attr('r', 4);
          
          this.tooltip.style('visibility', 'hidden');
        });
    });

    // Add legend
    const legend = this.chart.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.dimensions.width + 20}, 50)`);

    lines.forEach((lineData, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${index * 25})`);

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', lineData.color)
        .attr('stroke-width', 3);

      legendItem.append('circle')
        .attr('cx', 10)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', lineData.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 30)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('fill', '#2c3e50')
        .text(lineData.label);
    });

    // Add trend analysis
    this.addTrendAnalysis(timeData);
  }

  calculateYearOverYearChange(data, currentYear, metric) {
    const currentIndex = data.findIndex(d => d.year === currentYear);
    if (currentIndex <= 0) return null;

    const currentValue = data[currentIndex][metric];
    const previousValue = data[currentIndex - 1][metric];

    if (previousValue === 0) return null;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  addTrendAnalysis(data) {
    // Find peak year
    const peakFines = data.reduce((max, d) => d.totalFines > max.totalFines ? d : max);
    const peakArrests = data.reduce((max, d) => d.totalArrests > max.totalArrests ? d : max);

    // Add annotations for significant events
    if (peakFines) {
      const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.year), d3.max(data, d => d.year)])
        .range([0, this.dimensions.width]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.totalFines, d.totalArrests, d.totalCharges)) * 1.1])
        .range([this.dimensions.height, 0]);

      // Peak fines annotation
      this.chart.append('line')
        .attr('x1', xScale(peakFines.year))
        .attr('x2', xScale(peakFines.year))
        .attr('y1', yScale(peakFines.totalFines))
        .attr('y2', yScale(peakFines.totalFines) - 40)
        .attr('stroke', this.colors.totalFines)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      this.chart.append('rect')
        .attr('x', xScale(peakFines.year) - 35)
        .attr('y', yScale(peakFines.totalFines) - 60)
        .attr('width', 70)
        .attr('height', 20)
        .attr('fill', this.colors.totalFines)
        .attr('rx', 10)
        .style('opacity', 0.9);

      this.chart.append('text')
        .attr('x', xScale(peakFines.year))
        .attr('y', yScale(peakFines.totalFines) - 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(`Peak: ${peakFines.year}`);
    }

    // Add summary statistics box
    const statsBox = this.svg.append('g')
      .attr('class', 'stats-box')
      .attr('transform', `translate(${this.dimensions.width + this.dimensions.margin.left + 20}, ${this.dimensions.margin.top + 150})`);

    statsBox.append('rect')
      .attr('width', 120)
      .attr('height', 120)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#bdc3c7')
      .attr('stroke-width', 1)
      .attr('rx', 8);

    statsBox.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Trend Summary:');

    const totalFines = d3.sum(data, d => d.totalFines);
    const totalArrests = d3.sum(data, d => d.totalArrests);
    const totalCharges = d3.sum(data, d => d.totalCharges);

    const summaryStats = [
      `Total Fines: ${totalFines.toLocaleString()}`,
      `Total Arrests: ${totalArrests.toLocaleString()}`,
      `Total Charges: ${totalCharges.toLocaleString()}`,
      `Peak Year: ${peakFines.year}`
    ];

    summaryStats.forEach((stat, i) => {
      statsBox.append('text')
        .attr('x', 10)
        .attr('y', 40 + i * 18)
        .style('font-size', '10px')
        .style('fill', '#34495e')
        .text(stat);
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

// Initialize the trends chart
let drugsAlcoholTrendsChart;

document.addEventListener('DOMContentLoaded', function() {
  const trendsContainer = document.getElementById('trends-chart');
  if (trendsContainer) {
    drugsAlcoholTrendsChart = new DrugsAlcoholTrendsChart();
    drugsAlcoholTrendsChart.init();
  }
});

// Export for use in other modules
window.DrugsAlcoholTrendsChart = DrugsAlcoholTrendsChart;
window.drugsAlcoholTrendsChart = drugsAlcoholTrendsChart;