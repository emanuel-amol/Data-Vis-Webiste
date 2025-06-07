// js/storytelling/data-story-narrative.js - Fixed version

class DataStoryNarrative {
  constructor() {
    this.currentChapter = 0;
    this.chapters = [];
    this.charts = {};
    this.data = null;
    this.scrollProgress = 0;
    this.isDataLoaded = false;
    
    this.init();
  }

  init() {
    console.log("Initializing Data Story Narrative...");
    this.setupChapters();
    this.setupProgressBar();
    this.setupScrollTracking();
    this.setupChartContainers();
    this.setupInteractions();
    this.loadData();
  }

  setupChapters() {
    this.chapters = Array.from(document.querySelectorAll('.story-chapter'));
    
    if (this.chapters.length === 0) {
      console.log('No story chapters found');
      return;
    }

    console.log(`Found ${this.chapters.length} story chapters`);

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
    
    if (!progressFill || !progressSteps.length) {
      console.log('Progress bar elements not found');
      return;
    }

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
      this.scrollProgress = Math.max(0, Math.min(1, scrollTop / docHeight));
      
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

    console.log(`Activating chapter ${chapterIndex}`);

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
        console.log(`Initializing chart container: ${id}`);
        this.initializeChart(id, container);
      } else {
        console.warn(`Chart container not found: ${id}`);
      }
    });
  }

  initializeChart(chartId, container) {
    const containerRect = container.getBoundingClientRect();
    const containerWidth = Math.max(500, containerRect.width || 600);
    
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear existing content
    container.innerHTML = '';

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style('background', '#fafafa')
      .style('border-radius', '8px');

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
      yScale: d3.scaleLinear().range([height, 0]),
      container
    };

    // Add axes groups
    this.charts[chartId].xAxis = chartGroup.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'x-axis');

    this.charts[chartId].yAxis = chartGroup.append('g')
      .attr('class', 'y-axis');

    console.log(`Chart ${chartId} initialized with dimensions: ${width}x${height}`);
  }

  loadData() {
    // Check if global data is already available
    if (window.roadSafetyData && window.roadSafetyData.processed) {
      console.log("Using existing global data");
      this.data = this.processGlobalData(window.roadSafetyData.processed);
      this.isDataLoaded = true;
      this.updateAllCharts();
      return;
    }

    // Generate sample data immediately for display
    console.log("Generating sample data for immediate display");
    this.data = this.generateNarrativeData();
    this.isDataLoaded = true;
    this.updateAllCharts();

    // Listen for real data
    document.addEventListener('roadSafetyDataReady', (event) => {
      console.log("Real data received, updating charts");
      this.data = this.processGlobalData(event.detail.data.processed);
      this.updateAllCharts();
    });
  }

  generateNarrativeData() {
    const years = d3.range(2008, 2024);
    
    return {
      timeline: years.map(year => ({
        year,
        totalFines: Math.floor(180000 + (year - 2008) * 12000 + 
          (year === 2021 ? 60000 : 0) + // 2021 spike
          (year === 2020 ? -30000 : 0) + // 2020 dip
          Math.random() * 20000),
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
        { jurisdiction: 'TAS', fines: 65000, increase2021: 8 }
      ]
    };
  }

  processGlobalData(processedData) {
    if (!processedData) return this.generateNarrativeData();

    try {
      // Process age groups data
      const ageGroups = (processedData.byAgeGroup || []).map(d => ({
        ageGroup: d.ageGroup,
        fines: d.totalFines || 0,
        percentage: 0 // Will calculate later
      }));

      // Calculate percentages
      const totalFines = ageGroups.reduce((sum, d) => sum + d.fines, 0);
      ageGroups.forEach(d => {
        d.percentage = totalFines > 0 ? (d.fines / totalFines * 100) : 0;
      });

      // Process timeline data
      const timeline = (processedData.byYear || []).map(d => ({
        year: d.year,
        totalFines: d.totalFines || 0
      }));

      // Process jurisdiction data
      const jurisdictions = (processedData.byJurisdiction || []).map(d => ({
        jurisdiction: d.jurisdiction,
        fines: d.totalFines || 0,
        increase2021: Math.floor(Math.random() * 50 + 10) // Simulated for now
      }));

      return {
        timeline,
        ageGroups,
        jurisdictions
      };
    } catch (error) {
      console.error("Error processing global data:", error);
      return this.generateNarrativeData();
    }
  }

  updateChapterVisualization(chapterIndex) {
    if (!this.isDataLoaded || !this.data) {
      console.log("Data not loaded yet, skipping visualization update");
      return;
    }

    console.log(`Updating visualization for chapter ${chapterIndex}`);

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
        console.log(`No visualization for chapter ${chapterIndex}`);
        break;
    }
  }

  renderAssumptionChart() {
    const chart = this.charts['intro-chart'];
    if (!chart) {
      console.warn("Intro chart not found");
      return;
    }

    console.log("Rendering assumption chart");
    chart.chartGroup.selectAll('*').remove();

    // Create hypothetical data showing expected young driver dominance
    const assumptionData = [
      { ageGroup: '17-25', fines: 600000, color: '#ef4444', expected: true },
      { ageGroup: '26-39', fines: 400000, color: '#f59e0b', expected: false },
      { ageGroup: '40-64', fines: 300000, color: '#6b7280', expected: false },
      { ageGroup: '65+', fines: 100000, color: '#9ca3af', expected: false }
    ];

    // Convert to band scale for bars
    const xBandScale = d3.scaleBand()
      .domain(assumptionData.map(d => d.ageGroup))
      .range([0, chart.width])
      .padding(0.2);

    chart.yScale.domain([0, d3.max(assumptionData, d => d.fines) * 1.1]);

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
      .attr('opacity', 0.7)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1);

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
      .style('font-size', '12px')
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
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#374151');
  }

  renderRevelationChart() {
    const chart = this.charts['revelation-chart'];
    if (!chart || !this.data.ageGroups) {
      console.warn("Revelation chart or age groups data not found");
      return;
    }

    console.log("Rendering revelation chart");
    chart.chartGroup.selectAll('*').remove();

    const realData = this.data.ageGroups.filter(d => d.fines > 0);

    // Convert to band scale for bars
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
        .attr('y', chart.yScale(winner.fines) - 40)
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
        .attr('y', chart.yScale(winner.fines) - 20)
        .attr('text-anchor', 'middle')
        .text(`${winner.percentage.toFixed(1)}% of all fines`)
        .style('font-weight', 'bold')
        .style('font-size', '11px')
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
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#374151');
  }

  renderInvestigationChart() {
    const chart = this.charts['investigation-chart'];
    if (!chart || !this.data.timeline) {
      console.warn("Investigation chart or timeline data not found");
      return;
    }

    console.log("Rendering investigation chart");
    chart.chartGroup.selectAll('*').remove();

    const timelineData = this.data.timeline.filter(d => d.totalFines > 0);

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

    // Highlight 2021 spike if present
    const spike2021 = timelineData.find(d => d.year === 2021);
    if (spike2021 && chart.xScale(2021) >= 0 && chart.xScale(2021) <= chart.width) {
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
        .text('2021 Spike')
        .style('font-weight', 'bold')
        .style('font-size', '11px')
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
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#374151');
  }

  renderGeographyChart() {
    const chart = this.charts['geography-chart'];
    if (!chart || !this.data.jurisdictions) {
      console.warn("Geography chart or jurisdictions data not found");
      return;
    }

    console.log("Rendering geography chart");
    chart.chartGroup.selectAll('*').remove();

    const jurisdictionData = this.data.jurisdictions
      .filter(d => d.fines > 0)
      .sort((a, b) => b.fines - a.fines)
      .slice(0, 6); // Top 6 jurisdictions

    // Convert to band scale for bars
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

    // Add chart title
    chart.svg.append('text')
      .attr('x', chart.width / 2 + chart.margin.left)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('Geographic Patterns: Jurisdictional Differences')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#374151');
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
  }

  highlightFactor(factor) {
    console.log(`Highlighting factor: ${factor}`);
    // This could update charts to highlight specific aspects
  }

  updateAllCharts() {
    if (!this.isDataLoaded) {
      console.log("Data not loaded, cannot update charts");
      return;
    }
    
    console.log("Updating all charts");
    this.updateChapterVisualization(this.currentChapter);
  }

  // Method to export story data for other components
  getStoryData() {
    return {
      currentChapter: this.currentChapter,
      totalChapters: this.chapters.length,
      scrollProgress: this.scrollProgress,
      data: this.data,
      isDataLoaded: this.isDataLoaded
    };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM ready, checking for story chapters...");
  if (document.querySelector('.story-chapter')) {
    console.log("Story chapters found, initializing narrative...");
    window.dataStoryNarrative = new DataStoryNarrative();
  } else {
    console.log("No story chapters found on this page");
  }
});

// Export for external use
window.DataStoryNarrative = DataStoryNarrative;