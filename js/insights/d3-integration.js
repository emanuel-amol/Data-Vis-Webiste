// Fixed D3 Integration Layer for Insights Page
// File: js/insights/d3-integration.js

class D3IntegrationManager {
    constructor() {
        this.isInitialized = false;
        this.dashboard = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.initializationPromise = null;
    }

    async initialize() {
        // Prevent multiple initialization attempts
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        if (this.isInitialized) {
            console.log('D3 Integration already initialized');
            return;
        }

        try {
            console.log('Starting D3 Integration initialization...');
            
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Check for required dependencies with retries
            await this.checkDependenciesWithRetry();
            
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
            
            return this.dashboard;
            
        } catch (error) {
            console.error('Failed to initialize D3 Integration:', error);
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying initialization (attempt ${this.retryCount}/${this.maxRetries})...`);
                
                // Reset the promise for retry
                this.initializationPromise = null;
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.initialize();
            } else {
                this.showFallbackContent();
                throw error;
            }
        }
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            } else {
                resolve();
            }
        });
    }

    async checkDependenciesWithRetry() {
        const maxAttempts = 5;
        const delayMs = 500;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.checkDependencies();
                return; // Success, exit retry loop
            } catch (error) {
                console.log(`Dependency check attempt ${attempt}/${maxAttempts} failed:`, error.message);
                
                if (attempt === maxAttempts) {
                    throw error; // Final attempt failed
                }
                
                // Wait before next attempt
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    }

    async checkDependencies() {
        console.log('Checking dependencies...');
        
        // Check D3 availability first
        if (typeof d3 === 'undefined') {
            throw new Error('D3.js library not loaded');
        }

        // Check file system API
        if (!window.fs || !window.fs.readFile) {
            throw new Error('File system API not available');
        }

        // Check required classes - load them if they don't exist
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
            console.log('Missing classes:', missing);
            // Try to wait a bit longer for classes to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check again
            const stillMissing = missing.filter(className => !window[className]);
            if (stillMissing.length > 0) {
                throw new Error(`Missing required dependencies: ${stillMissing.join(', ')}`);
            }
        }

        console.log('All dependencies checked successfully');
    }

    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.dashboard) {
                setTimeout(() => {
                    this.dashboard.handleResize();
                }, 100);
            }
        });

        // Handle navigation events
        window.addEventListener('popstate', () => {
            if (this.dashboard) {
                this.dashboard.handleResize();
            }
        });

        // Handle custom events
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
                        <div style="font-weight: 600; margin-bottom: 8px;">Interactive Features Unavailable</div>
                        <div style="font-size: 14px;">Please refresh the page to retry loading</div>
                        <div style="margin-top: 16px;">
                            <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show fallback for other containers
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
                    <div style="display: flex; align-items: center; justify-content: center; height: 200px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb; margin: 10px 0;">
                        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                            Chart loading failed - please refresh the page
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
        console.log('=== Dashboard Debug Information ===');
        console.log('Initialized:', this.isInitialized);
        console.log('Dashboard exists:', !!this.dashboard);
        
        if (this.dashboard) {
            console.log('Current Data:', this.dashboard.currentData);
            console.log('Current Metric:', this.dashboard.currentMetric);
            console.log('Current Year:', this.dashboard.currentYear);
            console.log('Selected Jurisdiction:', this.dashboard.selectedJurisdiction);
            console.log('Charts:', Object.keys(this.dashboard.charts || {}));

            if (this.dashboard.dataLoader) {
                console.log('Data Loader Status:', this.dashboard.dataLoader.isLoaded);
                console.log('Raw Data Records:', this.dashboard.dataLoader.rawData?.length || 0);
            }

            console.log('Map Visualization:', !!this.dashboard.mapVisualization);
            console.log('Chart Factory:', !!this.dashboard.chartFactory);
        }
        
        // Check DOM elements
        console.log('=== DOM Elements ===');
        console.log('Map container:', !!document.querySelector('#australia-map-container'));
        console.log('Australia map:', !!document.querySelector('#australia-map'));
        console.log('Trend chart:', !!document.querySelector('#trend-chart'));
        console.log('Bar chart:', !!document.querySelector('#jurisdiction-bar-chart'));
        
        // Check dependencies
        console.log('=== Dependencies ===');
        console.log('D3:', typeof d3);
        console.log('File API:', !!window.fs);
        console.log('EnhancedDataLoader:', typeof window.EnhancedDataLoader);
        console.log('ResponsiveChartFactory:', typeof window.ResponsiveChartFactory);
        console.log('AustraliaMapVisualization:', typeof window.AustraliaMapVisualization);
        console.log('InsightsDashboardController:', typeof window.InsightsDashboardController);
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

    isReady() {
        return this.isInitialized && this.dashboard;
    }

    async reinitialize() {
        if (this.dashboard) {
            this.dashboard.destroy();
        }
        
        this.isInitialized = false;
        this.retryCount = 0;
        this.initializationPromise = null;
        
        return this.initialize();
    }
}

// Create global instance
window.d3Integration = new D3IntegrationManager();

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.d3Integration.initialize();
    } catch (error) {
        console.error('Failed to auto-initialize D3 integration:', error);
    }
});

// Also try to initialize if DOM is already ready
if (document.readyState !== 'loading') {
    setTimeout(async () => {
        try {
            await window.d3Integration.initialize();
        } catch (error) {
            console.error('Failed to initialize D3 integration:', error);
        }
    }, 100);
}

// Expose utility functions globally
window.debugDashboard = () => window.d3Integration.debugDashboard();
window.selectJurisdiction = (jurisdiction) => window.d3Integration.selectJurisdiction(jurisdiction);
window.updateDashboardMetric = (metric) => window.d3Integration.updateMetric(metric);
window.updateDashboardYear = (year) => window.d3Integration.updateYear(year);
window.exportDashboardData = () => window.d3Integration.exportData();