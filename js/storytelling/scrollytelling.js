// js/storytelling/scrollytelling.js - Create this new file

class Scrollytelling {
  constructor() {
    this.currentStep = 0;
    this.steps = [];
    this.chart = null;
    this.data = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.setupSteps();
    this.setupIntersectionObserver();
    this.setupChart();
    this.loadData();
  }

  setupSteps() {
    this.steps = Array.from(document.querySelectorAll('.story-step'));
    
    if (this.steps.length === 0) {
      console.log('No story steps found');
      return;
    }

    // Set initial active state
    this.steps.forEach((step, index) => {
      step.classList.toggle('active', index === 0);
    });
  }

  setupIntersectionObserver() {
    if (!this.steps.length) return;

    const options = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepIndex = this.steps.indexOf(entry.target);
          if (stepIndex !== -1 && stepIndex !== this.currentStep) {
            this.activateStep(stepIndex);
          }
        }
      });
    }, options);

    this.steps.forEach(step => observer.observe(step));
  }

  activateStep(stepIndex) {
    if (stepIndex === this.currentStep) return;

    // Update step states
    this.steps.forEach((step, index) => {
      step.classList.toggle('active', index === stepIndex);
    });

    this.currentStep = stepIndex;
    this.updateChart(stepIndex);
  }

  setupChart() {
    const chartContainer = document.getElementById('scrolly-chart');
    if (!chartContainer) return;

    // Chart dimensions
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear existing chart
    chartContainer.innerHTML = '';

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style('background', '#fafafa');

    this.chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Setup scales (will be updated with real data)
    this.xScale = d3.scaleLinear().range([0, width]);
    this.yScale = d3.scaleLinear().range([height, 0]);

    // Add axes
    this.xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'x-axis');

    this.yAxis = this.chart.append('g')
      .attr('class', 'y-axis');

    // Add axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', margin.left + width / 2)
      .attr('y', height + margin.top + 45)
      .text('Year')
      .style('font-size', '12px')
      .style('fill', '#666');

    svg.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(margin.top + height / 2))
      .attr('y', 20)
      .text('Number of Fines')
      .style('font-size', '12px')
      .style('fill', '#666');

    // Add title
    this.chartTitle = svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', margin.left + width / 2)
      .attr('y', 25)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Road Safety Enforcement Over Time');

    this.isInitialized = true;
  }

  loadData() {
    // Use sample data for scrollytelling
    this.data = this.generateSampleData();
    
    // Wait for global data if available
    if (window.roadSafetyData && window.roadSafetyData.processed) {
      this.data = this.processGlobalData(window.roadSafetyData.processed);
    } else {
      // Listen for data ready event
      document.addEventListener('roadSafetyDataReady', (event) => {
        this.data = this.processGlobalData(event.detail.data.processed);
        this.updateChart(this.currentStep);
      });
    }

    if (this.isInitialized) {
      this.updateChart(0);
    }
  }

  generateSampleData() {
    const years = d3.range(2008, 2024);
    return years.map(year => ({
      year,
      totalFines: Math.floor(50000 + (year - 2008) * 15000 + Math.random() * 20000),
      youngDrivers: Math.floor(15000 + (year - 2008) * 3000 + Math.random() * 5000),
      middleAged: Math.floor(25000 + (year - 2008) * 8000 + Math.random() * 10000),
      technology: year >= 2019 ? Math.floor(20000 + (year - 2019) * 25000) : 0
    }));
  }

  processGlobalData(processedData) {
    if (!processedData || !processedData.byYear) {
      return this.generateSampleData();
    }

    return processedData.byYear.map(d => ({
      year: d.year,
      totalFines: d.totalFines,
      youngDrivers: Math.floor(d.totalFines * 0.15), // Approximate
      middleAged: Math.floor(d.totalFines * 0.45),   // Approximate
      technology: d.year >= 2019 ? Math.floor(d.totalFines * 0.3) : 0
    }));
  }

  updateChart(stepIndex) {
    if (!this.chart || !this.data) return;

    // Clear previous annotations
    this.chart.selectAll('.annotation').remove();
    this.chart.selectAll('.highlight').remove();

    // Update scales
    this.xScale.domain(d3.extent(this.data, d => d.year));
    this.yScale.domain([0, d3.max(this.data, d => d.totalFines) * 1.1]);

    // Update axes
    this.xAxis.transition().duration(750)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')));

    this.yAxis.transition().duration(750)
      .call(d3.axisLeft(this.yScale).tickFormat(d => d3.format(',.0f')(d)));

    // Chart content based on step
    switch (stepIndex) {
      case 0:
        this.showAssumptionChart();
        break;
      case 1:
        this.showRealityChart();
        break;
      case 2:
        this.showTechnologyChart();
        break;
      case 3:
        this.showImplicationsChart();
        break;
      default:
        this.showOverviewChart();
    }
  }

  showAssumptionChart() {
    this.chartTitle.text('Common Assumption: Young Drivers Are The Problem');

    // Show hypothetical young driver trend
    const line = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.youngDrivers * 3)) // Exaggerated for effect
      .curve(d3.curveMonotoneX);

    this.chart.selectAll('.assumption-line').remove();
    
    const path = this.chart.append('path')
      .datum(this.data)
      .attr('class', 'assumption-line')
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', line)
      .style('opacity', 0.7);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);

    // Add annotation
    this.chart.append('text')
      .attr('class', 'annotation')
      .attr('x', this.xScale(2015))
      .attr('y', this.yScale(this.data.find(d => d.year === 2015).youngDrivers * 3) - 20)
      .text('Expected: Young drivers dominate')
      .style('fill', '#ef4444')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', 1);
  }

  showRealityChart() {
    this.chartTitle.text('Reality: Middle-Aged Adults Lead in Violations');

    // Show actual total fines
    const line = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    this.chart.selectAll('.reality-line').remove();
    
    const path = this.chart.append('path')
      .datum(this.data)
      .attr('class', 'reality-line')
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 4)
      .attr('d', line);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);

    // Add data points for emphasis
    this.chart.selectAll('.data-point')
      .data(this.data.filter(d => d.year % 3 === 0)) // Every 3rd year
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => this.xScale(d.year))
      .attr('cy', d => this.yScale(d.totalFines))
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .transition()
      .delay((d, i) => 1000 + i * 200)
      .duration(300)
      .attr('r', 6);

    // Highlight 2021 peak
    const peakData = this.data.reduce((max, d) => d.totalFines > max.totalFines ? d : max);
    
    this.chart.append('circle')
      .attr('class', 'highlight')
      .attr('cx', this.xScale(peakData.year))
      .attr('cy', this.yScale(peakData.totalFines))
      .attr('r', 0)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 3)
      .transition()
      .delay(1800)
      .duration(500)
      .attr('r', 15)
      .style('opacity', 0.8);

    // Add peak annotation
    this.chart.append('text')
      .attr('class', 'annotation')
      .attr('x', this.xScale(peakData.year))
      .attr('y', this.yScale(peakData.totalFines) - 30)
      .attr('text-anchor', 'middle')
      .text(`Peak: ${peakData.year}`)
      .style('fill', '#f59e0b')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .transition()
      .delay(2000)
      .duration(500)
      .style('opacity', 1);
  }

  showTechnologyChart() {
    this.chartTitle.text('The Technology Factor: Automated Detection Impact');

    // Show technology implementation area
    const area = d3.area()
      .x(d => this.xScale(d.year))
      .y0(this.yScale(0))
      .y1(d => this.yScale(d.technology))
      .curve(d3.curveMonotoneX);

    this.chart.append('path')
      .datum(this.data.filter(d => d.year >= 2019))
      .attr('class', 'tech-area')
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.3)
      .attr('d', area)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    // Add total fines line for context
    const line = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    this.chart.append('path')
      .datum(this.data)
      .attr('class', 'context-line')
      .attr('fill', 'none')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.5)
      .attr('d', line);

    // Add technology milestone markers
    const techMilestones = [
      { year: 2019, label: 'Mobile phone cameras', color: '#10b981' },
      { year: 2020, label: 'AI detection', color: '#3b82f6' },
      { year: 2021, label: 'Full deployment', color: '#f59e0b' }
    ];

    techMilestones.forEach((milestone, i) => {
      const data = this.data.find(d => d.year === milestone.year);
      if (data) {
        this.chart.append('line')
          .attr('class', 'annotation')
          .attr('x1', this.xScale(milestone.year))
          .attr('x2', this.xScale(milestone.year))
          .attr('y1', this.yScale(0))
          .attr('y2', this.yScale(data.totalFines))
          .attr('stroke', milestone.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '3,3')
          .style('opacity', 0)
          .transition()
          .delay(500 + i * 300)
          .duration(500)
          .style('opacity', 0.8);

        this.chart.append('text')
          .attr('class', 'annotation')
          .attr('x', this.xScale(milestone.year))
          .attr('y', this.yScale(data.totalFines) - 20 - i * 15)
          .attr('text-anchor', 'middle')
          .text(milestone.label)
          .style('fill', milestone.color)
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .style('opacity', 0)
          .transition()
          .delay(800 + i * 300)
          .duration(500)
          .style('opacity', 1);
      }
    });
  }

  showImplicationsChart() {
    this.chartTitle.text('Implications: Rethinking Road Safety Strategies');

    // Show comparison between age groups
    const ageGroups = ['Young (17-25)', 'Middle-aged (40-64)'];
    const colors = ['#ef4444', '#f59e0b'];
    
    // Create grouped bar chart for recent years
    const recentData = this.data.filter(d => d.year >= 2020);
    const barWidth = 30;
    const groupWidth = barWidth * 2 + 10;

    recentData.forEach((yearData, yearIndex) => {
      const x = this.xScale(yearData.year);
      
      // Young drivers bar
      this.chart.append('rect')
        .attr('class', 'age-bar')
        .attr('x', x - groupWidth/2)
        .attr('y', this.yScale(yearData.youngDrivers))
        .attr('width', barWidth)
        .attr('height', this.yScale(0) - this.yScale(yearData.youngDrivers))
        .attr('fill', colors[0])
        .attr('opacity', 0.8)
        .style('opacity', 0)
        .transition()
        .delay(yearIndex * 200)
        .duration(500)
        .style('opacity', 0.8);

      // Middle-aged drivers bar
      this.chart.append('rect')
        .attr('class', 'age-bar')
        .attr('x', x - groupWidth/2 + barWidth + 5)
        .attr('y', this.yScale(yearData.middleAged))
        .attr('width', barWidth)
        .attr('height', this.yScale(0) - this.yScale(yearData.middleAged))
        .attr('fill', colors[1])
        .attr('opacity', 0.8)
        .style('opacity', 0)
        .transition()
        .delay(yearIndex * 200 + 100)
        .duration(500)
        .style('opacity', 0.8);
    });

    // Add legend
    const legend = this.chart.append('g')
      .attr('class', 'annotation')
      .attr('transform', `translate(${this.xScale.range()[1] - 120}, 20)`);

    ageGroups.forEach((group, i) => {
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colors[i])
        .attr('opacity', 0.8);

      legend.append('text')
        .attr('x', 20)
        .attr('y', i * 20 + 12)
        .text(group)
        .style('font-size', '11px')
        .style('fill', '#333');
    });

    // Add key insight text
    this.chart.append('text')
      .attr('class', 'annotation')
      .attr('x', this.xScale(2021))
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .text('Middle-aged drivers consistently')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style('opacity', 1);

    this.chart.append('text')
      .attr('class', 'annotation')
      .attr('x', this.xScale(2021))
      .attr('y', 65)
      .attr('text-anchor', 'middle')
      .text('outnumber young drivers')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#f59e0b')
      .style('opacity', 0)
      .transition()
      .delay(1200)
      .duration(500)
      .style('opacity', 1);
  }

  showOverviewChart() {
    // Default overview showing total trend
    const line = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    this.chart.append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);
  }

  // Method to jump to specific step (useful for navigation)
  jumpToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  // Method to get current step data (useful for analytics)
  getCurrentStepData() {
    return {
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      stepElement: this.steps[this.currentStep]
    };
  }
}

// Initialize scrollytelling when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on a page with scrollytelling
  if (document.querySelector('.scrollytelling-container')) {
    window.scrollytelling = new Scrollytelling();
  }
});

// Export for external use
window.Scrollytelling = Scrollytelling;