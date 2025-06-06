// js/insights/d3-responsive-dashboard-controller.js
// Enhanced dashboard controller that coordinates all D3.js components

class ResponsiveD3DashboardController {
  constructor() {
    this.components = {
      dataLoader: null,
      mapVisualization: null,
      charts: null
    };
    
    this.currentFilters = {
      jurisdiction: 'all',
      year: 'all',
      metric: 'totalFines',
      ageGroup: 'all'
    };
    
    this.isInitialized = false;
    this.animationQueue = [];
    this.updateTimeout = null;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('Initializing Responsive D3 Dashboard Controller...');
    
    try {
      await this.initializeComponents();
      this.setupEventListeners();
      this.setupFilterControls();
      this.setupInteractions();
      
      this.isInitialized = true;
      console.log('Responsive D3 Dashboard Controller ready');
      
      // Trigger initial animations
      this.scheduleInitialAnimations();
      
    } catch (error) {
      console.error('Failed to initialize dashboard controller:', error);
    }
  }

  async initializeComponents() {
    // Wait for all components to be available
    await this.waitForComponents();
    
    // Get references to all components
    this.components.dataLoader = window.enhancedD3DataLoader;
    this.components.mapVisualization = window.responsiveD3Map;
    this.components.charts = window.responsiveD3Charts;
    
    console.log('All D3 components connected');
  }

  waitForComponents() {
    return new Promise((resolve) => {
      const checkComponents = () => {
        if (window.enhancedD3DataLoader && 
            window.responsiveD3Map && 
            window.responsiveD3Charts) {
          resolve();
        } else {
          setTimeout(checkComponents, 100);
        }
      };
      checkComponents();
    });
  }

  setupEventListeners() {
    // Listen for data changes
    document.addEventListener('d3DataReady', (event) => {
      this.handleDataReady(event.detail);
    });
    
    // Listen for jurisdiction selection
    document.addEventListener('jurisdictionSelected', (event) => {
      this.handleJurisdictionSelection(event.detail);
    });
    
    // Listen for filter changes
    document.addEventListener('filtersChanged', (event) => {
      this.handleFiltersChanged(event.detail);
    });
    
    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 300));
  }

  setupFilterControls() {
    // Metric selector
    const metricSelect = document.getElementById('metric-select');
    if (metricSelect) {
      metricSelect.addEventListener('change', (e) => {
        this.updateFilter('metric', e.target.value);
      });
    }

    // Year selector
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.updateFilter('year', e.target.value);
      });
    }

    // Show trends checkbox
    const showTrends = document.getElementById('show-trends');
    if (showTrends) {
      showTrends.addEventListener('change', (e) => {
        this.toggleTrendLines(e.target.checked);
      });
    }

    // Export report button
    const exportBtn = document.getElementById('export-report');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.generateExecutiveReport();
      });
    }
  }

  setupInteractions() {
    // Setup cross-component interactions
    this.setupJurisdictionHighlighting();
    this.setupMetricSynchronization();
    this.setupDataDrilldown();
  }

  setupJurisdictionHighlighting() {
    // When a jurisdiction is selected on the map, highlight it in charts
    if (this.components.mapVisualization) {
      // This would be handled by the jurisdiction selection event
    }
  }

  setupMetricSynchronization() {
    // Ensure all components use the same metric when changed
    this.metricSubscribers = new Set();
  }

  setupDataDrilldown() {
    // Enable clicking on chart elements to drill down into data
    // This would be implemented per chart type
  }

  // Filter and update methods
  updateFilter(filterType, value) {
    this.currentFilters[filterType] = value;
    
    // Debounce updates to avoid too many rapid changes
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  applyFilters() {
    if (!this.components.dataLoader) return;
    
    console.log('Applying filters:', this.currentFilters);
    
    // Apply filters to data loader
    const filteredData = this.components.dataLoader.applyFilters(this.currentFilters);
    
    // Update specific components based on filter type
    this.updateComponentsWithFilteredData(filteredData);
    
    // Dispatch filter change event
    document.dispatchEvent(new CustomEvent('filtersChanged', {
      detail: { filters: this.currentFilters, data: filteredData }
    }));
  }

  updateComponentsWithFilteredData(data) {
    // Update map if metric changed
    if (this.components.mapVisualization && this.currentFilters.metric) {
      const metricMap = {
        'total-fines': 'totalFines',
        'per-capita': 'perCapita',
        'growth-rate': 'growthRate',
        'technology-impact': 'techRatio'
      };
      
      const mappedMetric = metricMap[this.currentFilters.metric] || 'totalFines';
      this.components.mapVisualization.setMetric(mappedMetric);
    }
    
    // Charts are automatically updated via data loader subscriptions
    
    // Update statistics cards
    this.updateStatisticsCards(data);
  }

  updateStatisticsCards(data) {
    if (!data || !data.summary) return;
    
    // Update counter animations
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
      const target = this.getCounterTarget(counter, data);
      if (target !== null) {
        this.animateCounter(counter, target);
      }
    });
    
    // Update summary statistics
    this.updateSummaryStatistics(data.summary);
  }

  getCounterTarget(counter, data) {
    const targetAttr = counter.getAttribute('data-target');
    const metricType = counter.getAttribute('data-metric');
    
    if (metricType === 'middle-aged-percentage' && data.summary) {
      return Math.round(data.summary.middleAgedPercentage);
    }
    
    if (metricType === 'total-fines' && data.summary) {
      return data.summary.totalFines;
    }
    
    return targetAttr ? parseInt(targetAttr) : null;
  }

  animateCounter(element, targetValue) {
    if (!element || isNaN(targetValue)) return;
    
    const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      
      // Format based on value size
      if (targetValue > 1000) {
        element.textContent = Math.round(currentValue).toLocaleString();
      } else {
        element.textContent = Math.round(currentValue);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Final value and completion effect
        element.textContent = targetValue > 1000 ? targetValue.toLocaleString() : targetValue;
        this.addCounterCompletionEffect(element);
      }
    };
    
    requestAnimationFrame(animate);
  }

  addCounterCompletionEffect(element) {
    element.style.transition = 'all 0.3s ease';
    element.style.transform = 'scale(1.1)';
    element.style.color = '#10b981';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.color = '';
    }, 300);
  }

  updateSummaryStatistics(summary) {
    // Update text elements with summary data
    const updates = [
      { selector: '#middle-aged-percentage', value: `${Math.round(summary.middleAgedPercentage)}%` },
      { selector: '#total-records', value: summary.totalRecords.toLocaleString() },
      { selector: '#peak-year', value: summary.peakYear ? summary.peakYear[0] : 'N/A' }
    ];
    
    updates.forEach(({ selector, value }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = value;
      }
    });
  }

  // Event handlers
  handleDataReady(detail) {
    console.log('Dashboard controller received data ready event');
    
    if (detail.data && detail.data.summary) {
      this.updateStatisticsCards(detail.data);
    }
  }

  handleJurisdictionSelection(detail) {
    console.log('Dashboard controller handling jurisdiction selection:', detail);
    
    // Update any dashboard-specific UI based on selection
    this.updateJurisdictionFocus(detail.jurisdiction, detail.data);
    
    // Sync selection across components
    this.syncJurisdictionSelection(detail.jurisdiction);
  }

  updateJurisdictionFocus(jurisdictionCode, data) {
    // Update breadcrumb or header
    const breadcrumb = document.querySelector('.jurisdiction-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = `Dashboard > ${jurisdictionCode}`;
    }
    
    // Update comparison table selection
    document.querySelectorAll('.clickable-row').forEach(row => {
      row.classList.remove('selected');
    });
    
    const selectedRow = document.querySelector(`[data-jurisdiction="${jurisdictionCode}"]`);
    if (selectedRow) {
      selectedRow.classList.add('selected');
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Update insights panel
    this.updateInsightsPanel(jurisdictionCode, data);
  }

  updateInsightsPanel(jurisdictionCode, data) {
    const insightsPanel = document.getElementById('jurisdiction-details');
    const selectedText = document.getElementById('selected-jurisdiction');
    
    if (selectedText) {
      selectedText.textContent = `Analysis for ${jurisdictionCode}`;
    }
    
    if (insightsPanel) {
      insightsPanel.style.display = 'block';
      
      // Animate panel appearance
      insightsPanel.style.opacity = '0';
      insightsPanel.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        insightsPanel.style.transition = 'all 0.5s ease';
        insightsPanel.style.opacity = '1';
        insightsPanel.style.transform = 'translateY(0)';
      }, 100);
    }
  }

  syncJurisdictionSelection(jurisdictionCode) {
    // Ensure all components reflect the same selection
    this.currentFilters.jurisdiction = jurisdictionCode;
    
    // Update filter dropdown if exists
    const jurisdictionSelect = document.getElementById('jurisdiction-select');
    if (jurisdictionSelect) {
      jurisdictionSelect.value = jurisdictionCode;
    }
  }

  handleFiltersChanged(detail) {
    console.log('Filters changed:', detail.filters);
    
    // Update UI to reflect current filters
    this.updateFilterUI(detail.filters);
  }

  updateFilterUI(filters) {
    // Update any filter indicators or breadcrumbs
    const filterIndicator = document.querySelector('.active-filters');
    if (filterIndicator) {
      const activeFilters = Object.entries(filters)
        .filter(([key, value]) => value !== 'all')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      filterIndicator.textContent = activeFilters || 'No filters active';
    }
  }

  handleResize() {
    // Trigger resize on all responsive components
    if (this.components.mapVisualization && this.components.mapVisualization.resize) {
      this.components.mapVisualization.resize();
    }
    
    if (this.components.charts && this.components.charts.resizeCharts) {
      this.components.charts.resizeCharts();
    }
  }

  // Animation and interaction methods
  scheduleInitialAnimations() {
    // Schedule staggered animations for better UX
    this.animationQueue = [
      { delay: 500, action: () => this.animateStatCards() },
      { delay: 1000, action: () => this.animateMap() },
      { delay: 1500, action: () => this.animateCharts() },
      { delay: 2000, action: () => this.animateInsights() }
    ];
    
    this.executeAnimationQueue();
  }

  executeAnimationQueue() {
    this.animationQueue.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  }

  animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 50);
      }, index * 150);
    });
  }

  animateMap() {
    if (this.components.mapVisualization && this.components.mapVisualization.runDemoAnimation) {
      // Run a subtle demo animation
      // this.components.mapVisualization.runDemoAnimation();
    }
  }

  animateCharts() {
    // Charts animate automatically when data loads
    console.log('Charts animation triggered');
  }

  animateInsights() {
    const insights = document.querySelectorAll('.insight-item');
    insights.forEach((insight, index) => {
      setTimeout(() => {
        insight.style.opacity = '0';
        insight.style.transform = 'translateX(-30px)';
        insight.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
          insight.style.opacity = '1';
          insight.style.transform = 'translateX(0)';
        }, 50);
      }, index * 200);
    });
  }

  // Report generation
  generateExecutiveReport() {
    if (!this.components.dataLoader || !this.components.dataLoader.isLoaded) {
      this.showNotification('Data not ready. Please wait...', 'warning');
      return;
    }
    
    console.log('Generating executive report...');
    
    const exportBtn = document.getElementById('export-report');
    const originalText = exportBtn ? exportBtn.textContent : '';
    
    if (exportBtn) {
      exportBtn.textContent = '📊 Generating...';
      exportBtn.disabled = true;
    }
    
    // Simulate report generation
    setTimeout(() => {
      const reportData = this.generateReportData();
      this.downloadReport(reportData);
      
      if (exportBtn) {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
      }
      
      this.showNotification('Executive Report generated successfully!', 'success');
    }, 2000);
  }

  generateReportData() {
    const data = this.components.dataLoader.getProcessedData();
    
    return {
      metadata: {
        title: 'Road Safety Enforcement Analysis Report',
        generatedAt: new Date().toISOString(),
        filters: this.currentFilters,
        dataRange: data.rawDataLength + ' records'
      },
      executiveSummary: {
        totalFines: data.summary?.totalFines || 0,
        middleAgedPercentage: Math.round(data.summary?.middleAgedPercentage || 0),
        topJurisdiction: data.summary?.topJurisdiction || ['Unknown', 0],
        peakYear: data.summary?.peakYear || ['Unknown', 0]
      },
      jurisdictionalAnalysis: data.byJurisdiction || [],
      recommendations: this.generateRecommendations(data),
      chartData: this.components.charts ? this.components.charts.exportChartsData() : {},
      mapData: this.components.mapVisualization ? this.components.mapVisualization.exportMapData() : {}
    };
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    if (data.summary?.middleAgedPercentage > 40) {
      recommendations.push('Develop targeted safety campaigns for experienced drivers (40-64 age group)');
    }
    
    if (data.byJurisdiction) {
      const topPerformer = data.byJurisdiction.reduce((max, current) => 
        current.totalFines > max.totalFines ? current : max, data.byJurisdiction[0]);
      
      if (topPerformer) {
        recommendations.push(`Study ${topPerformer.jurisdiction}'s enforcement strategies for national implementation`);
      }
    }
    
    recommendations.push('Accelerate deployment of automated detection technology');
    recommendations.push('Establish inter-jurisdictional data sharing protocols');
    
    return recommendations;
  }

  downloadReport(reportData) {
    // In a real implementation, this would generate a PDF or Excel file
    const jsonReport = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonReport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `road-safety-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Report downloaded:', reportData.metadata.title);
  }

  // Special interaction methods
  toggleTrendLines(show) {
    console.log('Toggling trend lines:', show);
    
    // This would add trend indicators to visualizations
    if (this.components.charts) {
      // Update charts to show/hide trend lines
      this.components.charts.charts.forEach((chart, chartId) => {
        if (chart.config && chart.config.showTrends !== undefined) {
          chart.config.showTrends = show;
          if (chart.update && this.components.dataLoader) {
            chart.update(this.components.dataLoader.getProcessedData());
          }
        }
      });
    }
  }

  highlightTopPerformers() {
    if (!this.components.dataLoader) return;
    
    const topPerformers = this.components.dataLoader.getTopPerformers('totalFines', 3);
    
    // Highlight on map
    if (this.components.mapVisualization) {
      const topCodes = topPerformers.map(p => p.jurisdiction);
      this.components.mapVisualization.highlightTopPerformers(3);
    }
    
    // Highlight in charts
    this.animateTopPerformersInCharts(topPerformers);
    
    this.showNotification(`Top 3 performers: ${topPerformers.map(p => p.jurisdiction).join(', ')}`, 'info');
  }

  animateTopPerformersInCharts(topPerformers) {
    // This would highlight bars, points, etc. in charts
    const topCodes = topPerformers.map(p => p.jurisdiction);
    
    // Add visual emphasis to top performers in bar charts
    setTimeout(() => {
      topCodes.forEach((code, index) => {
        const elements = document.querySelectorAll(`[data-jurisdiction="${code}"]`);
        elements.forEach(element => {
          element.style.transition = 'all 0.5s ease';
          element.style.filter = 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))';
          element.style.transform = 'scale(1.05)';
          
          setTimeout(() => {
            element.style.filter = '';
            element.style.transform = '';
          }, 3000);
        });
      });
    }, 500);
  }

  // Data drill-down methods
  drillDownToJurisdiction(jurisdictionCode) {
    // Update filters to focus on specific jurisdiction
    this.updateFilter('jurisdiction', jurisdictionCode);
    
    // Get detailed time series for this jurisdiction
    const timeSeriesData = this.components.dataLoader.getTimeSeriesForJurisdiction(jurisdictionCode);
    
    // Create or update a detailed chart
    this.createJurisdictionDetailChart(jurisdictionCode, timeSeriesData);
  }

  createJurisdictionDetailChart(jurisdictionCode, data) {
    // Create a new chart container if it doesn't exist
    let chartContainer = document.getElementById('jurisdiction-detail-chart');
    if (!chartContainer) {
      chartContainer = document.createElement('div');
      chartContainer.id = 'jurisdiction-detail-chart';
      chartContainer.style.cssText = `
        width: 100%;
        height: 300px;
        margin: 20px 0;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      `;
      
      const insightsPanel = document.getElementById('jurisdiction-details');
      if (insightsPanel) {
        insightsPanel.appendChild(chartContainer);
      }
    }
    
    // Create a time series chart for this specific jurisdiction
    if (this.components.charts) {
      const chart = this.components.charts.createTimeSeriesChart('jurisdiction-detail-chart', {
        width: 500,
        height: 250,
        showPoints: true,
        showArea: true
      });
      
      // Update with jurisdiction-specific data
      chart.update({ byYear: data });
    }
  }

  // Comparison methods
  compareJurisdictions(jurisdictionCodes) {
    if (!jurisdictionCodes || jurisdictionCodes.length < 2) return;
    
    console.log('Comparing jurisdictions:', jurisdictionCodes);
    
    // Create comparison visualization
    this.createComparisonChart(jurisdictionCodes);
    
    // Update insights panel with comparison
    this.updateComparisonInsights(jurisdictionCodes);
  }

  createComparisonChart(jurisdictionCodes) {
    // Get data for comparison
    const comparisonData = jurisdictionCodes.map(code => {
      const data = this.components.dataLoader.getJurisdictionData(code);
      return {
        jurisdiction: code,
        ...data
      };
    });
    
    // Create comparison bar chart
    let comparisonContainer = document.getElementById('comparison-chart');
    if (!comparisonContainer) {
      comparisonContainer = document.createElement('div');
      comparisonContainer.id = 'comparison-chart';
      comparisonContainer.style.cssText = `
        width: 100%;
        height: 300px;
        margin: 20px 0;
      `;
      
      const dashboardGrid = document.querySelector('.dashboard-grid');
      if (dashboardGrid) {
        dashboardGrid.appendChild(comparisonContainer);
      }
    }
    
    if (this.components.charts) {
      const chart = this.components.charts.createBarChart('comparison-chart', {
        width: 600,
        height: 300,
        sortData: false
      });
      
      chart.update({ byJurisdiction: comparisonData });
    }
  }

  updateComparisonInsights(jurisdictionCodes) {
    // Generate comparison insights
    const insights = jurisdictionCodes.map(code => {
      const data = this.components.dataLoader.getJurisdictionData(code);
      return {
        code,
        data,
        performance: this.calculatePerformanceScore(data)
      };
    });
    
    // Sort by performance
    insights.sort((a, b) => b.performance - a.performance);
    
    // Update UI with comparison
    this.displayComparisonResults(insights);
  }

  calculatePerformanceScore(data) {
    // Simple performance scoring based on multiple factors
    const finesScore = Math.min(data.totalFines / 1000000, 1) * 40; // 40 points max
    const growthScore = Math.min(data.growthRate / 100, 1) * 30; // 30 points max
    const techScore = data.techRatio * 30; // 30 points max
    
    return finesScore + growthScore + techScore;
  }

  displayComparisonResults(insights) {
    const resultsHTML = insights.map((insight, index) => `
      <div class="comparison-result" style="
        padding: 15px;
        margin: 10px 0;
        background: ${index === 0 ? '#f0f9ff' : '#f8fafc'};
        border-left: 4px solid ${index === 0 ? '#3b82f6' : '#e5e7eb'};
        border-radius: 6px;
      ">
        <h4>${insight.code} ${index === 0 ? '👑' : ''}</h4>
        <p>Performance Score: ${insight.performance.toFixed(1)}/100</p>
        <p>Total Fines: ${insight.data.totalFines.toLocaleString()}</p>
        <p>Growth Rate: ${insight.data.growthRate.toFixed(1)}%</p>
      </div>
    `).join('');
    
    let resultsContainer = document.getElementById('comparison-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'comparison-results';
      resultsContainer.innerHTML = '<h4>Comparison Results</h4>';
      
      const insightsPanel = document.getElementById('jurisdiction-details');
      if (insightsPanel) {
        insightsPanel.appendChild(resultsContainer);
      }
    }
    
    resultsContainer.innerHTML = '<h4>Comparison Results</h4>' + resultsHTML;
  }

  // Utility methods
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'dashboard-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      max-width: 400px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 400);
    }, 4000);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Public API methods
  getCurrentFilters() {
    return { ...this.currentFilters };
  }

  getComponentStatus() {
    return {
      dataLoader: !!this.components.dataLoader && this.components.dataLoader.isLoaded,
      mapVisualization: !!this.components.mapVisualization,
      charts: !!this.components.charts,
      isInitialized: this.isInitialized
    };
  }

  exportDashboardState() {
    return {
      filters: this.currentFilters,
      selectedJurisdiction: this.components.mapVisualization ? 
        this.components.mapVisualization.getSelectedJurisdiction() : null,
      timestamp: new Date().toISOString(),
      componentStatus: this.getComponentStatus()
    };
  }

  resetDashboard() {
    // Reset all filters
    this.currentFilters = {
      jurisdiction: 'all',
      year: 'all',
      metric: 'totalFines',
      ageGroup: 'all'
    };
    
    // Reset component states
    if (this.components.mapVisualization) {
      this.components.mapVisualization.resetHighlighting();
    }
    
    // Reset form controls
    document.querySelectorAll('select').forEach(select => {
      select.selectedIndex = 0;
    });
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Apply reset filters
    this.applyFilters();
    
    this.showNotification('Dashboard reset successfully', 'success');
  }

  // Demo and showcase methods
  runDashboardDemo() {
    console.log('Running dashboard demo...');
    
    // Sequence of demo actions
    const demoActions = [
      { delay: 1000, action: () => this.highlightTopPerformers() },
      { delay: 3000, action: () => this.updateFilter('metric', 'per-capita') },
      { delay: 5000, action: () => this.updateFilter('year', '2021') },
      { delay: 7000, action: () => this.compareJurisdictions(['NSW', 'VIC', 'QLD']) },
      { delay: 10000, action: () => this.resetDashboard() }
    ];
    
    demoActions.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  }
}

// Global instance and initialization
window.responsiveD3Dashboard = null;

// Global functions for HTML integration
window.generateExecutiveReport = function() {
  if (window.responsiveD3Dashboard && window.responsiveD3Dashboard.isInitialized) {
    window.responsiveD3Dashboard.generateExecutiveReport();
  } else {
    alert('Dashboard not ready. Please wait for initialization to complete.');
  }
};

window.exportDataPackage = function() {
  if (window.responsiveD3Dashboard && window.responsiveD3Dashboard.isInitialized) {
    const state = window.responsiveD3Dashboard.exportDashboardState();
    console.log('Exporting data package:', state);
    alert('Data Package: Exporting comprehensive dashboard state and data. This would download a complete package in a real implementation.');
  } else {
    alert('Dashboard not ready. Please wait for initialization to complete.');
  }
};

window.openPolicySimulator = function() {
  if (window.responsiveD3Dashboard && window.responsiveD3Dashboard.isInitialized) {
    // In a real implementation, this would open an interactive policy simulator
    console.log('Opening policy simulator...');
    alert('Policy Simulator: Opening interactive modeling tool. This would launch a comprehensive simulation interface in a real implementation.');
  } else {
    alert('Please wait for the dashboard to fully load.');
  }
};

window.viewRoadmap = function() {
  alert('Implementation Roadmap: Displaying step-by-step guidance for enforcement strategy implementation. This would show a detailed interactive roadmap in a real implementation.');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('insights')) {
    console.log('Initializing Responsive D3 Dashboard Controller...');
    
    window.responsiveD3Dashboard = new ResponsiveD3DashboardController();
    window.responsiveD3Dashboard.init().then(() => {
      console.log('Responsive D3 Dashboard fully initialized and ready!');
      
      // Dispatch ready event
      document.dispatchEvent(new CustomEvent('dashboardReady', {
        detail: { 
          controller: window.responsiveD3Dashboard,
          status: window.responsiveD3Dashboard.getComponentStatus()
        }
      }));
    });
  }
});

// Export the class
window.ResponsiveD3DashboardController = ResponsiveD3DashboardController;