// js/insights/insights-main.js
// Main initialization file for the insights page

class InsightsMain {
  constructor() {
    this.components = {
      dataLoader: null,
      mapVisualization: null,
      dashboardController: null,
      animations: null
    };
    this.isInitialized = false;
    this.loadingTimeout = null;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('Initializing insights page...');
    
    try {
      // Show loading state
      this.showLoadingState();
      
      // Initialize components in order
      await this.initializeDataLoader();
      await this.initializeVisualizations();
      await this.initializeInteractions();
      await this.initializeAnimations();
      
      // Hide loading state
      this.hideLoadingState();
      
      this.isInitialized = true;
      console.log('Insights page fully initialized');
      
    } catch (error) {
      console.error('Error initializing insights page:', error);
      this.showErrorState(error);
    }
  }

  showLoadingState() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'insights-loading';
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;
    
    loadingOverlay.innerHTML = `
      <div style="
        width: 60px;
        height: 60px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: insights-loading-spin 1s linear infinite;
        margin-bottom: 20px;
      "></div>
      <h3 style="color: #374151; margin-bottom: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Loading Insights Dashboard</h3>
      <p style="color: #6b7280; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Analyzing road safety enforcement data...</p>
    `;
    
    document.body.appendChild(loadingOverlay);
    
    // Add loading animation CSS
    if (!document.getElementById('insights-loading-css')) {
      const style = document.createElement('style');
      style.id = 'insights-loading-css';
      style.textContent = `
        @keyframes insights-loading-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set timeout to show error if loading takes too long
    this.loadingTimeout = setTimeout(() => {
      this.showErrorState(new Error('Loading timeout - data may be unavailable'));
    }, 10000);
  }

  hideLoadingState() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    
    const loadingOverlay = document.getElementById('insights-loading');
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      loadingOverlay.style.transform = 'scale(0.9)';
      loadingOverlay.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        loadingOverlay.remove();
      }, 300);
    }
  }

  showErrorState(error) {
    this.hideLoadingState();
    
    const errorOverlay = document.createElement('div');
    errorOverlay.id = 'insights-error';
    errorOverlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10001;
      text-align: center;
      max-width: 400px;
    `;
    
    errorOverlay.innerHTML = `
      <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">⚠️</div>
      <h3 style="color: #374151; margin-bottom: 15px;">Unable to Load Data</h3>
      <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.5;">${error.message}</p>
      <button onclick="window.location.reload()" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
        Retry
      </button>
    `;
    
    document.body.appendChild(errorOverlay);
  }

  async initializeDataLoader() {
    console.log('Initializing data loader...');
    
    // The data loader should already be initialized from its own file
    if (window.insightsDataLoader) {
      this.components.dataLoader = window.insightsDataLoader;
      
      // Wait for data to load
      if (!this.components.dataLoader.isLoaded) {
        await this.components.dataLoader.loadData();
      }
    } else {
      throw new Error('Data loader not available');
    }
  }

  async initializeVisualizations() {
    console.log('Initializing visualizations...');
    
    // Initialize map visualization
    if (window.insightsMapVisualization) {
      this.components.mapVisualization = window.insightsMapVisualization;
    } else {
      console.warn('Map visualization not available');
    }
    
    // Wait a bit for visualizations to settle
    await this.delay(500);
  }

  async initializeInteractions() {
    console.log('Initializing interactions...');
    
    // Initialize dashboard controller
    if (window.insightsDashboardController) {
      this.components.dashboardController = window.insightsDashboardController;
    } else {
      console.warn('Dashboard controller not available');
    }
    
    // Setup additional event listeners
    this.setupGlobalEventListeners();
    
    await this.delay(200);
  }

  async initializeAnimations() {
    console.log('Initializing animations...');
    
    // Initialize animations system
    if (window.insightsAnimations) {
      this.components.animations = window.insightsAnimations;
    } else {
      console.warn('Animations system not available');
    }
    
    // Trigger initial animations
    this.triggerInitialAnimations();
    
    await this.delay(300);
  }

  setupGlobalEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.onPageVisible();
      } else {
        this.onPageHidden();
      }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Handle resize events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 300));

    // Handle scroll events for additional effects
    window.addEventListener('scroll', this.throttle(() => {
      this.handleScroll();
    }, 16));
  }

  triggerInitialAnimations() {
    // Animate the executive summary counters
    setTimeout(() => {
      if (this.components.dashboardController) {
        this.components.dashboardController.animateCounters();
      }
    }, 500);

    // Trigger staggered reveal animations
    const revealElements = document.querySelectorAll('.animated-reveal');
    revealElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('revealed');
      }, index * 200);
    });
  }

  onPageVisible() {
    console.log('Page became visible');
    // Restart any paused animations or processes
  }

  onPageHidden() {
    console.log('Page became hidden');
    // Pause any resource-intensive animations
  }

  handleKeyboardNavigation(e) {
    // Implement keyboard shortcuts for accessibility
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          // Focus search or filter
          e.preventDefault();
          const firstSelect = document.querySelector('select');
          if (firstSelect) firstSelect.focus();
          break;
        
        case 'r':
          // Reset dashboard
          e.preventDefault();
          this.resetDashboard();
          break;
        
        case 'e':
          // Export report
          e.preventDefault();
          if (this.components.dashboardController) {
            this.components.dashboardController.generateExecutiveReport();
          }
          break;
      }
    }

    // Handle escape key to close modals or reset selections
    if (e.key === 'Escape') {
      this.handleEscapeKey();
    }

    // Handle arrow keys for jurisdiction navigation
    if (e.key.startsWith('Arrow')) {
      this.handleArrowKeyNavigation(e);
    }
  }

  handleEscapeKey() {
    // Close any open modals or reset selections
    const selectedJurisdiction = document.querySelector('.jurisdiction.selected');
    if (selectedJurisdiction) {
      selectedJurisdiction.classList.remove('selected');
      
      // Hide jurisdiction details
      const details = document.getElementById('jurisdiction-details');
      if (details) {
        details.style.display = 'none';
      }
    }
  }

  handleArrowKeyNavigation(e) {
    const jurisdictions = Array.from(document.querySelectorAll('.jurisdiction'));
    const currentSelected = document.querySelector('.jurisdiction.selected');
    
    if (jurisdictions.length === 0) return;
    
    let currentIndex = currentSelected ? jurisdictions.indexOf(currentSelected) : -1;
    let nextIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : jurisdictions.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < jurisdictions.length - 1 ? currentIndex + 1 : 0;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    
    const nextJurisdiction = jurisdictions[nextIndex];
    const jurisdictionCode = nextJurisdiction.getAttribute('data-jurisdiction');
    
    if (this.components.mapVisualization) {
      this.components.mapVisualization.selectJurisdiction(jurisdictionCode);
    }
  }

  handleResize() {
    console.log('Handling resize');
    
    // Update any size-dependent components
    if (this.components.mapVisualization) {
      // Map visualization would handle its own resize
    }
    
    // Adjust layout for mobile/desktop
    this.adjustLayoutForViewport();
  }

  handleScroll() {
    // Add scroll-based effects
    const scrollY = window.scrollY;
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-story');
    if (heroSection) {
      const parallaxSpeed = 0.5;
      heroSection.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
    }
    
    // Progressive reveal of insights as user scrolls
    this.updateProgressiveReveal(scrollY);
  }

  updateProgressiveReveal(scrollY) {
    const insights = document.querySelectorAll('.insight-item');
    const windowHeight = window.innerHeight;
    
    insights.forEach((insight, index) => {
      const rect = insight.getBoundingClientRect();
      const isVisible = rect.top < windowHeight * 0.8;
      
      if (isVisible && !insight.classList.contains('scroll-revealed')) {
        insight.classList.add('scroll-revealed');
        
        // Add slight delay for staggered effect
        setTimeout(() => {
          insight.style.opacity = '1';
          insight.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }

  adjustLayoutForViewport() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isDesktop = window.innerWidth >= 1024;
    
    // Adjust dashboard layout
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
      if (isMobile) {
        dashboardGrid.style.gridTemplateColumns = '1fr';
      } else if (isTablet) {
        dashboardGrid.style.gridTemplateColumns = '1fr';
      } else {
        dashboardGrid.style.gridTemplateColumns = '2fr 1fr';
      }
    }
    
    // Adjust map size
    const mapContainer = document.querySelector('#australia-map-container');
    if (mapContainer && isMobile) {
      mapContainer.style.height = '300px';
    }
  }

  resetDashboard() {
    console.log('Resetting dashboard');
    
    // Reset all selections
    document.querySelectorAll('.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Reset form controls
    document.querySelectorAll('select').forEach(select => {
      select.selectedIndex = 0;
    });
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Hide jurisdiction details
    const details = document.getElementById('jurisdiction-details');
    if (details) {
      details.style.display = 'none';
    }
    
    // Reset insight reveals
    document.querySelectorAll('.insight-item.revealed').forEach(item => {
      item.classList.remove('revealed');
      const content = item.querySelector('.insight-content');
      if (content) {
        content.style.maxHeight = '0';
        content.style.padding = '0 30px';
      }
    });
    
    // Show notification
    if (this.components.animations) {
      this.components.animations.showNotificationWithAnimation(
        'Dashboard reset successfully',
        'success'
      );
    }
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
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
  getComponentStatus() {
    return {
      dataLoader: !!this.components.dataLoader && this.components.dataLoader.isLoaded,
      mapVisualization: !!this.components.mapVisualization,
      dashboardController: !!this.components.dashboardController,
      animations: !!this.components.animations,
      isInitialized: this.isInitialized
    };
  }

  getLoadedData() {
    return this.components.dataLoader ? this.components.dataLoader.getData() : null;
  }

  selectJurisdiction(jurisdictionCode) {
    if (this.components.mapVisualization) {
      this.components.mapVisualization.programmaticSelect(jurisdictionCode);
    }
  }

  exportDashboardState() {
    const state = {
      selectedJurisdiction: this.components.mapVisualization ? 
        this.components.mapVisualization.getSelectedJurisdiction() : null,
      currentMetric: this.components.dashboardController ? 
        this.components.dashboardController.getCurrentMetric() : null,
      currentYear: this.components.dashboardController ? 
        this.components.dashboardController.getCurrentYear() : null,
      revealedInsights: this.components.dashboardController ? 
        this.components.dashboardController.getRevealedInsights() : [],
      timestamp: new Date().toISOString()
    };
    
    return state;
  }

  importDashboardState(state) {
    if (!state || !this.isInitialized) return false;
    
    try {
      // Restore jurisdiction selection
      if (state.selectedJurisdiction) {
        this.selectJurisdiction(state.selectedJurisdiction);
      }
      
      // Restore form controls
      if (state.currentMetric) {
        const metricSelect = document.getElementById('metric-select');
        if (metricSelect) metricSelect.value = state.currentMetric;
      }
      
      if (state.currentYear) {
        const yearSelect = document.getElementById('year-select');
        if (yearSelect) yearSelect.value = state.currentYear;
      }
      
      // Restore revealed insights
      if (state.revealedInsights && Array.isArray(state.revealedInsights)) {
        state.revealedInsights.forEach(insightId => {
          const insightItem = document.querySelector(`[data-reveal="${insightId}"]`);
          if (insightItem) {
            const trigger = insightItem.querySelector('.reveal-trigger');
            if (trigger) trigger.click();
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error importing dashboard state:', error);
      return false;
    }
  }
}

// Global functions for HTML integration
window.generateExecutiveReport = function() {
  if (window.insightsMain && window.insightsMain.components.dashboardController) {
    window.insightsMain.components.dashboardController.generateExecutiveReport();
  } else {
    alert('Dashboard not fully loaded. Please wait and try again.');
  }
};

window.exportDataPackage = function() {
  if (window.insightsMain && window.insightsMain.isInitialized) {
    const state = window.insightsMain.exportDashboardState();
    const dataPackage = {
      dashboardState: state,
      rawData: window.insightsMain.getLoadedData(),
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // In a real implementation, this would create and download a ZIP file
    console.log('Data package prepared:', dataPackage);
    alert('Data Package: Exporting raw data, processed statistics, and visualization assets. This would download a ZIP file in a real implementation.');
  } else {
    alert('Dashboard not ready. Please wait for initialization to complete.');
  }
};

window.openPolicySimulator = function() {
  if (window.insightsMain && window.insightsMain.isInitialized) {
    const currentData = window.insightsMain.getLoadedData();
    if (currentData) {
      // In a real implementation, this would open a policy simulation interface
      console.log('Opening policy simulator with data:', currentData.insights);
      alert('Policy Simulator: Opening modeling tool for enforcement strategy analysis. This would launch an interactive simulation in a real implementation.');
    }
  } else {
    alert('Please wait for data to load before opening the policy simulator.');
  }
};

window.viewRoadmap = function() {
  // In a real implementation, this would show a detailed implementation roadmap
  alert('Implementation Roadmap: Displaying step-by-step guidance for enforcement strategy implementation. This would show a detailed roadmap in a real implementation.');
};

// Initialize everything when DOM is ready
let insightsMain;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing insights main...');
  
  insightsMain = new InsightsMain();
  window.insightsMain = insightsMain;
  
  // Start initialization
  insightsMain.init().then(() => {
    console.log('Insights page ready!');
    
    // Dispatch a global event that the page is ready
    document.dispatchEvent(new CustomEvent('insightsPageReady', {
      detail: { 
        main: insightsMain,
        status: insightsMain.getComponentStatus()
      }
    }));
    
  }).catch(error => {
    console.error('Failed to initialize insights page:', error);
  });
});

// Export for external use
window.InsightsMain = InsightsMain;