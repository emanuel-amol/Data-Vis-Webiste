// js/insights/insights-dashboard-controller.js
// Main controller for the insights dashboard

class InsightsDashboardController {
  constructor() {
    this.data = null;
    this.currentMetric = 'total-fines';
    this.currentYear = 'all';
    this.showTrends = false;
    this.isInitialized = false;
    
    // Progressive disclosure state
    this.revealedInsights = new Set();
    
    // Animation counters
    this.animationCounters = new Map();
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupEventListeners();
    this.setupProgressiveDisclosure();
    this.setupTableInteractivity();
    this.setupDashboardControls();
    this.loadData();
    
    this.isInitialized = true;
    console.log('Insights dashboard controller initialized');
  }

  setupEventListeners() {
    // Data ready event
    document.addEventListener('insightsDataReady', (event) => {
      this.data = event.detail.data;
      this.updateDashboard();
      this.animateCounters();
      this.updateComparisonTable();
    });

    // Jurisdiction selection event
    document.addEventListener('jurisdictionSelected', (event) => {
      this.handleJurisdictionSelection(event.detail);
    });

    // Window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 300));
  }

  setupDashboardControls() {
    // Metric selector
    const metricSelect = document.getElementById('metric-select');
    if (metricSelect) {
      metricSelect.addEventListener('change', (e) => {
        this.currentMetric = e.target.value;
        this.updateVisualizationMetric();
      });
    }

    // Year selector
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.currentYear = e.target.value;
        this.updateVisualizationYear();
      });
    }

    // Show trends checkbox
    const showTrends = document.getElementById('show-trends');
    if (showTrends) {
      showTrends.addEventListener('change', (e) => {
        this.showTrends = e.target.checked;
        this.toggleTrendLines();
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

  setupTableInteractivity() {
    // Add click handlers for table rows
    document.querySelectorAll('.clickable-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const jurisdiction = row.getAttribute('data-jurisdiction');
        this.selectJurisdictionFromTable(jurisdiction);
      });
      
      // Add hover effects
      row.addEventListener('mouseenter', (e) => {
        row.style.backgroundColor = '#f8fafc';
      });
      
      row.addEventListener('mouseleave', (e) => {
        if (!row.classList.contains('selected')) {
          row.style.backgroundColor = '';
        }
      });
    });
  }

  setupProgressiveDisclosure() {
    const revealTriggers = document.querySelectorAll('.reveal-trigger');
    
    revealTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const insightItem = trigger.closest('.insight-item');
        const insightId = insightItem.dataset.reveal;
        
        this.toggleInsightReveal(insightItem, insightId, trigger);
      });
    });
  }

  toggleInsightReveal(insightItem, insightId, trigger) {
    if (this.revealedInsights.has(insightId)) {
      // Hide insight
      this.hideInsight(insightItem, insightId, trigger);
    } else {
      // Reveal insight with animation
      this.revealInsight(insightItem, insightId, trigger);
    }
  }

  revealInsight(insightItem, insightId, trigger) {
    insightItem.classList.add('revealed');
    this.revealedInsights.add(insightId);
    
    const content = insightItem.querySelector('.insight-content');
    content.style.maxHeight = '500px';
    content.style.padding = '30px';
    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
    
    trigger.textContent = 'Hide insight';
    trigger.style.background = '#10b981';
    trigger.style.color = 'white';
    
    // Animate the reveal
    content.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Track analytics (in a real app)
    console.log(`Insight ${insightId} revealed`);
  }

  hideInsight(insightItem, insightId, trigger) {
    insightItem.classList.remove('revealed');
    this.revealedInsights.delete(insightId);
    
    const content = insightItem.querySelector('.insight-content');
    content.style.maxHeight = '0';
    content.style.padding = '0 30px';
    content.style.opacity = '0';
    content.style.transform = 'translateY(-20px)';
    
    trigger.textContent = 'Click to reveal';
    trigger.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    trigger.style.color = 'white';
  }

  loadData() {
    if (window.insightsData) {
      this.data = window.insightsData;
      this.updateDashboard();
      this.animateCounters();
      this.updateComparisonTable();
    }
  }

  updateDashboard() {
    if (!this.data) return;
    
    console.log('Updating insights dashboard with data:', this.data);
    
    // Update key statistics in the executive summary
    this.updateExecutiveSummary();
    
    // Update the comparison table with real data
    this.updateComparisonTable();
    
    // Update map if available
    if (window.insightsMapVisualization) {
      window.insightsMapVisualization.updateData(this.data);
    }
  }

  updateExecutiveSummary() {
    if (!this.data || !this.data.insights) return;
    
    const insights = this.data.insights;
    
    // Update counter targets
    const middleAgedStat = document.querySelector('[data-target="45"]');
    if (middleAgedStat) {
      middleAgedStat.setAttribute('data-target', insights.middleAgedPercentage);
    }
    
    const middleAgedFinesStat = document.querySelector('[data-target="604750"]');
    if (middleAgedFinesStat) {
      middleAgedFinesStat.setAttribute('data-target', insights.middleAgedFines);
    }
    
    // Update the ratio display
    const ratioElement = document.querySelector('.key-stat:contains("2.0x")');
    if (ratioElement) {
      ratioElement.textContent = `${insights.experienceParadoxRatio.toFixed(1)}x`;
    }
  }

  updateComparisonTable() {
    if (!this.data || !this.data.jurisdictions) return;
    
    const tableBody = document.querySelector('#comparison-table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Sort jurisdictions by total fines
    const sortedJurisdictions = Object.entries(this.data.jurisdictions)
      .sort(([,a], [,b]) => b.totalFines - a.totalFines);
    
    sortedJurisdictions.forEach(([code, data]) => {
      const details = window.insightsDataLoader.getJurisdictionDetails(code);
      const row = this.createTableRow(code, details, data);
      tableBody.appendChild(row);
    });
    
    // Re-attach event listeners
    this.setupTableInteractivity();
  }

  createTableRow(code, details, data) {
    const row = document.createElement('tr');
    row.className = 'clickable-row';
    row.setAttribute('data-jurisdiction', code);
    
    // Determine policy grade
    let policyGrade = 'Needs Improvement';
    if (data.growthRate > 100) policyGrade = 'Excellent';
    else if (data.growthRate > 40) policyGrade = 'Very Good';
    else if (data.growthRate > 20) policyGrade = 'Good';
    else if (data.growthRate > 10) policyGrade = 'Fair';
    
    row.innerHTML = `
      <td><strong>${code}</strong></td>
      <td>${data.totalFines.toLocaleString()}</td>
      <td>${data.perCapita.toFixed(0)} per 100k</td>
      <td>+${data.growthRate.toFixed(1)}%</td>
      <td>${data.techScore}</td>
      <td>${policyGrade}</td>
    `;
    
    return row;
  }

  selectJurisdictionFromTable(jurisdictionCode) {
    // Clear previous selections
    document.querySelectorAll('.clickable-row').forEach(row => {
      row.classList.remove('selected');
      row.style.backgroundColor = '';
    });
    
    // Select new row
    const selectedRow = document.querySelector(`[data-jurisdiction="${jurisdictionCode}"]`);
    if (selectedRow) {
      selectedRow.classList.add('selected');
      selectedRow.style.backgroundColor = '#dbeafe';
    }
    
    // Trigger map selection if available
    if (window.insightsMapVisualization) {
      window.insightsMapVisualization.programmaticSelect(jurisdictionCode);
    }
  }

  handleJurisdictionSelection(detail) {
    console.log('Handling jurisdiction selection:', detail);
    
    // Update any dashboard-specific UI based on selection
    this.updateSelectedJurisdictionDisplay(detail);
  }

  updateSelectedJurisdictionDisplay(detail) {
    // Update any global dashboard elements based on selection
    // This could include updating charts, statistics, etc.
    
    // Example: Update a breadcrumb or selected state indicator
    const breadcrumb = document.querySelector('.jurisdiction-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = `Dashboard > ${detail.data.name}`;
    }
  }

  animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      if (isNaN(target)) return;
      
      this.animateValue(counter, 0, target, 2000);
    });
  }

  animateValue(element, start, end, duration) {
    if (!element) return;
    
    const startTime = performance.now();
    const change = end - start;
    
    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = start + (change * easedProgress);
      
      // Format the number appropriately
      if (end > 1000) {
        element.textContent = Math.round(currentValue).toLocaleString();
      } else {
        element.textContent = Math.round(currentValue);
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        // Ensure final value is exactly the target
        if (end > 1000) {
          element.textContent = end.toLocaleString();
        } else {
          element.textContent = end;
        }
      }
    };
    
    requestAnimationFrame(updateValue);
  }

  updateVisualizationMetric() {
    console.log('Updating visualization metric to:', this.currentMetric);
    
    // Update map colors based on selected metric
    if (window.insightsMapVisualization && this.data) {
      // This would update the map coloring based on the selected metric
      // For now, we'll just log the change
      console.log('Map metric updated to:', this.currentMetric);
    }
  }

  updateVisualizationYear() {
    console.log('Updating visualization year to:', this.currentYear);
    
    // Filter data by year if specific year selected
    if (this.currentYear !== 'all' && this.data) {
      // This would filter the data and update visualizations
      console.log('Year filter applied:', this.currentYear);
    }
  }

  toggleTrendLines() {
    console.log('Toggling trend lines:', this.showTrends);
    
    // This would show/hide trend lines on the map or other visualizations
    if (this.showTrends) {
      // Add trend indicators
      console.log('Showing trend lines');
    } else {
      // Hide trend indicators
      console.log('Hiding trend lines');
    }
  }

  generateExecutiveReport() {
    if (!this.data) {
      this.showNotification('No data available for report generation', 'error');
      return;
    }
    
    console.log('Generating executive report...');
    
    // Simulate report generation process
    const exportBtn = document.getElementById('export-report');
    const originalText = exportBtn.textContent;
    
    exportBtn.textContent = '📊 Generating...';
    exportBtn.disabled = true;
    
    setTimeout(() => {
      // In a real application, this would generate and download a PDF
      this.showNotification('Executive Report generated successfully!', 'success');
      
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
      
      // Simulate download
      console.log('Report would be downloaded here');
      
      // Create a sample report object that would be sent to a PDF generator
      const reportData = this.generateReportData();
      console.log('Report data:', reportData);
      
    }, 2000);
  }

  generateReportData() {
    if (!this.data) return null;
    
    const topPerformers = window.insightsDataLoader.getTopPerformers();
    const techLeaders = window.insightsDataLoader.getTechnologyLeaders();
    
    return {
      executiveSummary: {
        title: 'Road Safety Enforcement Analysis',
        dateGenerated: new Date().toISOString(),
        keyFindings: [
          `Middle-aged drivers (40-64) account for ${this.data.insights.middleAgedPercentage}% of all fines`,
          `${this.data.insights.techLeader} leads with ${this.data.insights.techGrowth}% growth through technology adoption`,
          'Experience paradox: More experienced drivers receive more violations'
        ]
      },
      jurisdictionalAnalysis: {
        topPerformers: topPerformers,
        technologyLeaders: techLeaders,
        recommendations: this.generateNationalRecommendations()
      },
      dataQuality: {
        totalRecords: this.data.raw ? this.data.raw.length : 0,
        timespan: '2008-2023',
        jurisdictionsCovered: Object.keys(this.data.jurisdictions || {}).length
      }
    };
  }

  generateNationalRecommendations() {
    return [
      'Accelerate nationwide deployment of mobile phone detection technology',
      'Develop targeted campaigns for middle-aged driver demographic (40-64)',
      'Establish technology sharing agreements between high and low performing jurisdictions',
      'Implement evidence-based policy development processes',
      'Create national best-practice sharing mechanisms'
    ];
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'insights-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    // Set color based on type
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
      }, 300);
    }, 4000);
  }

  handleResize() {
    // Handle responsive adjustments
    console.log('Handling dashboard resize');
    
    // Update any size-dependent visualizations
    if (window.insightsMapVisualization) {
      // Map visualization would handle its own resize
    }
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

  // Public methods for external access
  getCurrentMetric() {
    return this.currentMetric;
  }

  getCurrentYear() {
    return this.currentYear;
  }

  getRevealedInsights() {
    return Array.from(this.revealedInsights);
  }

  getData() {
    return this.data;
  }
}

// Global functions for backward compatibility with HTML onclick handlers
function generateExecutiveReport() {
  if (window.insightsDashboardController) {
    window.insightsDashboardController.generateExecutiveReport();
  }
}

function exportDataPackage() {
  alert('Data Package: Exporting raw data, processed statistics, and visualization assets. This would download a ZIP file in a real implementation.');
}

function openPolicySimulator() {
  alert('Policy Simulator: Opening modeling tool for enforcement strategy analysis. This would launch an interactive simulation in a real implementation.');
}

function viewRoadmap() {
  alert('Implementation Roadmap: Displaying step-by-step guidance for enforcement strategy implementation. This would show a detailed roadmap in a real implementation.');
}

// Initialize the dashboard controller
let insightsDashboardController;

document.addEventListener('DOMContentLoaded', function() {
  insightsDashboardController = new InsightsDashboardController();
  insightsDashboardController.init();
  window.insightsDashboardController = insightsDashboardController;
  console.log('Insights dashboard controller initialized');
});

// Export for use in other modules
window.InsightsDashboardController = InsightsDashboardController;