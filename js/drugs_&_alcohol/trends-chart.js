// js/drugs_&_alcohol/trends-chart.js
// Fixed time trends visualization - FOCUS ON FINES

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
      totalFines: '#3498db',      // PRIMARY FOCUS - FINES
      totalArrests: '#95a5a6',    // SECONDARY - Muted
      totalCharges: '#bdc3c7',    // TERTIARY - Very muted
      drugRelated: '#9b59b6',
      alcoholRelated: '#e67e22'
    };

    this.focusOnFines = true; // PRIMARY FOCUS
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

    // Add title - FOCUS ON FINES
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Drugs & Alcohol FINES Trends (2008-2023)');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Evolution of fines (primary focus) with arrests and charges context');
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

    console.log('Rendering trends chart - FINES focus');

    // Clear previous content
    this.chart.selectAll('*').remove();

    // Check for filtered data first
    const dataToUse = window.drugsAlcoholData?.filtered?.processed || this.data;
    const timeData = dataToUse.byYear;
    
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

    // Scales - FOCUS ON FINES
    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, this.dimensions.width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.totalFines) * 1.2]) // FOCUS ON FINES
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

    // Add axis labels - FOCUS ON FINES
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
      .text('Number of FINES (Primary Focus)');

    // Line generators
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Prepare line data - FOCUS ON FINES (primary), others secondary
    const lines = [
      {
        key: 'totalFines',
        label: 'FINES (Primary)',
        color: this.colors.totalFines,
        strokeWidth: 4,
        pointRadius: 6,
        primary: true,
        data: timeData.map(d => ({ year: d.year, value: d.totalFines }))
      },
      {
        key: 'totalArrests',
        label: 'Arrests',
        color: this.colors.totalArrests,
        strokeWidth: 2,
        pointRadius: 3,
        primary: false,
        data: timeData.map(d => ({ year: d.year, value: d.totalArrests }))
      },
      {
        key: 'totalCharges',
        label: 'Charges',
        color: this.colors.totalCharges,
        strokeWidth: 2,
        pointRadius: 3,
        primary: false,
        data: timeData.map(d => ({ year: d.year, value: d.totalCharges }))
      }
    ];

    // Scale for secondary metrics (arrests/charges) - use separate scale
    const yScaleSecondary = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => Math.max(d.totalArrests, d.totalCharges)) * 1.2])
      .nice()
      .range([this.dimensions.height, 0]);

    // Draw lines - FINES primary, others secondary
    lines.forEach((lineData, index) => {
      const scaleToUse = lineData.primary ? yScale : yScaleSecondary;
      
      const lineGenerator = d3.line()
        .x(d => xScale(d.year))
        .y(d => scaleToUse(d.value))
        .curve(d3.curveMonotoneX);

      // Draw line
      this.chart.append('path')
        .datum(lineData.data)
        .attr('fill', 'none')
        .attr('stroke', lineData.color)
        .attr('stroke-width', lineData.strokeWidth)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', lineData.primary ? 'none' : '5,5') // Dashed for secondary
        .attr('d', lineGenerator)
        .style('cursor', 'pointer')
        .style('opacity', lineData.primary ? 1 : 0.7)
        .on('mouseover', (event) => {
          // Highlight line
          d3.select(event.target)
            .transition()
            .duration(200)
            .attr('stroke-width', lineData.strokeWidth + 1);

          this.tooltip
            .style('visibility', 'visible')
            .html(`
              <strong>${lineData.label} Trend</strong><br>
              ${lineData.primary ? '🎯 PRIMARY METRIC' : 'Secondary context'}<br>
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
            .attr('stroke-width', lineData.strokeWidth);
          
          this.tooltip.style('visibility', 'hidden');
        });

      // Draw points
      this.chart.selectAll(`.point-${lineData.key}`)
        .data(lineData.data)
        .enter()
        .append('circle')
        .attr('class', `point-${lineData.key}`)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => scaleToUse(d.value))
        .attr('r', lineData.pointRadius)
        .attr('fill', lineData.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', lineData.primary ? 3 : 2)
        .style('cursor', 'pointer')
        .style('opacity', lineData.primary ? 1 : 0.7)
        .on('mouseover', (event, d) => {
          d3.select(event.target)
            .transition()
            .duration(200)
            .attr('r', lineData.pointRadius + 2);

          // Find corresponding data for all metrics in this year
          const yearData = timeData.find(td => td.year === d.year);
          const yearOverYearChange = this.calculateYearOverYearChange(timeData, d.year, lineData.key);

          let tooltipContent = `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
              <strong>${d.year} - ${lineData.label}</strong>
              ${lineData.primary ? '<br>🎯 PRIMARY METRIC' : ''}
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Value:</strong> ${d.value.toLocaleString()}
            </div>`;

          if (yearOverYearChange !== null) {
            tooltipContent += `
              <div style="margin-bottom: 6px;">
                <strong>YoY Change:</strong> 
                <span style="color: ${yearOverYearChange > 0 ? '#2ecc71' : '#e74c3c'};">
                  ${yearOverYearChange > 0 ? '+' : ''}${yearOverYearChange.toFixed(1)}%
                </span>
              </div>`;
          }

          tooltipContent += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
              All ${d.year}:<br>
              <strong>FINES: ${yearData.totalFines.toLocaleString()}</strong><br>
              Arrests: ${yearData.totalArrests.toLocaleString()}, 
              Charges: ${yearData.totalCharges.toLocaleString()}
            </div>`;

          this.tooltip
            .style('visibility', 'visible')
            .html(tooltipContent);
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
            .attr('r', lineData.pointRadius);
          
          this.tooltip.style('visibility', 'hidden');
        });
    });

    // Add secondary y-axis for arrests/charges
    const yAxisSecondary = this.chart.append('g')
      .attr('transform', `translate(${this.dimensions.width}, 0)`)
      .call(d3.axisRight(yScaleSecondary)
        .tickFormat(d => d >= 1000 ? d3.format('.1s')(d) : d3.format(',.0f')(d)));

    yAxisSecondary.selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#95a5a6');

    // Add secondary axis label
    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(90)')
      .attr('x', this.dimensions.height / 2)
      .attr('y', this.dimensions.width + 40)
      .style('font-size', '12px')
      .style('font-weight', '400')
      .style('fill', '#95a5a6')
      .text('Arrests & Charges (Secondary)');

    // Add legend - FOCUS ON FINES
    this.addFinesFocusedLegend(lines);

    // Add trend analysis - FOCUS ON FINES
    this.addFinesTrendAnalysis(timeData);
  }

  calculateYearOverYearChange(data, currentYear, metric) {
    const currentIndex = data.findIndex(d => d.year === currentYear);
    if (currentIndex <= 0) return null;

    const currentValue = data[currentIndex][metric];
    const previousValue = data[currentIndex - 1][metric];

    if (previousValue === 0) return null;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  addFinesFocusedLegend(lines) {
    const legend = this.chart.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.dimensions.width + 20}, 50)`);

    lines.forEach((lineData, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${index * 30})`);

      // Line sample
      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 25)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', lineData.color)
        .attr('stroke-width', lineData.strokeWidth)
        .attr('stroke-dasharray', lineData.primary ? 'none' : '5,5')
        .style('opacity', lineData.primary ? 1 : 0.7);

      // Point sample
      legendItem.append('circle')
        .attr('cx', 12)
        .attr('cy', 0)
        .attr('r', lineData.pointRadius)
        .attr('fill', lineData.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', lineData.primary ? 3 : 2)
        .style('opacity', lineData.primary ? 1 : 0.7);

      // Label
      legendItem.append('text')
        .attr('x', 35)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('font-size', lineData.primary ? '12px' : '10px')
        .style('font-weight', lineData.primary ? 'bold' : 'normal')
        .style('fill', '#2c3e50')
        .text(lineData.label);
    });
  }

  addFinesTrendAnalysis(data) {
    // Find peak FINES year (primary focus)
    const peakFines = data.reduce((max, d) => d.totalFines > max.totalFines ? d : max);

    // Add annotations for significant events - FOCUS ON FINES
    if (peakFines) {
      const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.year), d3.max(data, d => d.year)])
        .range([0, this.dimensions.width]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalFines) * 1.2])
        .range([this.dimensions.height, 0]);

      // Peak FINES annotation
      this.chart.append('line')
        .attr('x1', xScale(peakFines.year))
        .attr('x2', xScale(peakFines.year))
        .attr('y1', yScale(peakFines.totalFines))
        .attr('y2', yScale(peakFines.totalFines) - 40)
        .attr('stroke', this.colors.totalFines)
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '4,4');

      this.chart.append('rect')
        .attr('x', xScale(peakFines.year) - 40)
        .attr('y', yScale(peakFines.totalFines) - 65)
        .attr('width', 80)
        .attr('height', 25)
        .attr('fill', this.colors.totalFines)
        .attr('rx', 12)
        .style('opacity', 0.9);

      this.chart.append('text')
        .attr('x', xScale(peakFines.year))
        .attr('y', yScale(peakFines.totalFines) - 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(`🎯 Peak FINES: ${peakFines.year}`);
    }

    // Add summary statistics box - FOCUS ON FINES
    const statsBox = this.svg.append('g')
      .attr('class', 'stats-box')
      .attr('transform', `translate(${this.dimensions.width + this.dimensions.margin.left + 20}, ${this.dimensions.margin.top + 200})`);

    statsBox.append('rect')
      .attr('width', 130)
      .attr('height', 140)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#3498db')
      .attr('stroke-width', 2)
      .attr('rx', 8);

    statsBox.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('FINES Summary:');

    const totalFines = d3.sum(data, d => d.totalFines);
    const totalArrests = d3.sum(data, d => d.totalArrests);
    const totalCharges = d3.sum(data, d => d.totalCharges);

    const summaryStats = [
      `🎯 Total FINES:`,
      `${totalFines.toLocaleString()}`,
      `Peak Year: ${peakFines.year}`,
      `Peak FINES: ${peakFines.totalFines.toLocaleString()}`,
      '',
      `Context:`,
      `Arrests: ${totalArrests.toLocaleString()}`,
      `Charges: ${totalCharges.toLocaleString()}`
    ];

    summaryStats.forEach((stat, i) => {
      if (stat === '') return; // Skip empty lines
      
      const isMainStat = stat.includes('🎯') || stat.includes('Peak');
      const isFinesNumber = !isNaN(stat.replace(/,/g, '')) && stat.length > 3;
      
      statsBox.append('text')
        .attr('x', 10)
        .attr('y', 40 + i * 12)
        .style('font-size', isMainStat || isFinesNumber ? '10px' : '9px')
        .style('font-weight', isMainStat || isFinesNumber ? 'bold' : 'normal')
        .style('fill', isMainStat || isFinesNumber ? '#3498db' : '#34495e')
        .text(stat);
    });
  }

  update() {
    console.log('Updating trends chart - FINES focus');
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
    console.log('Trends chart initialized - FINES focus enabled');
  }
});

// Export for use in other modules
window.DrugsAlcoholTrendsChart = DrugsAlcoholTrendsChart;
window.drugsAlcoholTrendsChart = drugsAlcoholTrendsChart;