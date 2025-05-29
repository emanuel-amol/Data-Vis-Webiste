// js/storytelling/data-story-narrative.js - Create this new file

class DataStoryNarrative {
  constructor() {
    this.currentChapter = 0;
    this.chapters = [];
    this.charts = {};
    this.data = null;
    this.scrollProgress = 0;
    
    this.init();
  }

  init() {
    this.setupChapters();
    this.setupProgressBar();
    this.setupScrollTracking();
    this.setupChartContainers();
    this.loadData();
    this.setupInteractions();
  }

  setupChapters() {
    this.chapters = Array.from(document.querySelectorAll('.story-chapter'));
    
    if (this.chapters.length === 0) {
      console.log('No story chapters found');
      return;
    }

    // Setup intersection observer for chapters
    const options = {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const chapterIndex = this.chapters.indexOf(entry.target);
          if (chapterIndex !== -1) {
            this.activateChapter(chapterIndex);
          }
        }
      });
    }, options);

    this.chapters.forEach(chapter => observer.observe(chapter));
  }

  setupProgressBar() {
    const progressFill = document.getElementById('progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    if (!progressFill || !progressSteps.length) return;

    // Add click handlers to progress steps
    progressSteps.forEach((step, index) => {
      step.addEventListener('click', () => {
        this.jumpToChapter(index);
      });
    });
  }

  setupScrollTracking() {
    let ticking = false;

    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = scrollTop / docHeight;
      
      this.updateProgressBar();
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    });
  }

  updateProgressBar() {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.width = `${this.scrollProgress * 100}%`;
    }
  }

  activateChapter(chapterIndex) {
    if (chapterIndex === this.currentChapter) return;

    // Update progress steps
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
      step.classList.toggle('active', index === chapterIndex);
    });

    this.currentChapter = chapterIndex;
    this.updateChapterVisualization(chapterIndex);
  }

  jumpToChapter(chapterIndex) {
    if (chapterIndex >= 0 && chapterIndex < this.chapters.length) {
      this.chapters[chapterIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  setupChartContainers() {
    const chartIds = [
      'intro-chart',
      'revelation-chart', 
      'investigation-chart',
      'geography-chart'
    ];

    chartIds.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        this.initializeChart(id, container);
      }
    });
  }

  initializeChart(chartId, container) {
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear existing content
    container.innerHTML = '';

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style('background', '#fafafa');

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Store chart components
    this.charts[chartId] = {
      svg,
      chartGroup,
      width,
      height,
      margin,
      xScale: d3.scaleLinear().range([0, width]),
      yScale: d3.scaleLinear().range([height, 0])
    };

    // Add axes groups
    this.charts[chartId].xAxis = chartGroup.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'x-axis');

    this.charts[chartId].yAxis = chartGroup.append('g')
      .attr('class', 'y-axis');
  }

  loadData() {
    // Generate sample data for the narrative
    this.data = this.generateNarrativeData();
    
    // Use global data if available
    if (window.roadSafetyData && window.roadSafetyData.processed) {
      this.data = this.processGlobalData(window.roadSafetyData.processed);
    }

    // Listen for real data
    document.addEventListener('roadSafetyDataReady', (event) => {
      this.data = this.processGlobalData(event.detail.data.processed);
      this.updateAllCharts();
    });

    // Initialize first chart
    this.updateChapterVisualization(0);
  }

  generateNarrativeData() {
    const years = d3.range(2008, 2024);
    
    return {
      timeline: years.map(year => ({
        year,
        totalFines: Math.floor(50000 + (year - 2008) * 15000 * (1 + Math.sin((year - 2008) * 0.3))),
        youngDrivers: Math.floor(15000 + (year - 2008) * 2000 + Math.random() * 3000),
        middleAged: Math.floor(25000 + (year - 2008) * 8000 + Math.random() * 5000),
        seniors: Math.floor(8000 + (year - 2008) * 1000 + Math.random() * 2000)
      })),
      ageGroups: [
        { ageGroup: '0-16', fines: 5000, percentage: 0.4 },
        { ageGroup: '17-25', fines: 298300, percentage: 21.0 },
        { ageGroup: '26-39', fines: 430000, percentage: 30.1 },
        { ageGroup: '40-64', fines: 604750, percentage: 42.4 },
        { ageGroup: '65+', fines: 145000, percentage: 10.2 }
      ],
      jurisdictions: [
        { jurisdiction: 'NSW', fines: 850000, increase2021: 132 },
        { jurisdiction: 'VIC', fines: 720000, increase2021: 45 },
        { jurisdiction: 'QLD', fines: 480000, increase2021: 28 },
        { jurisdiction: 'SA', fines: 220000, increase2021: 15 },
        { jurisdiction: 'WA', fines: 280000, increase2021: 22 },
        { jurisdiction: 'TAS', fines: 65000, increase2021: 8 },
        { jurisdiction: 'NT', fines: 35000, increase2021: 12 },
        { jurisdiction: 'ACT', fines: 45000, increase2021: 18 }
      ]
    };
  }

  processGlobalData(processedData) {
    if (!processedData) return this.generateNarrativeData();

    return {
      timeline: processedData.byYear || [],
      ageGroups: processedData.byAgeGroup || [],
      jurisdictions: processedData.byJurisdiction || []
    };
  }

  updateChapterVisualization(chapterIndex) {
    switch (chapterIndex) {
      case 0: // Introduction
        this.renderAssumptionChart();
        break;
      case 1: // Revelation
        this.renderRevelationChart();
        this.animateRevelationStats();
        break;
      case 2: // Investigation
        this.renderInvestigationChart();
        break;
      case 3: // Geography
        this.renderGeographyChart();
        break;
      default:
        break;
    }
  }

  renderAssumptionChart() {
    const chart = this.charts['intro-chart'];
    if (!chart) return;

    chart.chartGroup.selectAll('*').remove();

    // Create hypothetical data showing expected young driver dominance
    const assumptionData = [
      { ageGroup: '17-25', fines: 600000, color: '#ef4444', expected: true },
      { ageGroup: '26-39', fines: 400000, color: '#f59e0b', expected: false },
      { ageGroup: '40-64', fines: 300000, color: '#6b7280', expected: false },
      { ageGroup: '65+', fines: 100000, color: '#9ca3af', expected: false }
    ];

    // Setup scales
    chart.xScale.domain(assumptionData.map(d => d.ageGroup));
    chart.yScale.domain([0, d3.max(assumptionData, d => d.fines) * 1.1]);

    // Convert to band scale for bars
    const xBandScale = d3.scaleBand()
      .domain(assumptionData.map(d => d.ageGroup))
      .range([0, chart.width])
      .padding(0.2);

    // Add axes
    chart.xAxis.call(d3.axisBottom(xBandScale));
    chart.yAxis.call(d3.axisLeft(chart.yScale).tickFormat(d3.format(',.0f')));

    // Add bars with animation
    const bars = chart.chartGroup.selectAll('.assumption-bar')
      .data(assumptionData)
      .enter()
      .append('rect')
      .attr('class', 'assumption-bar')
      .attr('x', d => xBandScale(d.ageGroup))
      .attr('width', xBandScale.bandwidth())
      .attr('y', chart.height)
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('opacity', 0.7);

    // Animate bars
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 200)
      .attr('y', d => chart.yScale(d.fines))
      .attr('height', d => chart.height - chart.yScale(d.fines));

    // Add "Expected" label
    chart.chartGroup.append('text')
      .attr('class', 'assumption-label')
      .attr('x', xBandScale('17-25') + xBandScale.bandwidth() / 2)
      .attr('y', chart.yScale(600000) - 20)
      .attr('text-anchor', 'middle')
      .text('Expected: Highest')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .style('opacity', 0)
      .transition()
      .delay(1200)
      .duration(500)
      .style('opacity', 1);

    // Add chart title
    chart.svg.append('text')
      .attr('x', chart.width / 2 + chart.margin.left)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('Common Assumption: Young Drivers Lead in Violations')
      .style('font-size', '16px')
      .style('font-weight', 'bold');
  }

  renderRevelationChart() {
    const chart = this.charts['revelation-chart'];
    if (!chart) return;

    chart.chartGroup.selectAll('*').remove();

    const realData = this.data.ageGroups;

    // Setup scales
    const xBandScale = d3.scaleBand()
      .domain(realData.map(d => d.ageGroup))
      .range([0, chart.width])
      .padding(0.2);

    chart.yScale.domain([0, d3.max(realData, d => d.fines) * 1.1]);

    // Add axes
    chart.xAxis.call(d3.axisBottom(xBandScale));
    chart.yAxis.call(d3.axisLeft(chart.yScale).tickFormat(d3.format(',.0f')));

    // Add bars
    const bars = chart.chartGroup.selectAll('.reality-bar')
      .data(realData)
      .enter()
      .append('rect')
      .attr('class', 'reality-bar')
      .attr('x', d => xBandScale(d.ageGroup))
      .attr('width', xBandScale.bandwidth())
      .attr('y', chart.height)
      .attr('height', 0)
      .attr('fill', d => d.ageGroup === '40-64' ? '#f59e0b' : '#3b82f6')
      .attr('stroke', d => d.ageGroup === '40-64' ? '#d97706' : '#1e40af')
      .attr('stroke-width', 2);

    // Animate bars
    bars.transition()
      .duration(1500)
      .delay((d, i) => i * 300)
      .attr('y', d => chart.yScale(d.fines))
      .attr('height', d => chart.height - chart.yScale(d.fines));

    // Highlight the surprising winner
    const winner = realData.find(d => d.ageGroup === '40-64');
    if (winner) {
      chart.chartGroup.append('text')
        .attr('x', xBandScale(winner.ageGroup) + xBandScale.bandwidth() / 2)
        .attr('y', chart.yScale(winner.fines) - 30)
        .attr('text-anchor', 'middle')
        .text('HIGHEST!')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .style('fill', '#f59e0b')
        .style('opacity', 0)
        .transition()
        .delay(2000)
        .duration(500)
        .style('opacity', 1);

      // Add percentage
      chart.chartGroup.append('text')
        .attr('x', xBandScale(winner.ageGroup) + xBandScale.bandwidth() / 2)
        .attr('y', chart.yScale(winner.fines) - 10)
        .attr('text-anchor', 'middle')
        .text(`${winner.percentage}% of all fines`)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('fill', '#f59e0b')
        .style('opacity', 0)
        .transition()
        .delay(2200)
        .duration(500)
        .style('opacity', 1);
    }

    // Add chart title
    chart.svg.append('text')
      .attr('x', chart.width / 2 + chart.margin.left)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('Reality: Age Distribution of Road Safety Fines')
      .style('font-size', '16px')
      .style('font-weight', 'bold');
  }

  renderInvestigationChart() {
    const chart = this.charts['investigation-chart'];
    if (!chart) return;

    chart.chartGroup.selectAll('*').remove();

    const timelineData = this.data.timeline;

    // Setup scales
    chart.xScale.domain(d3.extent(timelineData, d => d.year));
    chart.yScale.domain([0, d3.max(timelineData, d => d.totalFines) * 1.1]);

    // Add axes
    chart.xAxis.call(d3.axisBottom(chart.xScale).tickFormat(d3.format('d')));
    chart.yAxis.call(d3.axisLeft(chart.yScale).tickFormat(d3.format(',.0f')));

    // Add area chart
    const area = d3.area()
      .x(d => chart.xScale(d.year))
      .y0(chart.height)
      .y1(d => chart.yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    chart.chartGroup.append('path')
      .datum(timelineData)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.3)
      .attr('d', area)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    // Add line
    const line = d3.line()
      .x(d => chart.xScale(d.year))
      .y(d => chart.yScale(d.totalFines))
      .curve(d3.curveMonotoneX);

    const path = chart.chartGroup.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0);

    // Highlight 2021 spike
    const spike2021 = timelineData.find(d => d.year === 2021);
    if (spike2021) {
      chart.chartGroup.append('circle')
        .attr('cx', chart.xScale(2021))
        .attr('cy', chart.yScale(spike2021.totalFines))
        .attr('r', 0)
        .attr('fill', '#f59e0b')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .transition()
        .delay(1500)
        .duration(500)
        .attr('r', 8);

      // Add spike annotation
      chart.chartGroup.append('line')
        .attr('x1', chart.xScale(2021))
        .attr('x2', chart.xScale(2021))
        .attr('y1', chart.yScale(spike2021.totalFines))
        .attr('y2', chart.yScale(spike2021.totalFines) - 60)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3')
        .style('opacity', 0)
        .transition()
        .delay(2000)
        .duration(500)
        .style('opacity', 1);

      chart.chartGroup.append('text')
        .attr('x', chart.xScale(2021))
        .attr('y', chart.yScale(spike2021.totalFines) - 70)
        .attr('text-anchor', 'middle')
        .text('2021 Spike: +37%')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('fill', '#f59e0b')
        .style('opacity', 0)
        .transition()
        .delay(2200)
        .duration(500)
        .style('opacity', 1);
    }

    // Add chart title
    chart.svg.append('text')
      .attr('x', chart.width / 2 + chart.margin.left)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('Timeline: The Technology Effect (2008-2023)')
      .style('font-size', '16px')
      .style('font-weight', 'bold');
  }

  renderGeographyChart() {
    const chart = this.charts['geography-chart'];
    if (!chart) return;

    chart.chartGroup.selectAll('*').remove();

    const jurisdictionData = this.data.jurisdictions
      .sort((a, b) => b.fines - a.fines)
      .slice(0, 6); // Top 6 jurisdictions

    // Setup scales
    const xBandScale = d3.scaleBand()
      .domain(jurisdictionData.map(d => d.jurisdiction))
      .range([0, chart.width])
      .padding(0.3);

    chart.yScale.domain([0, d3.max(jurisdictionData, d => d.fines) * 1.1]);

    // Add axes
    chart.xAxis.call(d3.axisBottom(xBandScale));
    chart.yAxis.call(d3.axisLeft(chart.yScale).tickFormat(d3.format(',.0f')));

    // Add bars
    const bars = chart.chartGroup.selectAll('.geo-bar')
      .data(jurisdictionData)
      .enter()
      .append('rect')
      .attr('class', 'geo-bar')
      .attr('x', d => xBandScale(d.jurisdiction))
      .attr('width', xBandScale.bandwidth())
      .attr('y', chart.height)
      .attr('height', 0)
      .attr('fill', d => {
        if (d.jurisdiction === 'NSW') return '#f59e0b';
        if (d.jurisdiction === 'VIC') return '#3b82f6';
        return '#6b7280';
      });

    // Animate bars
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 200)
      .attr('y', d => chart.yScale(d.fines))
      .attr('height', d => chart.height - chart.yScale(d.fines));

    // Add 2021 increase indicators
    jurisdictionData.forEach((d, i) => {
      if (d.increase2021 > 20) {
        chart.chartGroup.append('text')
          .attr('x', xBandScale(d.jurisdiction) + xBandScale.bandwidth() / 2)
          .attr('y', chart.yScale(d.fines) - 10)
          .attr('text-anchor', 'middle')
          .text(`+${d.increase2021}%`)
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .style('fill', '#ef4444')
          .style('opacity', 0)
          .transition()
          .delay(1500 + i * 100)
          .duration(500)
          .style('opacity', 1);
      }
    });

    // Add chart title
    chart.svg.append('text')
      .attr('x', chart.width / 2 + chart.margin.left)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('Geographic Patterns: Jurisdictional Differences')
      .style('font-size', '16px')
      .style('font-weight', 'bold');
  }

  animateRevelationStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    statNumbers.forEach((element, index) => {
      const target = parseInt(element.dataset.target);
      
      setTimeout(() => {
        this.animateCounter(element, target, 2000);
      }, index * 500);
    });
  }

  animateCounter(element, target, duration) {
    const start = 0;
    const range = target - start;
    const startTime = performance.now();
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(start + range * easeOutQuart);
      
      element.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
        element.style.textShadow = '0 0 10px rgba(245, 158, 11, 0.6)';
      }
    };
    
    requestAnimationFrame(updateCounter);
  }

  setupInteractions() {
    // Factor card interactions
    const factorCards = document.querySelectorAll('.factor-card');
    factorCards.forEach(card => {
      card.addEventListener('click', () => {
        factorCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        // Could trigger specific chart updates based on factor
        const factor = card.dataset.factor;
        this.highlightFactor(factor);
      });
    });

    // Progress step clicks
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
      step.addEventListener('click', () => {
        this.jumpToChapter(index);
      });
    });
  }

  highlightFactor(factor) {
    // This could update charts to highlight specific aspects
    console.log(`Highlighting factor: ${factor}`);
  }

  updateAllCharts() {
    this.updateChapterVisualization(this.currentChapter);
  }

  // Method to export story data for other components
  getStoryData() {
    return {
      currentChapter: this.currentChapter,
      totalChapters: this.chapters.length,
      scrollProgress: this.scrollProgress,
      data: this.data
    };
  }
}

// CSS for narrative elements
const narrativeStyles = document.createElement('style');
narrativeStyles.textContent = `
  .story-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .progress-bar {
    height: 4px;
    background: #e5e7eb;
    margin-bottom: 10px;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #f59e0b);
    width: 0%;
    transition: width 0.3s ease;
  }

  .progress-steps {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
  }

  .progress-step {
    font-size: 0.9rem;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.3s ease;
    position: relative;
  }

  .progress-step.active {
    color: #3b82f6;
    font-weight: 600;
  }

  .progress-step::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: #3b82f6;
    transition: width 0.3s ease;
  }

  .progress-step.active::after {
    width: 100%;
  }

  .story-chapter {
    min-height: 100vh;
    padding: 120px 0 80px 0;
    scroll-margin-top: 80px;
  }

  .narrative-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: start;
  }

  .chapter-header {
    grid-column: 1 / -1;
    text-align: center;
    margin-bottom: 40px;
  }

  .chapter-number {
    display: block;
    font-size: 1rem;
    color: #3b82f6;
    font-weight: 600;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .chapter-header h2 {
    font-size: 2.5rem;
    color: #0C1A3C;
    margin: 0;
  }

  .narrative-content {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #374151;
  }

  .lead-paragraph {
    font-size: 1.3rem;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 30px;
  }

  .reveal-text {
    font-size: 2rem;
    font-weight: 700;
    color: #f59e0b;
    text-align: center;
    margin: 40px 0;
    padding: 30px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 15px;
    border-left: 5px solid #f59e0b;
  }

  .data-callout {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    margin: 30px 0;
    border-left: 5px solid #3b82f6;
  }

  .callout-stat {
    font-size: 3rem;
    font-weight: 900;
    color: #1e40af;
    margin-bottom: 10px;
  }

  .callout-text {
    font-size: 1.1rem;
    color: #1e40af;
    font-weight: 600;
  }

  .revelation-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 30px;
    margin: 40px 0;
  }

  .revelation-stat-item {
    background: white;
    padding: 30px 20px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    border-top: 4px solid #f59e0b;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: 900;
    color: #f59e0b;
    margin-bottom: 10px;
    display: block;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 5px;
  }

  .stat-percentage {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
  }

  .myth-buster {
    background: #fee2e2;
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 25px;
    margin: 40px 0;
  }

  .myth-buster h4:first-child {
    color: #dc2626;
    text-decoration: line-through;
    margin-bottom: 15px;
  }

  .myth-buster h4:last-child {
    color: #16a34a;
    font-weight: 700;
  }

  .investigation-factors {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin: 40px 0;
  }

  .factor-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .factor-card:hover, .factor-card.active {
    border-color: #3b82f6;
    background: #f8fafc;
    transform: translateY(-2px);
  }

  .factor-icon {
    font-size: 2rem;
    margin-bottom: 15px;
  }

  .factor-card h4 {
    color: #0C1A3C;
    margin-bottom: 10px;
  }

  .factor-detail {
    margin-top: 15px;
    padding: 10px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 6px;
    font-size: 0.9rem;
    color: #1e40af;
  }

  .chapter-visualization {
    background: white;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    position: sticky;
    top: 120px;
  }

  .narrative-chart {
    width: 100%;
    min-height: 400px;
  }

  .chart-caption {
    text-align: center;
    font-size: 0.9rem;
    color: #6b7280;
    margin-top: 15px;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .narrative-container {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 0 20px;
    }
    
    .chapter-header h2 {
      font-size: 2rem;
    }
    
    .reveal-text {
      font-size: 1.5rem;
    }
    
    .chapter-visualization {
      position: static;
    }
    
    .progress-steps {
      gap: 15px;
    }
    
    .progress-step {
      font-size: 0.8rem;
    }
  }
`;
document.head.appendChild(narrativeStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.story-chapter')) {
    window.dataStoryNarrative = new DataStoryNarrative();
  }
});

// Export for external use
window.DataStoryNarrative = DataStoryNarrative;