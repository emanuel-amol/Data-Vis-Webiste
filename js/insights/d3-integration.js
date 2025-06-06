// D3 Integration Layer for Insights Page
// File: js/insights/d3-integration.js

class D3IntegrationManager {
    constructor() {
        this.isInitialized = false;
        this.dashboard = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('D3 Integration already initialized');
            return;
        }

        try {
            console.log('Starting D3 Integration initialization...');
            
            // Check for required dependencies
            await this.checkDependencies();
            
            // Initialize dashboard controller
            this.dashboard = new InsightsDashboardController();
            await this.dashboard.initialize();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;
            console.log('D3 Integration initialized successfully');
            
            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('d3IntegrationReady', {
                detail: { dashboard: this.dashboard }
            }));
            
        } catch (error) {
            console.error('Failed to initialize D3 Integration:', error);
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying initialization (attempt ${this.retryCount}/${this.maxRetries})...`);
                setTimeout(() => this.initialize(), 2000);
            } else {
                this.showFallbackContent();
            }
        }
    }

    async checkDependencies() {
        const requiredClasses = [
            'EnhancedDataLoader',
            'ResponsiveChartFactory', 
            'AustraliaMapVisualization',
            'InsightsDashboardController'
        ];

        const missing = [];
        
        for (const className of requiredClasses) {
            if (!window[className]) {
                missing.push(className);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
        }

        // Check D3 availability
        if (typeof d3 === 'undefined') {
            throw new Error('D3.js library not loaded');
        }

        // Check file system API
        if (!window.fs || !window.fs.readFile) {
            throw new Error('File system API not available');
        }

        console.log('All dependencies checked successfully');
    }

    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.dashboard) {
                // Refresh visualizations when page becomes visible
                setTimeout(() => {
                    this.dashboard.handleResize();
                }, 100);
            }
        });

        // Handle navigation events (if using SPA routing)
        window.addEventListener('popstate', () => {
            if (this.dashboard) {
                this.dashboard.handleResize();
            }
        });

        // Handle custom events from other parts of the application
        window.addEventListener('jurisdictionHighlight', (event) => {
            if (this.dashboard && event.detail.jurisdiction) {
                this.dashboard.handleJurisdictionSelect(event.detail.jurisdiction);
            }
        });

        // Debug event listener
        window.addEventListener('debugDashboard', () => {
            this.debugDashboard();
        });
    }

    showFallbackContent() {
        console.log('Showing fallback content due to initialization failure');
        
        const mapContainer = document.querySelector('#australia-map-container');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #f8fafc; border-radius: 8px; border: 2px dashed #d1d5db;">
                    <div style="text-align: center; color: #6b7280;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                        <div style="font-weight: 600; margin-bottom: 8px;">Interactive Map Unavailable</div>
                        <div style="font-size: 14px;">Data visualization requires modern browser features</div>
                        <div style="margin-top: 16px;">
                            <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                Retry Loading
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show fallback for other chart containers
        const chartContainers = [
            '#trend-chart',
            '#jurisdiction-bar-chart', 
            '#age-pie-chart',
            '#performance-scatter'
        ];

        chartContainers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                container.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 200px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                            Chart unavailable - please refresh the page
                        </div>
                    </div>
                `;
            }
        });

        // Update insights panel
        const insightsPanel = document.querySelector('#selected-jurisdiction');
        if (insightsPanel) {
            insightsPanel.textContent = 'Interactive features unavailable - please refresh the page';
        }
    }

    debugDashboard() {
        if (!this.dashboard) {
            console.log('Dashboard not initialized');
            return;
        }

        console.log('Dashboard Debug Information:');
        console.log('- Initialized:', this.isInitialized);
        console.log('- Current Data:', this.dashboard.currentData);
        console.log('- Current Metric:', this.dashboard.currentMetric);
        console.log('- Current Year:', this.dashboard.currentYear);
        console.log('- Selected Jurisdiction:', this.dashboard.selectedJurisdiction);
        console.log('- Charts:', Object.keys(this.dashboard.charts));

        // Test data loader
        if (this.dashboard.dataLoader) {
            console.log('- Data Loader Status:', this.dashboard.dataLoader.isLoaded);
            console.log('- Raw Data Records:', this.dashboard.dataLoader.rawData?.length || 0);
        }

        // Test visualizations
        console.log('- Map Visualization:', !!this.dashboard.mapVisualization);
        console.log('- Chart Factory:', !!this.dashboard.chartFactory);
    }

    // Public API methods
    getDashboard() {
        return this.dashboard;
    }

    selectJurisdiction(jurisdiction) {
        if (this.dashboard) {
            this.dashboard.handleJurisdictionSelect(jurisdiction);
        }
    }

    updateMetric(metric) {
        if (this.dashboard) {
            this.dashboard.currentMetric = metric;
            this.dashboard.updateVisualizations();
        }
    }

    updateYear(year) {
        if (this.dashboard) {
            this.dashboard.currentYear = year;
            this.dashboard.updateVisualizations();
        }
    }

    exportData() {
        if (this.dashboard) {
            this.dashboard.exportReport();
        }
    }

    // Utility method to check if integration is ready
    isReady() {
        return this.isInitialized && this.dashboard;
    }

    // Method to reinitialize if needed
    async reinitialize() {
        if (this.dashboard) {
            this.dashboard.destroy();
        }
        
        this.isInitialized = false;
        this.retryCount = 0;
        
        await this.initialize();
    }
}

// Create global instance
window.d3Integration = new D3IntegrationManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.d3Integration.initialize();
    });
} else {
    // DOM already loaded
    window.d3Integration.initialize();
}

// Expose useful functions globally for debugging and external use
window.debugDashboard = () => window.d3Integration.debugDashboard();
window.selectJurisdiction = (jurisdiction) => window.d3Integration.selectJurisdiction(jurisdiction);
window.updateDashboardMetric = (metric) => window.d3Integration.updateMetric(metric);
window.updateDashboardYear = (year) => window.d3Integration.updateYear(year);
window.exportDashboardData = () => window.d3Integration.exportData();