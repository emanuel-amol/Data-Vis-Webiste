// js/storytelling/scrollytelling-fixed.js - Replace the existing scrollytelling.js with this

class FixedScrollytelling {
  constructor() {
    this.currentStep = 0;
    this.steps = [];
    this.chart = null;
    this.data = null;
    this.isInitialized = false;
    this.chartDimensions = null;
    
    this.init();
  }

  init() {
    console.log('Initializing scrollytelling...');
    this.setupSteps();
    this.setupChart();
    this.loadData();
    this.setupIntersectionObserver();
  }

  setupSteps() {
    this.steps = Array.from(document.querySelectorAll('.story-step'));
    console.log(`Found ${this.steps.length} story steps`);
    
    if (this.steps.length === 0) {
      console.warn('No story steps found');
      return;
    }

    // Set initial state - all steps inactive except first
    this.steps.forEach((step, index) => {
      step.classList.toggle('active', index === 0);
      step.style.opacity = index === 0 ? '1' : '0.3';
      step.style.borderLeftColor = index === 0 ? '#3b82f6' : 'transparent';
      step.style.background = index === 0 ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)' : 'transparent';
      step.style.transform = index === 0 ? 'translateX(10px)' : 'translateX(0)';
    });
  }

  setupChart() {
    const chartContainer = document.getElementById('scrolly-chart');
    if (!chartContainer) {
      console.warn('Scrolly chart container not found');
      return;
    }

    // Chart dimensions
    const containerRect = chartContainer.getBoundingClientRect();
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const width = Math.min(500, containerRect.width) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    this.chartDimensions = { width, height, margin };

    // Clear existing chart
    chartContainer.innerHTML = '';

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style('background', 'white')
      .style('border-radius', '8px')
      .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)');

    this.chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Setup scales
    this.xScale = d3.scaleLinear().range([0, width]);
    this.yScale = d3.scaleLinear().range([height, 0]);

    // Add axes groups
    this.xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'x-axis');

    this.yAxis = this.chart.append('g')
      .attr('class', 'y-axis');

    // Add axis labels
    svg.append('text')
      .attr('class', 'axis-label-x')
      .attr('text-anchor', 'middle')
      .attr('x', margin.left + width / 2)
      .attr('y', height + margin.top + 50)
      .text('Year')
      .style('font-size', '13px')
      .style('fill', '#6b7280')
      .style('font-weight', '500');

    svg.append('text')
      .attr('class', 'axis-label-y')
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(margin.top + height / 2))
      .attr('y', 20)
      .text('Number of Fines')
      .style('font-size', '13px')
      .style('fill', '#6b7280')
      .style('font-weight', '500');

    // Add title
    this.chartTitle = svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', margin.left + width / 2)
      .attr('y', 25)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#0f172a')
      .text('Road Safety Data: Challenging Assumptions');

    this.isInitialized = true;
    console.log('Chart initialized successfully');
  }

  setupIntersectionObserver() {
    if (!this.steps.length) return;

    const options = {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepIndex = this.steps.indexOf(entry.target);
          if (stepIndex !== -1 && stepIndex !== this.currentStep) {
            console.log(`Activating step ${stepIndex}`);
            this.activateStep(stepIndex);
          }
        }
      });
    }, options);

    this.steps.forEach(step => observer.observe(step));
    console.log('Intersection observer set up');
  }

  activateStep(stepIndex) {
    if (stepIndex === this.currentStep) return;

    // Update step visual states
    this.steps.forEach((step, index) => {
      const isActive = index === stepIndex;
      
      step.classList.toggle('active', isActive);
      step.style.transition = 'all 0.5s ease';
      step.style.opacity = isActive ? '1' : '0.3';
      step.style.borderLeftColor = isActive ? '#3b82f6' : 'transparent';
      step.style.background = isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)' : 'transparent';
      step.style.transform = isActive ? 'translateX(10px)' : 'translateX(0)';
    });

    this.currentStep = stepIndex;
    this.updateChart(stepIndex);
  }

  loadData() {
    // Generate comprehensive sample data
    this.data = this.generateStoryData();
    
    // Listen for real data if available
    if (window.roadSafetyData && window.roadSafetyData.processed) {
      this.data = this.processGlobalData(window.roadSafetyData.processed);
    }

    document.addEventListener('roadSafetyDataReady', (event) => {
      this.data = this.processGlobalData(event.detail.data.processed);
      this.updateChart(this.currentStep);
    });

    if (this.isInitialized) {
      setTimeout(() => this.updateChart(0), 500);
    }
  }

  generateStoryData() {
    const years = d3.range(2008, 2024);
    return {
      timeline: years.map(year => ({
        year,
        totalFines: this.calculateTotalFines(year),
        youngDrivers: this.calculateYoungDrivers(year),
        middleAged: this.calculateMiddleAged(year),
        technology: year >= 2019 ? this.calculateTechnologyImpact(year) : 0
      })),
      ageGroups: [
        { ageGroup: '17-25', fines: 298300, percentage: 21.0, expected: true },
        { ageGroup: '26-39', fines: 430000, percentage: 30.1, expected: false },
        { ageGroup: '40-64', fines: 604750, percentage: 42.4, expected: false },
        { ageGroup: '65+', fines: 145000, percentage: 10.2, expected: false }
      ],
      assumptions: [
        { ageGroup: '17-25', expected: 600000, actual: 298300 },
        { ageGroup: '26-39', expected: 400000, actual: 430000 },
        { ageGroup: '40-64', expected: 200000, actual: 604750 },
        { ageGroup: '65+', expected: 100000, actual: 145000 }
      ]
    };
  }

  calculateTotalFines(year) {
    const baseGrowth = 50000 + (year - 2008) * 15000;
    const technologyBoost = year >= 2019 ? (year - 2018) * 45000 : 0;
    const covidEffect = year === 2020 ? -30000 : 0;
    const peakEffect = year === 2021 ? 120000 : 0;
    
    return Math.floor(baseGrowth + technologyBoost + covidEffect + peakEffect + Math.random() * 10000);
  }

  calculateYoungDrivers(year) {
    return Math.floor(15000 + (year - 2008) * 3000 + Math.random() * 5000);
  }

  calculateMiddleAged(year) {
    const base = 25000 + (year - 2008) * 8000;
    const technologyImpact = year >= 2019 ? (year - 2018) * 15000 : 0;
    return Math.floor(base + technologyImpact + Math.random() * 8000);
  }

  calculateTechnologyImpact(year) {
    const base = (year - 2018) * 25000;
    const accelerator = year >= 2021 ? 50000 : 0;
    return Math.floor(base + accelerator);
  }

  processGlobalData(processedData) {
    if (!processedData || !processedData.byYear) {
      return this.generateStoryData();
    }

    const timelineData = processedData.byYear.map(d => ({
      year: d.year,
      totalFines: d.totalFines,
      youngDrivers: Math.floor(d.totalFines * 0.21),
      middleAged: Math.floor(d.totalFines * 0.42),
      technology: d.year >= 2019 ? Math.floor(d.totalFines * 0.3) : 0
    }));

    return {
      timeline: timelineData,
      ageGroups: processedData.byAgeGroup || this.generateStoryData().ageGroups,
      assumptions: this.generateStoryData().assumptions
    };
  }

  updateChart(stepIndex) {
    if (!this.chart || !this.data || !this.isInitialized) {
      console.log('Chart not ready for update');
      return;
    }

    console.log(`Updating chart for step ${stepIndex}`);

    // Clear previous chart content
    this.chart.selectAll('.chart-content').remove();
    this.chart.selectAll('.annotation').remove();
    this.chart.selectAll('.highlight').remove();

    // Update chart based on step
    switch (stepIndex) {
      case 0:
        this.showAssumptionStep();
        break;
      case 1:
        this.showRealityStep();
        break;
      case 2:
        this.showTechnologyStep();
        break;
      case 3:
        this.showImplicationsStep();
        break;
      default:
        this.showAssumptionStep();
    }
  }

  showAssumptionStep() {
    this.chartTitle.text('Common Assumption: Young Drivers Lead Violations');

    // Show assumption vs reality comparison
    const data = this.data.assumptions;
    const { width, height } = this.chartDimensions;

    // Set up scales for grouped bars
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.ageGroup))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.expected, d.actual))])
      .nice()
      .range([height, 0]);

    // Update axes
    this.xAxis.transition().duration(750)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    this.yAxis.transition().duration(750)
      .call(d3.axisLeft(yScale).tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
      .selectAll('text')
      .style('font-size', '12px');

    // Create content group
    const contentGroup = this.chart.append('g').attr('class', 'chart-content');

    // Add assumption bars (ghost/outline)
    const assumptionBars = contentGroup.selectAll('.assumption-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'assumption-bar')
      .attr('x', d => xScale(d.ageGroup) + 5)
      .attr('width', xScale.bandwidth() - 10)
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    // Animate assumption bars
    assumptionBars.transition()
      .duration(1000)
      .delay((d, i) => i * 200)
      .attr('y', d => yScale(d.expected))
      .attr('height', d => height - yScale(d.expected));

    // Add label for young drivers
    setTimeout(() => {
      contentGroup.append('text')
        .attr('class', 'annotation')
        .attr('x', xScale('17-25') + xScale.bandwidth() / 2)
        .attr('y', yScale(data.find(d => d.ageGroup === '17-25').expected) - 10)
        .attr('text-anchor', 'middle')
        .text('Expected: Highest')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('fill', '#ef4444')
        .style('opacity', 0)
        .transition()
        .duration(500)
        .style('opacity', 1);
    }, 1200);
  }

  showRealityStep() {
    this.chartTitle.text('Reality Check: The Surprising Truth');

    const data = this.data.ageGroups;
    const { width, height } = this.chartDimensions;

    // Set up scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.ageGroup))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.fines)])
      .nice()
      .range([height, 0]);

    // Update axes
    this.xAxis.transition().duration(750)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    this.yAxis.transition().duration(750)
      .call(d3.axisLeft(yScale).tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
      .selectAll('text')
      .style('font-size', '12px');

    // Create content group
    const contentGroup = this.chart.append('g').attr('class', 'chart-content');

    // Add reality bars
    const realityBars = contentGroup.selectAll('.reality-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'reality-bar')
      .attr('x', d => xScale(d.ageGroup))
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => d.ageGroup === '40-64' ? '#f59e0b' : '#3b82f6')
      .attr('stroke', d => d.ageGroup === '40-64' ? '#d97706' : '#1e40af')
      .attr('stroke-width', 2);

    // Animate reality bars
    realityBars.transition()
      .duration(1500)
      .delay((d, i) => i * 300)
      .attr('y', d => yScale(d.fines))
      .attr('height', d => height - yScale(d.fines));

    // Highlight the winner
    setTimeout(() => {
      const winner = data.find(d => d.ageGroup === '40-64');
      
      contentGroup.append('text')
        .attr('class', 'annotation')
        .attr('x', xScale(winner.ageGroup) + xScale.bandwidth() / 2)
        .attr('y', yScale(winner.fines) - 40)
        .attr('text-anchor', 'middle')
        .text('ACTUAL HIGHEST!')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .style('fill', '#f59e0b')
        .style('opacity', 0)
        .transition()
        .duration(500)
        .style('opacity', 1);

      contentGroup.append('text')
        .attr('class', 'annotation')
        .attr('x', xScale(winner.ageGroup) + xScale.bandwidth() / 2)
        .attr('y', yScale(winner.fines) - 20)
        .attr('text-anchor', 'middle')
        .text(`${winner.percentage}% of all fines`)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('fill', '#f59e0b')
        .style('opacity', 0)
        .transition()
        .delay(300)
        .duration(500)
        .style('opacity', 1);
    }, 2000);
  }

  showTechnologyStep() {
    this.chartTitle.text('The Technology Factor: 2019-2021 Transformation');

    const timelineData = this.data.timeline;
    const { width, height } = this.chartDimensions;

    // Set up scales
    this.xScale.domain(d3.extent(timelineData, d => d.year));
    this.yScale.domain([0, d3.max(timelineData, d => d.totalFines)]).nice();

    // Update axes
    this.xAxis.transition().duration(750)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('font-size', '12px');

    this.yAxis.transition().duration(750)
      .call(d3.axisLeft(this.yScale).tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
      .selectAll('text')
      .style('font-size', '12px');

    // Create content group
    const contentGroup = this.chart.append('g').attr('class', 'chart-content');

    // Add baseline trend line
    const baseLine = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    const path = contentGroup.append('path')
      .datum(timelineData)
      .attr('class', 'trend-line')
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', baseLine);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0);

    // Add technology impact area
    setTimeout(() => {
      const techData = timelineData.filter(d => d.year >= 2019);
      
      const area = d3.area()
        .x(d => this.xScale(d.year))
        .y0(d => this.yScale(d.totalFines - d.technology))
        .y1(d => this.yScale(d.totalFines))
        .curve(d3.curveMonotoneX);

      contentGroup.append('path')
        .datum(techData)
        .attr('class', 'tech-area')
        .attr('fill', '#10b981')
        .attr('fill-opacity', 0.6)
        .attr('d', area)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);

      // Add 2021 spike highlight
      const spike2021 = timelineData.find(d => d.year === 2021);
      contentGroup.append('circle')
        .attr('class', 'highlight')
        .attr('cx', this.xScale(2021))
        .attr('cy', this.yScale(spike2021.totalFines))
        .attr('r', 0)
        .attr('fill', '#f59e0b')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .transition()
        .duration(500)
        .attr('r', 8);

      // Add annotation
      contentGroup.append('text')
        .attr('class', 'annotation')
        .attr('x', this.xScale(2021))
        .attr('y', this.yScale(spike2021.totalFines) - 20)
        .attr('text-anchor', 'middle')
        .text('2021: +37% spike')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('fill', '#f59e0b')
        .style('opacity', 0)
        .transition()
        .delay(500)
        .duration(500)
        .style('opacity', 1);
    }, 2200);
  }

  showImplicationsStep() {
    this.chartTitle.text('Implications: Rethinking Road Safety Assumptions');

    const comparisonData = [
      { category: 'Assumption', young: 60, middleAged: 20 },
      { category: 'Reality', young: 21, middleAged: 42.4 }
    ];

    const { width, height } = this.chartDimensions;

    // Set up scales
    const xScale = d3.scaleBand()
      .domain(comparisonData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, 70])
      .range([height, 0]);

    // Update axes
    this.xAxis.transition().duration(750)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    this.yAxis.transition().duration(750)
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');

    // Create content group
    const contentGroup = this.chart.append('g').attr('class', 'chart-content');

    const barWidth = xScale.bandwidth() / 2 - 5;

    // Add young driver bars
    comparisonData.forEach((d, i) => {
      contentGroup.append('rect')
        .attr('x', xScale(d.category))
        .attr('y', height)
        .attr('width', barWidth)
        .attr('height', 0)
        .attr('fill', '#ef4444')
        .attr('opacity', 0.8)
        .transition()
        .delay(i * 400)
        .duration(600)
        .attr('y', yScale(d.young))
        .attr('height', height - yScale(d.young));

      // Add middle-aged bars
      contentGroup.append('rect')
        .attr('x', xScale(d.category) + barWidth + 5)
        .attr('y', height)
        .attr('width', barWidth)
        .attr('height', 0)
        .attr('fill', '#f59e0b')
        .attr('opacity', 0.8)
        .transition()
        .delay(i * 400 + 200)
        .duration(600)
        .attr('y', yScale(d.middleAged))
        .attr('height', height - yScale(d.middleAged));
    });

    // Add legend
    setTimeout(() => {
      const legend = contentGroup.append('g')
        .attr('class', 'annotation')
        .attr('transform', `translate(${width - 140}, 20)`);

      legend.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '#ef4444');

      legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text('Young (17-25)')
        .style('font-size', '11px');

      legend.append('rect')
        .attr('y', 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '#f59e0b');

      legend.append('text')
        .attr('x', 20)
        .attr('y', 32)
        .text('Middle-aged (40-64)')
        .style('font-size', '11px');
    }, 1500);
  }

  // Utility methods
  jumpToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  getCurrentStepData() {
    return {
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      stepElement: this.steps[this.currentStep]
    };
  }
}

// Replace the global scrollytelling instance
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.scrollytelling-container')) {
    // Remove old instance if exists
    if (window.scrollytelling) {
      window.scrollytelling = null;
    }
    
    // Create new fixed instance
    window.scrollytelling = new FixedScrollytelling();
    console.log('Fixed scrollytelling initialized');
  }
});

// Export for external use
window.FixedScrollytelling = FixedScrollytelling;