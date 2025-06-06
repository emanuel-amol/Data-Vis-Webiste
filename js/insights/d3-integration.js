// js/insights/d3-integration.js
// Integration script that ensures proper loading and coordination of all D3 components

(function() {
  'use strict';
  
  // Integration manager class
  class D3IntegrationManager {
    constructor() {
      this.loadingStates = {
        d3Library: false,
        dataLoader: false,
        mapVisualization: false,
        charts: false,
        dashboard: false
      };
      
      this.components = {};
      this.initializationPromise = null;
      this.isReady = false;
      
      console.log('D3 Integration Manager initialized');
    }

    async initialize() {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }

      this.initializationPromise = this._initializeComponents();
      return this.initializationPromise;
    }

    async _initializeComponents() {
      try {
        console.log('Starting D3 components initialization...');
        
        // Check if D3 is loaded
        await this.waitForD3();
        this.loadingStates.d3Library = true;
        
        // Initialize components in correct order
        await this.initializeDataLoader();
        await this.initializeVisualizations();
        await this.initializeDashboard();
        
        // Setup global event coordination
        this.setupGlobalEventCoordination();
        
        // Setup responsive behavior
        this.setupResponsiveBehavior();
        
        this.isReady = true;
        console.log('All D3 components successfully initialized');
        
        // Dispatch global ready event
        this.dispatchReadyEvent();
        
        return true;
        
      } catch (error) {
        console.error('Failed to initialize D3 components:', error);
        this.handleInitializationError(error);
        throw error;
      }
    }

    async waitForD3() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkD3 = () => {
          attempts++;
          
          if (window.d3) {
            console.log('D3.js library detected');
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('D3.js library not found after 5 seconds'));
          } else {
            setTimeout(checkD3, 100);
          }
        };
        
        checkD3();
      });
    }

    async initializeDataLoader() {
      console.log('Initializing enhanced data loader...');
      
      // Wait for data loader to be available
      await this.waitForComponent('enhancedD3DataLoader');
      
      this.components.dataLoader = window.enhancedD3DataLoader;
      
      // Load initial data
      try {
        await this.components.dataLoader.loadData();
        this.loadingStates.dataLoader = true;
        console.log('Data loader ready with data');
      } catch (error) {
        console.warn('Data loader initialization failed, continuing with sample data:', error);
        this.loadingStates.dataLoader = true;
      }
    }

    async initializeVisualizations() {
      console.log('Initializing visualizations...');
      
      // Initialize map visualization
      await this.initializeMapVisualization();
      
      // Initialize charts
      await this.initializeCharts();
    }

    async initializeMapVisualization() {
      console.log('Initializing map visualization...');
      
      // Check if map container exists
      const mapContainer = document.getElementById('australia-map');
      if (!mapContainer) {
        console.warn('Map container not found, skipping map initialization');
        return;
      }
      
      // Wait for map visualization class to be available
      await this.waitForComponent('ResponsiveD3MapVisualization');
      
      // Create and initialize map
      if (!window.responsiveD3Map) {
        window.responsiveD3Map = new window.ResponsiveD3MapVisualization('australia-map');
        await this.delay(100); // Small delay for DOM readiness
        window.responsiveD3Map.init();
      }
      
      this.components.mapVisualization = window.responsiveD3Map;
      this.loadingStates.mapVisualization = true;
      
      console.log('Map visualization initialized');
    }

    async initializeCharts() {
      console.log('Initializing chart system...');
      
      // Wait for charts class to be available
      await this.waitForComponent('ResponsiveD3Charts');
      
      // Initialize charts system
      if (!window.responsiveD3Charts) {
        window.responsiveD3Charts = new window.ResponsiveD3Charts();
        window.responsiveD3Charts.init();
      }
      
      this.components.charts = window.responsiveD3Charts;
      
      // Initialize dashboard-specific charts
      await this.delay(500); // Wait for data to be ready
      this.components.charts.initializeDashboardCharts();
      
      this.loadingStates.charts = true;
      console.log('Charts system initialized');
    }

    async initializeDashboard() {
      console.log('Initializing dashboard controller...');
      
      // Wait for dashboard controller class
      await this.waitForComponent('ResponsiveD3DashboardController');
      
      // Initialize dashboard controller
      if (!window.responsiveD3Dashboard) {
        window.responsiveD3Dashboard = new window.ResponsiveD3DashboardController();
        await window.responsiveD3Dashboard.init();
      }
      
      this.components.dashboard = window.responsiveD3Dashboard;
      this.loadingStates.dashboard = true;
      
      console.log('Dashboard controller initialized');
    }

    async waitForComponent(componentName) {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait
        
        const checkComponent = () => {
          attempts++;
          
          if (window[componentName]) {
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error(`Component ${componentName} not found after 10 seconds`));
          } else {
            setTimeout(checkComponent, 100);
          }
        };
        
        checkComponent();
      });
    }

    setupGlobalEventCoordination() {
      console.log('Setting up global event coordination...');
      
      // Coordinate between map and dashboard
      document.addEventListener('jurisdictionSelected', (event) => {
        this.handleJurisdictionSelection(event.detail);
      });
      
      // Coordinate filter changes across all components
      document.addEventListener('filtersChanged', (event) => {
        this.handleFilterChanges(event.detail);
      });
      
      // Handle data updates
      document.addEventListener('d3DataReady', (event) => {
        this.handleDataReady(event.detail);
      });
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
    }

    handleJurisdictionSelection(detail) {
      console.log('Global coordination: jurisdiction selected:', detail.jurisdiction);
      
      // Ensure all components are aware of the selection
      if (this.components.dashboard) {
        // Dashboard controller will handle the coordination
      }
      
      // Analytics tracking (in a real app)
      this.trackEvent('jurisdiction_selected', {
        jurisdiction: detail.jurisdiction,
        source: 'map_interaction'
      });
    }

    handleFilterChanges(detail) {
      console.log('Global coordination: filters changed:', detail.filters);
      
      // Track filter usage for UX optimization
      this.trackEvent('filters_changed', detail.filters);
    }

    handleDataReady(detail) {
      console.log('Global coordination: data ready');
      
      // Ensure all components have the latest data
      this.synchronizeComponentData(detail.data);
    }

    synchronizeComponentData(data) {
      // Make sure all components are using the same data
      const components = [
        this.components.mapVisualization,
        this.components.charts,
        this.components.dashboard
      ];
      
      components.forEach(component => {
        if (component && component.updateData) {
          component.updateData(data);
        }
      });
    }

    setupResponsiveBehavior() {
      console.log('Setting up responsive behavior...');
      
      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleResize();
        }, 300);
      });
      
      // Handle orientation change on mobile
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.handleResize();
        }, 500);
      });
      
      // Handle visibility changes (performance optimization)
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange();
      });
    }

    handleResize() {
      console.log('Handling global resize');
      
      // Trigger resize on all components
      Object.values(this.components).forEach(component => {
        if (component && component.resize) {
          component.resize();
        }
      });
      
      // Update responsive layout classes
      this.updateResponsiveClasses();
    }

    updateResponsiveClasses() {
      const viewportWidth = window.innerWidth;
      const body = document.body;
      
      // Remove existing classes
      body.classList.remove('viewport-mobile', 'viewport-tablet', 'viewport-desktop');
      
      // Add appropriate class
      if (viewportWidth < 768) {
        body.classList.add('viewport-mobile');
      } else if (viewportWidth < 1024) {
        body.classList.add('viewport-tablet');
      } else {
        body.classList.add('viewport-desktop');
      }
    }

    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Resume any paused animations or processes
        this.resumeComponents();
      } else {
        // Pause resource-intensive operations
        this.pauseComponents();
      }
    }

    resumeComponents() {
      Object.values(this.components).forEach(component => {
        if (component && component.resume) {
          component.resume();
        }
      });
    }

    pauseComponents() {
      Object.values(this.components).forEach(component => {
        if (component && component.pause) {
          component.pause();
        }
      });
    }

    setupPerformanceMonitoring() {
      // Monitor render performance
      if (window.performance && window.performance.observer) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 16) { // Slower than 60fps
              console.warn('Slow render detected:', entry.name, entry.duration + 'ms');
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['measure'] });
        } catch (error) {
          console.log('Performance observer not supported');
        }
      }
    }

    trackEvent(eventName, data) {
      // In a real application, this would send to analytics
      console.log('Analytics event:', eventName, data);
      
      // Could integrate with Google Analytics, Mixpanel, etc.
      if (window.gtag) {
        window.gtag('event', eventName, data);
      }
    }

    dispatchReadyEvent() {
      const readyEvent = new CustomEvent('d3IntegrationReady', {
        detail: {
          manager: this,
          components: this.components,
          loadingStates: this.loadingStates,
          timestamp: new Date().toISOString()
        }
      });
      
      document.dispatchEvent(readyEvent);
      console.log('D3 Integration ready event dispatched');
    }

    handleInitializationError(error) {
      console.error('D3 Integration initialization failed:', error);
      
      // Show user-friendly error message
      this.showErrorMessage(error);
      
      // Track error for debugging
      this.trackEvent('initialization_error', {
        error: error.message,
        stack: error.stack
      });
    }

    showErrorMessage(error) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fee2e2;
        color: #991b1b;
        padding: 16px 24px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        z-index: 10000;
        max-width: 500px;
        text-align: center;
      `;
      
      errorDiv.innerHTML = `
        <strong>Visualization Error</strong><br>
        Some interactive features may not be available.<br>
        <small>Please refresh the page or contact support if the issue persists.</small>
      `;
      
      document.body.appendChild(errorDiv);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 10000);
    }

    // Utility methods
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public API methods
    getComponentStatus() {
      return {
        ready: this.isReady,
        loadingStates: { ...this.loadingStates },
        componentCount: Object.keys(this.components).length,
        components: Object.keys(this.components)
      };
    }

    getComponent(componentName) {
      return this.components[componentName];
    }

    isComponentReady(componentName) {
      return this.loadingStates[componentName] === true;
    }

    // Demo and development methods
    runSystemDemo() {
      if (!this.isReady) {
        console.warn('System not ready for demo');
        return;
      }
      
      console.log('Running integrated system demo...');
      
      // Run coordinated demo across all components
      const demoSequence = [
        { delay: 1000, action: () => this.highlightDataFlow() },
        { delay: 3000, action: () => this.demonstrateFiltering() },
        { delay: 6000, action: () => this.demonstrateJurisdictionSelection() },
        { delay: 9000, action: () => this.demonstrateChartInteractions() },
        { delay: 12000, action: () => this.resetToInitialState() }
      ];
      
      demoSequence.forEach(({ delay, action }) => {
        setTimeout(action, delay);
      });
    }

    highlightDataFlow() {
      console.log('Demo: Highlighting data flow...');
      
      // Show how data flows from loader to visualizations
      const dataPath = [
        { selector: '.data-loader-indicator', duration: 500 },
        { selector: '#australia-map', duration: 1000 },
        { selector: '.charts-container', duration: 1000 },
        { selector: '.dashboard-controls', duration: 500 }
      ];
      
      dataPath.forEach(({ selector, duration }, index) => {
        setTimeout(() => {
          const element = document.querySelector(selector);
          if (element) {
            this.highlightElement(element, duration);
          }
        }, index * 300);
      });
    }

    demonstrateFiltering() {
      console.log('Demo: Demonstrating filtering...');
      
      if (this.components.dashboard) {
        // Change metric filter
        setTimeout(() => {
          this.components.dashboard.updateFilter('metric', 'per-capita');
        }, 500);
        
        // Change year filter
        setTimeout(() => {
          this.components.dashboard.updateFilter('year', '2021');
        }, 2000);
      }
    }

    demonstrateJurisdictionSelection() {
      console.log('Demo: Demonstrating jurisdiction selection...');
      
      const jurisdictions = ['NSW', 'VIC', 'QLD'];
      
      jurisdictions.forEach((jurisdiction, index) => {
        setTimeout(() => {
          if (this.components.mapVisualization) {
            this.components.mapVisualization.selectJurisdiction(jurisdiction);
          }
        }, index * 1000);
      });
    }

    demonstrateChartInteractions() {
      console.log('Demo: Demonstrating chart interactions...');
      
      if (this.components.dashboard) {
        this.components.dashboard.highlightTopPerformers();
      }
    }

    resetToInitialState() {
      console.log('Demo: Resetting to initial state...');
      
      if (this.components.dashboard) {
        this.components.dashboard.resetDashboard();
      }
    }

    highlightElement(element, duration) {
      const originalStyle = {
        boxShadow: element.style.boxShadow,
        transform: element.style.transform,
        transition: element.style.transition
      };
      
      element.style.transition = 'all 0.3s ease';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
      element.style.transform = 'scale(1.02)';
      
      setTimeout(() => {
        element.style.boxShadow = originalStyle.boxShadow;
        element.style.transform = originalStyle.transform;
        element.style.transition = originalStyle.transition;
      }, duration);
    }

    // Development and debugging methods
    debugComponents() {
      console.group('D3 Integration Debug Info');
      console.log('Ready:', this.isReady);
      console.log('Loading States:', this.loadingStates);
      console.log('Components:', Object.keys(this.components));
      
      Object.entries(this.components).forEach(([name, component]) => {
        console.log(`${name}:`, component);
        if (component && component.getComponentStatus) {
          console.log(`${name} status:`, component.getComponentStatus());
        }
      });
      
      console.groupEnd();
    }

    exportSystemState() {
      return {
        timestamp: new Date().toISOString(),
        ready: this.isReady,
        loadingStates: this.loadingStates,
        componentStatus: this.getComponentStatus(),
        dashboardState: this.components.dashboard ? 
          this.components.dashboard.exportDashboardState() : null,
        mapState: this.components.mapVisualization ? 
          this.components.mapVisualization.exportMapData() : null,
        chartsState: this.components.charts ? 
          this.components.charts.exportChartsData() : null
      };
    }

    // Error recovery methods
    attemptComponentRecovery(componentName) {
      console.log(`Attempting recovery for component: ${componentName}`);
      
      try {
        switch (componentName) {
          case 'dataLoader':
            this.initializeDataLoader();
            break;
          case 'mapVisualization':
            this.initializeMapVisualization();
            break;
          case 'charts':
            this.initializeCharts();
            break;
          case 'dashboard':
            this.initializeDashboard();
            break;
          default:
            console.warn('Unknown component for recovery:', componentName);
        }
      } catch (error) {
        console.error(`Recovery failed for ${componentName}:`, error);
      }
    }

    validateIntegration() {
      const issues = [];
      
      // Check if D3 is available
      if (!window.d3) {
        issues.push('D3.js library not found');
      }
      
      // Check component availability
      const requiredComponents = [
        'enhancedD3DataLoader',
        'responsiveD3Map', 
        'responsiveD3Charts',
        'responsiveD3Dashboard'
      ];
      
      requiredComponents.forEach(component => {
        if (!window[component]) {
          issues.push(`Component missing: ${component}`);
        }
      });
      
      // Check DOM elements
      const requiredElements = [
        '#australia-map',
        '.dashboard-controls',
        '.comparison-table'
      ];
      
      requiredElements.forEach(selector => {
        if (!document.querySelector(selector)) {
          issues.push(`Required element missing: ${selector}`);
        }
      });
      
      if (issues.length > 0) {
        console.warn('Integration validation issues:', issues);
        return { valid: false, issues };
      }
      
      console.log('Integration validation passed');
      return { valid: true, issues: [] };
    }
  }

  // Global instance
  window.d3IntegrationManager = new D3IntegrationManager();

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on insights page
    if (window.location.pathname.includes('insights')) {
      console.log('Starting D3 integration initialization...');
      
      window.d3IntegrationManager.initialize()
        .then(() => {
          console.log('D3 Integration fully ready!');
          
          // Optional: Run demo after initialization
          if (window.location.search.includes('demo=true')) {
            setTimeout(() => {
              window.d3IntegrationManager.runSystemDemo();
            }, 2000);
          }
        })
        .catch(error => {
          console.error('D3 Integration initialization failed:', error);
        });
    }
  });

  // Global functions for developer console access
  window.debugD3 = function() {
    if (window.d3IntegrationManager) {
      window.d3IntegrationManager.debugComponents();
    }
  };

  window.runD3Demo = function() {
    if (window.d3IntegrationManager && window.d3IntegrationManager.isReady) {
      window.d3IntegrationManager.runSystemDemo();
    } else {
      console.warn('D3 Integration not ready yet');
    }
  };

  window.exportD3State = function() {
    if (window.d3IntegrationManager) {
      const state = window.d3IntegrationManager.exportSystemState();
      console.log('D3 System State:', state);
      return state;
    }
  };

  window.validateD3Integration = function() {
    if (window.d3IntegrationManager) {
      return window.d3IntegrationManager.validateIntegration();
    }
  };

  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = D3IntegrationManager;
  }

  // AMD support
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return D3IntegrationManager;
    });
  }

})();

// Add CSS for responsive behavior and loading states
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('d3-integration-styles')) {
    const style = document.createElement('style');
    style.id = 'd3-integration-styles';
    style.textContent = `
      /* Loading states */
      .d3-component-loading {
        opacity: 0.6;
        pointer-events: none;
        position: relative;
      }
      
      .d3-component-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: d3-spin 1s linear infinite;
        z-index: 1000;
      }
      
      @keyframes d3-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Error states */
      .d3-component-error {
        border: 2px dashed #ef4444;
        background: #fef2f2;
        opacity: 0.7;
      }
      
      .d3-component-error::before {
        content: '⚠️ Visualization Error';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #991b1b;
        font-weight: bold;
        z-index: 1000;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr !important;
          gap: 15px;
        }
        
        .comparison-table {
          font-size: 0.8rem;
        }
        
        .stat-card {
          padding: 20px;
        }
        
        .tool-card {
          padding: 20px;
        }
      }
      
      @media (max-width: 480px) {
        .control-panel {
          grid-template-columns: 1fr !important;
        }
        
        .tools-grid {
          grid-template-columns: 1fr !important;
        }
        
        .insights-panel {
          padding: 15px;
        }
      }
      
      /* Focus and accessibility improvements */
      .d3-interactive:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Performance optimizations */
      .d3-component {
        will-change: transform;
        transform: translateZ(0);
      }
      
      /* Smooth transitions for better UX */
      .d3-component,
      .jurisdiction,
      .stat-card,
      .tool-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .jurisdiction {
          stroke-width: 3px !important;
        }
        
        .stat-card,
        .tool-card {
          border: 2px solid #000 !important;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .d3-component,
        .jurisdiction,
        .stat-card,
        .tool-card {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
});

console.log('D3 Integration script loaded and ready');