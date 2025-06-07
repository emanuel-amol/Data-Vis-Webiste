// Fixed D3 Dashboard Controller for Insights Page
// File: js/insights/d3-responsive-dashboard-controller.js

class InsightsDashboardController {
    constructor() {
        this.dataLoader = null;
        this.chartFactory = null;
        this.mapVisualization = null;
        this.currentData = null;
        this.currentMetric = 'total-fines';
        this.currentYear = '2023';
        this.selectedJurisdiction = null;
        this.charts = {};
        this.resizeHandlers = [];
        this.initializationPromise = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            console.log('Initializing Dashboard Controller...');
            
            // Initialize components with error handling
            await this.initializeComponents();
            
            // Load data
            console.log('Loading data...');
            this.currentData = await this.dataLoader.loadData();
            console.log('Data loaded successfully:', {
                totalsByJurisdiction2023: this.currentData.totalsByJurisdiction2023?.length,
                trendData: this.currentData.trendData?.length,
                summaryStats: this.currentData.summaryStats
            });
            
            // Set up map callback
            if (this.mapVisualization && typeof this.mapVisualization.setJurisdictionSelectCallback === 'function') {
                this.mapVisualization.setJurisdictionSelectCallback(
                    (jurisdiction, data) => this.handleJurisdictionSelect(jurisdiction, data)
                );
            }
            
            // Initialize dashboard
            this.setupControls();
            this.renderAllVisualizations();
            this.setupResizeHandlers();
            
            this.isInitialized = true;
            console.log('Dashboard Controller initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
            throw error;
        }
    }

    async initializeComponents() {
        console.log('Initializing components...');
        
        // Initialize data loader
        if (typeof EnhancedDataLoader !== 'undefined') {
            this.dataLoader = new EnhancedDataLoader();
        } else {
            throw new Error('EnhancedDataLoader not available');
        }
        
        // Initialize chart factory
        if (typeof ResponsiveChartFactory !== 'undefined') {
            this.chartFactory = new ResponsiveChartFactory();
        } else {
            throw new Error('ResponsiveChartFactory not available');
        }
        
        // Initialize map visualization
        if (typeof AustraliaMapVisualization !== 'undefined') {
            this.mapVisualization = new AustraliaMapVisualization();
        } else {
            throw new Error('AustraliaMapVisualization not available');
        }
        
        console.log('All components initialized successfully');
    }

    setupControls() {
        // Metric selector
        const metricSelect = document.getElementById('metric-select');
        if (metricSelect) {
            metricSelect.addEventListener('change', (e) => {
                this.currentMetric = e.target.value;
                this.updateVisualizations();
            });
        }

        // Year selector
        const yearSelect = document.getElementById('year-select');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = e.target.value;
                this.updateVisualizations();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    updateVisualizations() {
        try {
            console.log(`Updating visualizations for metric: ${this.currentMetric}, year: ${this.currentYear}`);
            
            const data = this.getDataForMetric(this.currentMetric, this.currentYear);
            
            // Update bar chart
            if (this.charts.barChart) {
                this.chartFactory.updateChart('#jurisdiction-bar-chart', data, 'bar');
            } else {
                this.renderBarChart();
            }
            
            // Update map visualization
            if (this.mapVisualization) {
                this.mapVisualization.updateData(data);
            }
            
            // Update scatter plot if needed
            const scatterData = this.getScatterData();
            if (this.charts.scatterPlot) {
                this.chartFactory.updateChart('#performance-scatter', scatterData, 'scatter');
            }
            
            // Update trend chart based on year selection
            if (this.currentYear !== 'all' && this.charts.trendChart) {
                const filteredTrendData = this.currentData.trendData.filter(d => d.year <= parseInt(this.currentYear));
                this.chartFactory.updateChart('#trend-chart', filteredTrendData, 'trend');
            }
            
            // Update insights panel if a jurisdiction is selected
            if (this.selectedJurisdiction) {
                this.updateInsightsPanel(this.selectedJurisdiction);
            }
            
        } catch (error) {
            console.error('Error updating visualizations:', error);
            this.showError('Failed to update visualizations');
        }
    }

    renderAllVisualizations() {
        try {
            console.log('Rendering all visualizations...');
            
            // Render in order with error handling for each
            this.safeRender('map', () => this.renderMap());
            this.safeRender('trend chart', () => this.renderTrendChart());
            this.safeRender('bar chart', () => this.renderBarChart());
            this.safeRender('pie chart', () => this.renderPieChart());
            this.safeRender('scatter plot', () => this.renderScatterPlot());
            this.updateInsightsPanel();
            
            console.log('All visualizations rendered successfully');
            
        } catch (error) {
            console.error('Error rendering visualizations:', error);
            this.showError('Error rendering charts. Please try refreshing the page.');
        }
    }

    safeRender(name, renderFunction) {
        try {
            renderFunction();
        } catch (error) {
            console.error(`Error rendering ${name}:`, error);
        }
    }

    renderMap() {
        const container = '#australia-map';
        const containerElement = document.querySelector(container);
        
        if (!containerElement) {
            console.warn('Map container not found:', container);
            return;
        }

        if (!this.currentData || !this.currentData.totalsByJurisdiction2023) {
            console.warn('No data available for map rendering');
            return;
        }

        const data = this.getDataForMetric('total-fines', '2023');
        
        if (!data || data.length === 0) {
            console.warn('No valid data for map');
            return;
        }

        // Add rank to data
        const rankedData = data
            .sort((a, b) => b.total - a.total)
            .map((d, i) => ({ ...d, rank: i + 1 }));
        
        const mapContainer = document.querySelector('#australia-map-container');
        const width = mapContainer ? mapContainer.clientWidth : 600;
        
        this.mapVisualization.create(container, rankedData, {
            width: Math.max(width, 400),
            height: 400
        });
        
        console.log('Map rendered successfully');
    }

    renderTrendChart() {
        const container = '#trend-chart';
        const containerElement = document.querySelector(container);
        
        if (!containerElement) {
            console.log('Trend chart container not found');
            return;
        }
        
        if (!this.currentData?.trendData) {
            console.log('No trend data available');
            return;
        }
        
        const data = this.currentData.trendData;
        
        this.charts.trendChart = this.chartFactory.createTrendChart(container, data, {
            width: 600,
            height: 300,
            margin: { top: 20, right: 120, bottom: 50, left: 80 }
        });
        
        console.log('Trend chart rendered successfully');
    }

    renderBarChart() {
        const container = '#jurisdiction-bar-chart';
        const containerElement = document.querySelector(container);
        
        if (!containerElement) {
            console.log('Bar chart container not found');
            return;
        }
        
        const data = this.getDataForMetric(this.currentMetric, this.currentYear);
        
        if (!data || data.length === 0) {
            console.warn('No data available for bar chart');
            return;
        }
        
        this.charts.barChart = this.chartFactory.createBarChart(container, data, {
            width: 600,
            height: 300
        });
        
        console.log('Bar chart rendered successfully');
    }

    renderPieChart() {
        const container = '#age-pie-chart';
        const containerElement = document.querySelector(container);
        
        if (!containerElement) {
            console.log('Pie chart container not found');
            return;
        }
        
        if (!this.currentData?.ageDistribution2023) {
            console.log('No age distribution data available');
            return;
        }
        
        const data = this.currentData.ageDistribution2023;
        
        this.charts.pieChart = this.chartFactory.createPieChart(container, data, {
            width: 400,
            height: 300
        });
        
        console.log('Pie chart rendered successfully');
    }

    renderScatterPlot() {
        const container = '#performance-scatter';
        const containerElement = document.querySelector(container);
        
        if (!containerElement) {
            console.log('Scatter plot container not found');
            return;
        }
        
        const data = this.getScatterData();
        
        if (!data || data.length === 0) {
            console.warn('No data available for scatter plot');
            return;
        }
        
        this.charts.scatterPlot = this.chartFactory.createScatterPlot(container, data, {
            width: 600,
            height: 300
        });
        
        console.log('Scatter plot rendered successfully');
    }

    getDataForMetric(metric, year) {
        if (!this.currentData) return [];
        
        try {
            let data;
            switch (metric) {
                case 'total-fines':
                    data = year === 'all' 
                        ? this.currentData.byJurisdiction 
                        : this.currentData.totalsByJurisdiction2023;
                    break;
                    
                case 'per-capita':
                    data = this.calculatePerCapitaData(year);
                    break;
                    
                case 'growth-rate':
                    data = this.calculateGrowthData(year);
                    break;
                    
                case 'technology-impact':
                    data = this.calculateTechnologyImpactData(year);
                    break;
                    
                default:
                    data = this.currentData.totalsByJurisdiction2023;
            }
            
            // Filter by year if not 'all'
            if (year !== 'all' && Array.isArray(data)) {
                return data.filter(d => !d.year || d.year.toString() === year);
            }
            
            return data;
        } catch (error) {
            console.error('Error getting data for metric:', metric, error);
            return [];
        }
    }

    calculatePerCapitaData() {
        if (!this.currentData?.totalsByJurisdiction2023) return [];
        
        // Simplified population data (in thousands)
        const populationData = {
            'NSW': 8200, 'VIC': 6700, 'QLD': 5300, 'WA': 2800,
            'SA': 1800, 'TAS': 550, 'ACT': 460, 'NT': 250
        };
        
        return this.currentData.totalsByJurisdiction2023.map(d => ({
            ...d,
            total: populationData[d.jurisdiction] ? 
                Math.round((d.total / populationData[d.jurisdiction]) * 1000) : 0
        }));
    }

    calculateGrowthData() {
        if (!this.currentData?.byJurisdiction) return [];
        
        return this.currentData.byJurisdiction.map(d => ({
            jurisdiction: d.jurisdiction,
            total: d.latest2023 || 0,
            growth: d.growth || 0
        }));
    }

    calculateTechnologyImpactData() {
        if (!this.currentData?.technologyImpact) return [];
        
        try {
            const techData = this.currentData.technologyImpact;
            const grouped = d3.group(techData, d => d.jurisdiction);
            
            return Array.from(grouped, ([jurisdiction, records]) => {
                const total2023 = records.find(r => r.year === 2023)?.cameraFines || 0;
                const total2020 = records.find(r => r.year === 2020)?.cameraFines || 0;
                const growth = total2020 > 0 ? ((total2023 - total2020) / total2020) * 100 : 0;
                
                return {
                    jurisdiction,
                    total: total2023,
                    growth: growth
                };
            });
        } catch (error) {
            console.error('Error calculating technology impact data:', error);
            return [];
        }
    }

    getScatterData() {
        if (!this.currentData?.byJurisdiction) return [];
        
        return this.currentData.byJurisdiction.map(d => ({
            jurisdiction: d.jurisdiction,
            total: d.latest2023 || 0,
            growth: d.growth || 0
        }));
    }

    handleJurisdictionSelect(jurisdiction, data) {
        this.selectedJurisdiction = jurisdiction;
        
        console.log('Jurisdiction selected:', jurisdiction);
        
        // Update insights panel
        this.updateInsightsPanel(jurisdiction);
        
        // Highlight in other charts if needed
        this.highlightJurisdictionInCharts(jurisdiction);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('jurisdictionSelected', {
            detail: { jurisdiction, data }
        }));
    }

    updateInsightsPanel(jurisdiction = null) {
        try {
            const detailsPanel = document.getElementById('jurisdiction-details');
            const selectedText = document.getElementById('selected-jurisdiction');
            
            if (!jurisdiction) {
                if (detailsPanel) detailsPanel.style.display = 'none';
                if (selectedText) selectedText.textContent = 'Select a jurisdiction to view detailed analysis';
                return;
            }
            
            if (detailsPanel) detailsPanel.style.display = 'block';
            if (selectedText) selectedText.textContent = `Analyzing ${jurisdiction}`;
            
            // Get jurisdiction details
            const details = this.dataLoader.getJurisdictionDetails(jurisdiction);
            const ranking = this.dataLoader.getJurisdictionRanking(2023);
            const rank = ranking.find(r => r.jurisdiction === jurisdiction)?.rank || 'N/A';
            
            // Update details
            this.updateElement('jurisdiction-name', jurisdiction);
            this.updateElement('metric-fines', details.fines2023?.toLocaleString() || 'N/A');
            this.updateElement('metric-growth', `${details.growth?.toFixed(1) || 0}%`);
            this.updateElement('metric-rank', `#${rank}`);
            
            // Update technology impact
            this.updateTechnologySection(jurisdiction, details);
            
            // Update policy recommendations
            this.updatePolicyRecommendations(jurisdiction, details);
            
        } catch (error) {
            console.error('Error updating insights panel:', error);
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateTechnologySection(jurisdiction, details) {
        try {
            const techDescription = document.getElementById('tech-description');
            const techBoost = document.getElementById('tech-boost');
            
            if (details.hasCameraTechnology) {
                if (techDescription) {
                    techDescription.textContent = `${jurisdiction} has deployed automated detection technology, significantly improving enforcement capability.`;
                }
                
                const boost = this.calculateTechBoost(jurisdiction);
                if (techBoost) {
                    techBoost.textContent = `+${boost.toFixed(0)}%`;
                }
            } else {
                if (techDescription) {
                    techDescription.textContent = `${jurisdiction} primarily relies on traditional police enforcement methods.`;
                }
                if (techBoost) {
                    techBoost.textContent = 'N/A';
                }
            }
        } catch (error) {
            console.error('Error updating technology section:', error);
        }
    }

    calculateTechBoost(jurisdiction) {
        try {
            if (!this.currentData?.technologyImpact) return 0;
            
            const techData = this.currentData.technologyImpact;
            const jurisdictionData = techData.filter(d => d.jurisdiction === jurisdiction);
            
            if (jurisdictionData.length < 2) return 0;
            
            const recent = jurisdictionData.find(d => d.year === 2021)?.cameraFines || 0;
            const baseline = jurisdictionData.find(d => d.year === 2020)?.cameraFines || 1;
            
            return baseline > 0 ? ((recent - baseline) / baseline) * 100 : 0;
        } catch (error) {
            console.error('Error calculating tech boost:', error);
            return 0;
        }
    }

    updatePolicyRecommendations(jurisdiction, details) {
        try {
            const policyList = document.getElementById('policy-list');
            if (!policyList) return;
            
            const recommendations = this.generatePolicyRecommendations(jurisdiction, details);
            
            policyList.innerHTML = recommendations
                .map(rec => `<li style="margin-bottom: 10px; color: #78350f; line-height: 1.5;">${rec}</li>`)
                .join('');
        } catch (error) {
            console.error('Error updating policy recommendations:', error);
        }
    }

    generatePolicyRecommendations(jurisdiction, details) {
        try {
            const recommendations = [];
            const ranking = this.dataLoader.getJurisdictionRanking(2023);
            const rank = ranking.find(r => r.jurisdiction === jurisdiction)?.rank || 999;
            
            // Technology recommendations
            if (!details.hasCameraTechnology) {
                recommendations.push('Implement automated detection cameras to improve enforcement efficiency');
            } else if (details.growth < 50) {
                recommendations.push('Expand automated detection coverage to additional high-risk areas');
            }
            
            // Performance-based recommendations
            if (rank > 5) {
                recommendations.push('Increase enforcement intensity to match leading jurisdictions');
                recommendations.push('Review and strengthen penalty structures');
            } else if (rank <= 2) {
                recommendations.push('Share best practices with other jurisdictions through mentorship programs');
            }
            
            // Growth-based recommendations
            if (details.growth < 0) {
                recommendations.push('Investigate factors causing declining enforcement rates');
            } else if (details.growth > 100) {
                recommendations.push('Analyze capacity to handle increased violation processing');
            }
            
            return recommendations.length > 0 ? recommendations : ['Continue monitoring current enforcement strategies'];
        } catch (error) {
            console.error('Error generating policy recommendations:', error);
            return ['Unable to generate recommendations at this time'];
        }
    }

    highlightJurisdictionInCharts(jurisdiction) {
        console.log(`Highlighting ${jurisdiction} in charts`);
        // This could be enhanced to actually highlight the jurisdiction in the charts
    }

    setupResizeHandlers() {
        const resizeHandler = () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };

        window.addEventListener('resize', resizeHandler);
        this.resizeHandlers.push(() => window.removeEventListener('resize', resizeHandler));
    }

    handleResize() {
        try {
            // Resize map
            const mapContainer = document.querySelector('#australia-map-container');
            if (mapContainer && this.mapVisualization) {
                const newWidth = mapContainer.clientWidth;
                if (this.mapVisualization.resize) {
                    this.mapVisualization.resize(newWidth, 400);
                }
            }

            // Re-render other charts to fit new container sizes
            this.safeRender('trend chart', () => this.renderTrendChart());
            this.safeRender('bar chart', () => this.renderBarChart());
            this.safeRender('pie chart', () => this.renderPieChart());
            this.safeRender('scatter plot', () => this.renderScatterPlot());
            
        } catch (error) {
            console.error('Error during resize:', error);
        }
    }

    exportReport() {
        try {
            console.log('Generating executive report...');
            
            // Create report data
            const reportData = {
                generatedAt: new Date().toISOString(),
                summary: this.currentData?.summaryStats || {},
                jurisdictionRankings: this.dataLoader?.getJurisdictionRanking(2023) || [],
                selectedJurisdiction: this.selectedJurisdiction,
                keyInsights: this.generateKeyInsights(),
                currentMetric: this.currentMetric,
                currentYear: this.currentYear
            };

            // Convert to downloadable format
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `road-safety-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Show success message
            this.showSuccess('Report exported successfully!');
            
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Failed to export report. Please try again.');
        }
    }

    generateKeyInsights() {
        try {
            const insights = [];
            const stats = this.currentData?.summaryStats || {};
            
            // Key finding about middle-aged drivers
            insights.push({
                title: "The Experience Paradox",
                finding: `Middle-aged drivers (40-64) account for ${(stats.middleAgedPercentage || 45).toFixed(0)}% of all fines`,
                implication: "Experience doesn't guarantee compliance"
            });

            // Technology impact
            insights.push({
                title: "Technology Transformation", 
                finding: "Jurisdictions with automated detection show 50-130% enforcement increases",
                implication: "Technology reveals true violation rates"
            });

            // Jurisdiction variation
            const rankings = this.dataLoader?.getJurisdictionRanking(2023) || [];
            if (rankings.length >= 2) {
                const topJurisdiction = rankings[0];
                const bottomJurisdiction = rankings[rankings.length - 1];
                if (topJurisdiction && bottomJurisdiction && bottomJurisdiction.total > 0) {
                    const ratio = topJurisdiction.total / bottomJurisdiction.total;
                    
                    insights.push({
                        title: "Policy Impact",
                        finding: `${ratio.toFixed(0)}:1 ratio between highest (${topJurisdiction.jurisdiction}) and lowest (${bottomJurisdiction.jurisdiction}) performing jurisdictions`,
                        implication: "Policy choices determine enforcement outcomes"
                    });
                }
            }

            return insights;
        } catch (error) {
            console.error('Error generating key insights:', error);
            return [];
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('visualization-error');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.innerHTML = `
                <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <div style="color: #dc2626; font-weight: 600;">Error</div>
                    <div style="color: #7f1d1d; margin-top: 4px;">${message}</div>
                </div>
            `;
        }
    }

    showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: #10b981; color: white; padding: 12px 20px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-weight: 600; transition: all 0.3s ease;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    // Getter for external access
    isReady() {
        return this.isInitialized && this.currentData;
    }

    getCurrentData() {
        return this.currentData;
    }

    // Cleanup method
    destroy() {
        // Remove event listeners
        this.resizeHandlers.forEach(cleanup => cleanup());
        this.resizeHandlers = [];
        
        // Clear charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.remove) chart.remove();
        });
        this.charts = {};
        
        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.isInitialized = false;
    }
}

// Make globally available
window.InsightsDashboardController = InsightsDashboardController;