// js/insights/d3-responsive-charts.js
// Collection of responsive D3.js chart components

class ResponsiveD3Charts {
  constructor() {
    this.charts = new Map();
    this.data = null;
    this.colorSchemes = {
      primary: d3.schemeBlues[5],
      accent: d3.schemeOranges[5],
      categorical: d3.schemeCategory10
    };
  }

  // Initialize all chart components
  init() {
    this.subscribeToDataChanges();
    console.log('Responsive D3 Charts initialized');
  }

  subscribeToDataChanges() {
    if (window.enhancedD3DataLoader) {
      window.enhancedD3DataLoader.subscribe('dataLoaded', (data) => {
        this.updateAllCharts(data);
      }, 'charts-data-loaded');
      
      window.enhancedD3DataLoader.subscribe('dataFiltered', (data) => {
        this.updateAllCharts(data);
      }, 'charts-data-filtered');
    }
    
    document.addEventListener('d3DataReady', (event) => {
      this.updateAllCharts(event.detail.data);
    });
  }

  updateAllCharts(data) {
    this.data = data;
    
    // Update all registered charts
    this.charts.forEach((chart, chartId) => {
      if (chart.update) {
        chart.update(data);
      }
    });
  }

  // Time Series Chart Component
  createTimeSeriesChart(containerId, options = {}) {
    const defaultOptions = {
      width: 600,
      height: 300,
      margin: { top: 20, right: 30, bottom: 40, left: 70 },
      xField: 'year',
      yField: 'totalFines',
      showPoints: true,
      showArea: false,
      animate: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    const chart = {
      container: containerId,
      config,
      svg: null,
      scales: {},
      
      init() {
        this.setupSVG();
        this.createScales();
        this.createAxes();
      },
      
      setupSVG() {
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        this.svg = d3.select(`#${containerId}`)
          .append('svg')
          .attr('width', '100%')
          .attr('height', config.height)
          .attr('viewBox', `0 0 ${config.width} ${config.height}`);
        
        this.plotArea = this.svg.append('g')
          .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
        
        this.width = config.width - config.margin.left - config.margin.right;
        this.height = config.height - config.margin.top - config.margin.bottom;
      },
      
      createScales() {
        this.scales.x = d3.scaleLinear()
          .range([0, this.width]);
        
        this.scales.y = d3.scaleLinear()
          .range([this.height, 0]);
        
        this.scales.size = d3.scaleSqrt()
          .range([3, 20]);
        
        this.scales.color = d3.scaleOrdinal()
          .range(ResponsiveD3Charts.prototype.colorSchemes.categorical);
      },
      
      createAxes() {
        this.xAxisGroup = this.plotArea.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0, ${this.height})`);
        
        this.yAxisGroup = this.plotArea.append('g')
          .attr('class', 'y-axis');
        
        // Add axis labels
        this.svg.append('text')
          .attr('class', 'axis-label')
          .attr('text-anchor', 'middle')
          .attr('x', config.width / 2)
          .attr('y', config.height - 5)
          .style('font-size', '12px')
          .text('Per Capita Rate');
        
        this.svg.append('text')
          .attr('class', 'axis-label')
          .attr('text-anchor', 'middle')
          .attr('transform', 'rotate(-90)')
          .attr('x', -config.height / 2)
          .attr('y', 15)
          .style('font-size', '12px')
          .text('Growth Rate (%)');
      },
      
      update(data) {
        if (!data || !data.byJurisdiction) return;
        
        const chartData = data.byJurisdiction;
        
        // Update scales
        this.scales.x.domain(d3.extent(chartData, d => d[config.xField]));
        this.scales.y.domain(d3.extent(chartData, d => d[config.yField]));
        this.scales.size.domain(d3.extent(chartData, d => d[config.sizeField]));
        
        // Update axes
        this.xAxisGroup
          .transition()
          .duration(750)
          .call(d3.axisBottom(this.scales.x));
        
        this.yAxisGroup
          .transition()
          .duration(750)
          .call(d3.axisLeft(this.scales.y));
        
        // Create circles
        const circles = this.plotArea.selectAll('.point')
          .data(chartData, d => d[config.colorField]);
        
        // Enter new circles
        const circlesEnter = circles.enter()
          .append('circle')
          .attr('class', 'point')
          .attr('r', 0)
          .style('fill', d => this.scales.color(d[config.colorField]))
          .style('opacity', 0.7)
          .style('stroke', 'white')
          .style('stroke-width', 2);
        
        // Update all circles
        circlesEnter.merge(circles)
          .transition()
          .duration(750)
          .attr('cx', d => this.scales.x(d[config.xField]))
          .attr('cy', d => this.scales.y(d[config.yField]))
          .attr('r', d => this.scales.size(d[config.sizeField]));
        
        // Remove old circles
        circles.exit()
          .transition()
          .duration(750)
          .attr('r', 0)
          .remove();
        
        // Add hover effects and tooltips
        this.plotArea.selectAll('.point')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 1)
              .attr('r', function() { return +d3.select(this).attr('r') * 1.2; });
          })
          .on('mouseout', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 0.7)
              .attr('r', d => chart.scales.size(d[config.sizeField]));
          });
      }
    };
    
    chart.init();
    this.charts.set(containerId, chart);
    return chart;
  }

  // Animated Counter Component
  createAnimatedCounter(containerId, options = {}) {
    const defaultOptions = {
      duration: 2000,
      startValue: 0,
      format: d3.format(','),
      suffix: '',
      prefix: ''
    };
    
    const config = { ...defaultOptions, ...options };
    
    const counter = {
      container: containerId,
      config,
      element: null,
      currentValue: config.startValue,
      
      init() {
        this.element = d3.select(`#${containerId}`);
      },
      
      animateTo(targetValue) {
        const startValue = this.currentValue;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / config.duration, 1);
          
          // Easing function (ease-out cubic)
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          
          const currentValue = startValue + (targetValue - startValue) * easedProgress;
          
          // Update display
          const formattedValue = config.prefix + config.format(currentValue) + config.suffix;
          this.element.text(formattedValue);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            this.currentValue = targetValue;
            // Add completion effect
            this.element
              .transition()
              .duration(300)
              .style('color', '#10b981')
              .transition()
              .duration(300)
              .style('color', null);
          }
        };
        
        requestAnimationFrame(animate);
      },
      
      update(data) {
        // This would be customized based on what metric the counter should show
        // For now, we'll use total fines as an example
        if (data && data.summary) {
          this.animateTo(data.summary.totalFines);
        }
      }
    };
    
    counter.init();
    this.charts.set(containerId, counter);
    return counter;
  }

  // Sparkline Component
  createSparkline(containerId, options = {}) {
    const defaultOptions = {
      width: 200,
      height: 50,
      margin: 2,
      strokeWidth: 2,
      showArea: false,
      color: '#3b82f6'
    };
    
    const config = { ...defaultOptions, ...options };
    
    const chart = {
      container: containerId,
      config,
      svg: null,
      
      init() {
        this.setupSVG();
        this.width = config.width - config.margin * 2;
        this.height = config.height - config.margin * 2;
      },
      
      setupSVG() {
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        this.svg = d3.select(`#${containerId}`)
          .append('svg')
          .attr('width', '100%')
          .attr('height', config.height)
          .attr('viewBox', `0 0 ${config.width} ${config.height}`);
        
        this.plotArea = this.svg.append('g')
          .attr('transform', `translate(${config.margin}, ${config.margin})`);
      },
      
      update(data) {
        if (!data || !data.byYear) return;
        
        const chartData = data.byYear;
        
        // Create scales
        const xScale = d3.scaleLinear()
          .domain(d3.extent(chartData, d => d.year))
          .range([0, this.width]);
        
        const yScale = d3.scaleLinear()
          .domain(d3.extent(chartData, d => d.totalFines))
          .range([this.height, 0]);
        
        // Create line generator
        const line = d3.line()
          .x(d => xScale(d.year))
          .y(d => yScale(d.totalFines))
          .curve(d3.curveCardinal);
        
        // Remove existing elements
        this.plotArea.selectAll('*').remove();
        
        // Add area if enabled
        if (config.showArea) {
          const area = d3.area()
            .x(d => xScale(d.year))
            .y0(this.height)
            .y1(d => yScale(d.totalFines))
            .curve(d3.curveCardinal);
          
          this.plotArea.append('path')
            .datum(chartData)
            .attr('fill', config.color)
            .attr('opacity', 0.3)
            .attr('d', area);
        }
        
        // Add line
        this.plotArea.append('path')
          .datum(chartData)
          .attr('fill', 'none')
          .attr('stroke', config.color)
          .attr('stroke-width', config.strokeWidth)
          .attr('d', line);
        
        // Add final point
        this.plotArea.append('circle')
          .attr('cx', xScale(chartData[chartData.length - 1].year))
          .attr('cy', yScale(chartData[chartData.length - 1].totalFines))
          .attr('r', 2)
          .attr('fill', config.color);
      }
    };
    
    chart.init();
    this.charts.set(containerId, chart);
    return chart;
  }

  // Method to create multiple chart types at once
  initializeDashboardCharts() {
    // Time series chart for overall trends
    if (document.getElementById('trend-chart')) {
      this.createTimeSeriesChart('trend-chart', {
        width: 600,
        height: 300,
        showPoints: true,
        showArea: false
      });
    }
    
    // Bar chart for jurisdiction comparison
    if (document.getElementById('jurisdiction-bar-chart')) {
      this.createBarChart('jurisdiction-bar-chart', {
        width: 700,
        height: 400,
        sortData: true
      });
    }
    
    // Pie chart for age group breakdown
    if (document.getElementById('age-pie-chart')) {
      this.createPieChart('age-pie-chart', {
        width: 400,
        height: 400,
        valueField: 'totalFines',
        labelField: 'ageGroup'
      });
    }
    
    // Scatter plot for performance analysis
    if (document.getElementById('performance-scatter')) {
      this.createScatterPlot('performance-scatter', {
        width: 500,
        height: 400,
        xField: 'perCapita',
        yField: 'growthRate',
        sizeField: 'totalFines'
      });
    }
    
    // Animated counters for key metrics
    const counterConfigs = [
      { id: 'total-fines-counter', format: d3.format(',') },
      { id: 'growth-rate-counter', format: d3.format('.1f'), suffix: '%' },
      { id: 'jurisdiction-count-counter', format: d3.format('d') }
    ];
    
    counterConfigs.forEach(config => {
      if (document.getElementById(config.id)) {
        this.createAnimatedCounter(config.id, config);
      }
    });
    
    console.log('Dashboard charts initialized');
  }

  // Utility methods
  getChart(chartId) {
    return this.charts.get(chartId);
  }
  
  removeChart(chartId) {
    const chart = this.charts.get(chartId);
    if (chart && chart.container) {
      d3.select(`#${chart.container}`).selectAll('*').remove();
    }
    this.charts.delete(chartId);
  }
  
  resizeCharts() {
    this.charts.forEach((chart, chartId) => {
      if (chart.resize) {
        chart.resize();
      }
    });
  }
  
  // Method to export chart data
  exportChartsData() {
    const exportData = {};
    this.charts.forEach((chart, chartId) => {
      if (chart.exportData) {
        exportData[chartId] = chart.exportData();
      }
    });
    return exportData;
  }
}

// Global instance
window.responsiveD3Charts = new ResponsiveD3Charts();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.responsiveD3Charts.init();
  
  // Initialize dashboard charts if we're on the insights page
  if (window.location.pathname.includes('insights')) {
    setTimeout(() => {
      window.responsiveD3Charts.initializeDashboardCharts();
    }, 1000);
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    window.responsiveD3Charts.resizeCharts();
  });
  
  console.log('Responsive D3 Charts system initialized');
});

// Export the class
window.ResponsiveD3Charts = ResponsiveD3Charts;setupSVG();
        this.createScales();
        this.createAxes();
      },
      
      setupSVG() {
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        this.svg = d3.select(`#${containerId}`)
          .append('svg')
          .attr('width', '100%')
          .attr('height', config.height)
          .attr('viewBox', `0 0 ${config.width} ${config.height}`);
        
        this.plotArea = this.svg.append('g')
          .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
        
        this.width = config.width - config.margin.left - config.margin.right;
        this.height = config.height - config.margin.top - config.margin.bottom;
      },
      
      createScales() {
        this.scales.x = d3.scaleLinear()
          .range([0, this.width]);
        
        this.scales.y = d3.scaleLinear()
          .range([this.height, 0]);
      },
      
      createAxes() {
        this.xAxisGroup = this.plotArea.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0, ${this.height})`);
        
        this.yAxisGroup = this.plotArea.append('g')
          .attr('class', 'y-axis');
        
        // Add axis labels
        this.svg.append('text')
          .attr('class', 'axis-label')
          .attr('text-anchor', 'middle')
          .attr('x', config.width / 2)
          .attr('y', config.height - 5)
          .style('font-size', '12px')
          .text('Year');
        
        this.svg.append('text')
          .attr('class', 'axis-label')
          .attr('text-anchor', 'middle')
          .attr('transform', 'rotate(-90)')
          .attr('x', -config.height / 2)
          .attr('y', 15)
          .style('font-size', '12px')
          .text('Total Fines');
      },
      
      update(data) {
        if (!data || !data.byYear) return;
        
        const chartData = data.byYear;
        
        // Update scales
        this.scales.x.domain(d3.extent(chartData, d => d.year));
        this.scales.y.domain([0, d3.max(chartData, d => d.totalFines)]);
        
        // Update axes
        this.xAxisGroup
          .transition()
          .duration(750)
          .call(d3.axisBottom(this.scales.x).tickFormat(d3.format('d')));
        
        this.yAxisGroup
          .transition()
          .duration(750)
          .call(d3.axisLeft(this.scales.y).tickFormat(d3.format('.2s')));
        
        // Create line generator
        const line = d3.line()
          .x(d => this.scales.x(d.year))
          .y(d => this.scales.y(d.totalFines))
          .curve(d3.curveMonotoneX);
        
        // Draw line
        const path = this.plotArea.selectAll('.line')
          .data([chartData]);
        
        path.enter()
          .append('path')
          .attr('class', 'line')
          .style('fill', 'none')
          .style('stroke', '#3b82f6')
          .style('stroke-width', 3)
          .merge(path)
          .transition()
          .duration(750)
          .attr('d', line);
        
        // Draw points if enabled
        if (config.showPoints) {
          const points = this.plotArea.selectAll('.point')
            .data(chartData);
          
          points.enter()
            .append('circle')
            .attr('class', 'point')
            .attr('r', 4)
            .style('fill', '#3b82f6')
            .style('stroke', 'white')
            .style('stroke-width', 2)
            .merge(points)
            .transition()
            .duration(750)
            .attr('cx', d => this.scales.x(d.year))
            .attr('cy', d => this.scales.y(d.totalFines));
          
          points.exit().remove();
        }
      }
    };
    
    chart.init();
    this.charts.set(containerId, chart);
    return chart;
  }

  // Bar Chart Component
  createBarChart(containerId, options = {}) {
    const defaultOptions = {
      width: 600,
      height: 400,
      margin: { top: 20, right: 30, bottom: 60, left: 70 },
      xField: 'jurisdiction',
      yField: 'totalFines',
      colorField: null,
      sortData: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    const chart = {
      container: containerId,
      config,
      svg: null,
      scales: {},
      
      init() {
        this.setupSVG();
        this.createScales();
        this.createAxes();
      },
      
      setupSVG() {
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        this.svg = d3.select(`#${containerId}`)
          .append('svg')
          .attr('width', '100%')
          .attr('height', config.height)
          .attr('viewBox', `0 0 ${config.width} ${config.height}`);
        
        this.plotArea = this.svg.append('g')
          .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
        
        this.width = config.width - config.margin.left - config.margin.right;
        this.height = config.height - config.margin.top - config.margin.bottom;
      },
      
      createScales() {
        this.scales.x = d3.scaleBand()
          .range([0, this.width])
          .padding(0.1);
        
        this.scales.y = d3.scaleLinear()
          .range([this.height, 0]);
        
        this.scales.color = d3.scaleOrdinal()
          .range(ResponsiveD3Charts.prototype.colorSchemes.primary);
      },
      
      createAxes() {
        this.xAxisGroup = this.plotArea.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0, ${this.height})`);
        
        this.yAxisGroup = this.plotArea.append('g')
          .attr('class', 'y-axis');
      },
      
      update(data) {
        if (!data || !data.byJurisdiction) return;
        
        let chartData = [...data.byJurisdiction];
        
        if (config.sortData) {
          chartData.sort((a, b) => b[config.yField] - a[config.yField]);
        }
        
        // Update scales
        this.scales.x.domain(chartData.map(d => d[config.xField]));
        this.scales.y.domain([0, d3.max(chartData, d => d[config.yField])]);
        
        // Update axes
        this.xAxisGroup
          .transition()
          .duration(750)
          .call(d3.axisBottom(this.scales.x))
          .selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-45)');
        
        this.yAxisGroup
          .transition()
          .duration(750)
          .call(d3.axisLeft(this.scales.y).tickFormat(d3.format('.2s')));
        
        // Create bars
        const bars = this.plotArea.selectAll('.bar')
          .data(chartData, d => d[config.xField]);
        
        // Enter new bars
        const barsEnter = bars.enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => this.scales.x(d[config.xField]))
          .attr('width', this.scales.x.bandwidth())
          .attr('y', this.height)
          .attr('height', 0)
          .style('fill', (d, i) => this.scales.color(i))
          .style('opacity', 0.8);
        
        // Update all bars
        barsEnter.merge(bars)
          .transition()
          .duration(750)
          .attr('x', d => this.scales.x(d[config.xField]))
          .attr('y', d => this.scales.y(d[config.yField]))
          .attr('width', this.scales.x.bandwidth())
          .attr('height', d => this.height - this.scales.y(d[config.yField]));
        
        // Remove old bars
        bars.exit()
          .transition()
          .duration(750)
          .attr('y', this.height)
          .attr('height', 0)
          .remove();
        
        // Add hover effects
        this.plotArea.selectAll('.bar')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 1)
              .style('stroke', '#1e40af')
              .style('stroke-width', 2);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .style('opacity', 0.8)
              .style('stroke', 'none');
          });
      }
    };
    
    chart.init();
    this.charts.set(containerId, chart);
    return chart;
  }

  // Pie Chart Component
  createPieChart(containerId, options = {}) {
    const defaultOptions = {
      width: 400,
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      valueField: 'totalFines',
      labelField: 'ageGroup',
      showLabels: true,
      showLegend: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    const chart = {
      container: containerId,
      config,
      svg: null,
      
      init() {
        this.setupSVG();
        this.radius = Math.min(this.width, this.height) / 2 - 20;
      },
      
      setupSVG() {
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        this.svg = d3.select(`#${containerId}`)
          .append('svg')
          .attr('width', '100%')
          .attr('height', config.height)
          .attr('viewBox', `0 0 ${config.width} ${config.height}`);
        
        this.width = config.width - config.margin.left - config.margin.right;
        this.height = config.height - config.margin.top - config.margin.bottom;
        
        this.centerGroup = this.svg.append('g')
          .attr('transform', `translate(${config.width / 2}, ${config.height / 2})`);
      },
      
      update(data) {
        if (!data || !data.byAgeGroup) return;
        
        const chartData = data.byAgeGroup.filter(d => d.ageGroup !== 'All ages');
        
        // Create pie generator
        const pie = d3.pie()
          .value(d => d[config.valueField])
          .sort(null);
        
        // Create arc generator
        const arc = d3.arc()
          .innerRadius(0)
          .outerRadius(this.radius);
        
        const labelArc = d3.arc()
          .innerRadius(this.radius + 10)
          .outerRadius(this.radius + 10);
        
        // Color scale
        const colorScale = d3.scaleOrdinal()
          .range(ResponsiveD3Charts.prototype.colorSchemes.categorical);
        
        // Bind data
        const arcs = this.centerGroup.selectAll('.arc')
          .data(pie(chartData));
        
        // Enter new arcs
        const arcsEnter = arcs.enter()
          .append('g')
          .attr('class', 'arc');
        
        arcsEnter.append('path')
          .attr('fill', (d, i) => colorScale(i))
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
        
        if (config.showLabels) {
          arcsEnter.append('text')
            .attr('class', 'arc-label')
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold');
        }
        
        // Update arcs
        const arcsMerged = arcsEnter.merge(arcs);
        
        arcsMerged.select('path')
          .transition()
          .duration(750)
          .attrTween('d', function(d) {
            const interpolate = d3.interpolate(this._current || {startAngle: 0, endAngle: 0}, d);
            this._current = interpolate(0);
            return t => arc(interpolate(t));
          });
        
        if (config.showLabels) {
          arcsMerged.select('text')
            .transition()
            .duration(750)
            .attr('transform', d => `translate(${labelArc.centroid(d)})`)
            .text(d => {
              const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
              return `${d.data[config.labelField]}\n${percentage}%`;
            });
        }
        
        arcs.exit().remove();
      }
    };
    
    chart.init();
    this.charts.set(containerId, chart);
    return chart;
  }

  // Scatter Plot Component
  createScatterPlot(containerId, options = {}) {
    const defaultOptions = {
      width: 500,
      height: 400,
      margin: { top: 20, right: 30, bottom: 50, left: 70 },
      xField: 'perCapita',
      yField: 'growthRate',
      sizeField: 'totalFines',
      colorField: 'jurisdiction'
    };
    
    const config = { ...defaultOptions, ...options };
    
    const chart = {
      container: containerId,
      config,
      svg: null,
      scales: {},
      
      init() {
        this.