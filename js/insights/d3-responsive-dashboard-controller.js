// D3 Dashboard Controller for Insights Page
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
    }

    async initialize() {
        try {
            // Initialize components
            this.dataLoader = new EnhancedDataLoader();
            this.chartFactory = new ResponsiveChartFactory();
            this.mapVisualization = new AustraliaMapVisualization();
            
            // Load data
            console.log('Loading data...');
            this.currentData = await this.dataLoader.loadData();
            console.log('Data loaded successfully');
            
            // Set up map callback
            this.mapVisualization.setJurisdictionSelectCallback(
                (jurisdiction, data) => this.handleJurisdictionSelect(jurisdiction, data)
            );
            
            // Initialize dashboard
            this.setupControls();
            this.renderAllVisualizations();
            this.setupResizeHandlers();
            
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
        }
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

    renderAllVisualizations() {
        try {
            this.renderMap();
            this.renderTrendChart();
            this.renderBarChart();
            this.renderPieChart();
            this.renderScatterPlot();
            this.updateInsightsPanel();
            
        } catch (error) {
            console.error('Error rendering visualizations:', error);
            this.showError('Error rendering charts. Please try refreshing the page.');
        }
    }

    renderMap() {
        const container = '#australia-map';
        const data = this.getDataForMetric('total-fines', '2023');
        
        // Add rank to data
        const rankedData = data
            .sort((a, b) => b.total - a.total)
            .map((d, i) => ({ ...d, rank: i + 1 }));
        
        this.mapVisualization.create(container, rankedData, {
            width: document.querySelector('#australia-map-container').clientWidth,
            height: 400
        });
    }

    renderTrendChart() {
        const container = '#trend-chart';
        if (!document.querySelector(container)) return;
        
        const data = this.currentData.trendData;
        
        this.charts.trendChart = this.chartFactory.createTrendChart(container, data, {
            width: 600,
            height: 300,
            margin: { top: 20, right: 120, bottom: 50, left: 80 }
        });
    }

    renderBarChart() {
        const container = '#jurisdiction-bar-chart';
        if (!document.querySelector(container)) return;
        
        const data = this.getDataForMetric(this.currentMetric, this.currentYear);
        
        this.charts.barChart = this.chartFactory.createBarChart(container, data, {
            width: 600,
            height: 300
        });
    }

    renderPieChart() {
        const container = '#age-pie-chart';
        if (!document.querySelector(container)) return;
        
        const data = this.currentData.ageDistribution2023;
        
        this.charts.pieChart = this.chartFactory.createPieChart(container, data, {
            width: 400,
            height: 300
        });
    }

    renderScatterPlot() {
        const container = '#performance-scatter';
        if (!document.querySelector(container)) return;
        
        const data = this.getScatterData();
        
        this.charts.scatterPlot = this.chartFactory.createScatterPlot(container, data, {
            width: 600,
            height: 300
        });
    }

    getDataForMetric(metric, year) {
        if (!this.currentData) return [];
        
        switch (metric) {
            case 'total-fines':
                return this.currentData.totalsByJurisdiction2023;
            case 'per-capita':
                return this.calculatePerCapitaData();
            case 'growth-rate':
                return this.calculateGrowthData();
            case 'technology-impact':
                return this.calculateTechnologyImpactData();
            default:
                return this.currentData.totalsByJurisdiction2023;
        }
    }

    calculatePerCapitaData() {
        // Simplified population data (in thousands) - would normally come from external source
        const populationData = {
            'NSW': 8200, 'VIC': 6700, 'QLD': 5300, 'WA': 2800,
            'SA': 1800, 'TAS': 550, 'ACT': 460, 'NT': 250
        };
        
        return this.currentData.totalsByJurisdiction2023.map(d => ({
            ...d,
            total: populationData[d.jurisdiction] ? 
                (d.total / populationData[d.jurisdiction]) * 1000 : 0
        }));
    }

    calculateGrowthData() {
        return this.currentData.byJurisdiction.map(d => ({
            jurisdiction: d.jurisdiction,
            total: d.latest2023,
            growth: d.growth
        }));
    }

    calculateTechnologyImpactData() {
        // Calculate technology deployment impact
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
    }

    getScatterData() {
        return this.currentData.byJurisdiction.map(d => ({
            jurisdiction: d.jurisdiction,
            total: d.latest2023,
            growth: d.growth
        }));
    }

    handleJurisdictionSelect(jurisdiction, data) {
        this.selectedJurisdiction = jurisdiction;
        
        console.log('Jurisdiction selected:', jurisdiction);
        
        // Update insights panel
        this.updateInsightsPanel(jurisdiction);
        
        // Highlight in other charts if needed
        this.highlightJurisdictionInCharts(jurisdiction);
    }

    updateInsightsPanel(jurisdiction = null) {
        const detailsPanel = document.getElementById('jurisdiction-details');
        const selectedText = document.getElementById('selected-jurisdiction');
        
        if (!jurisdiction) {
            detailsPanel.style.display = 'none';
            selectedText.textContent = 'Select a jurisdiction to view detailed analysis';
            return;
        }
        
        detailsPanel.style.display = 'block';
        selectedText.textContent = `Analyzing ${jurisdiction}`;
        
        // Get jurisdiction details
        const details = this.dataLoader.getJurisdictionDetails(jurisdiction);
        const ranking = this.dataLoader.getJurisdictionRanking(2023);
        const rank = ranking.find(r => r.jurisdiction === jurisdiction)?.rank || 'N/A';
        
        // Update details
        document.getElementById('jurisdiction-name').textContent = jurisdiction;
        document.getElementById('metric-fines').textContent = details.fines2023.toLocaleString();
        document.getElementById('metric-growth').textContent = `${details.growth.toFixed(1)}%`;
        document.getElementById('metric-rank').textContent = `#${rank}`;
        
        // Update technology impact
        this.updateTechnologySection(jurisdiction, details);
        
        // Update policy recommendations
        this.updatePolicyRecommendations(jurisdiction, details);
    }

    updateTechnologySection(jurisdiction, details) {
        const techDescription = document.getElementById('tech-description');
        const techBoost = document.getElementById('tech-boost');
        
        if (details.hasCameraTechnology) {
            techDescription.textContent = `${jurisdiction} has deployed automated detection technology, significantly improving enforcement capability.`;
            
            // Calculate tech boost from data
            const boost = this.calculateTechBoost(jurisdiction);
            techBoost.textContent = `+${boost.toFixed(0)}%`;
        } else {
            techDescription.textContent = `${jurisdiction} primarily relies on traditional police enforcement methods.`;
            techBoost.textContent = 'N/A';
        }
    }

    calculateTechBoost(jurisdiction) {
        const techData = this.currentData.technologyImpact;
        const jurisdictionData = techData.filter(d => d.jurisdiction === jurisdiction);
        
        if (jurisdictionData.length < 2) return 0;
        
        const recent = jurisdictionData.find(d => d.year === 2021)?.cameraFines || 0;
        const baseline = jurisdictionData.find(d => d.year === 2020)?.cameraFines || 1;
        
        return baseline > 0 ? ((recent - baseline) / baseline) * 100 : 0;
    }

    updatePolicyRecommendations(jurisdiction, details) {
        const policyList = document.getElementById('policy-list');
        const recommendations = this.generatePolicyRecommendations(jurisdiction, details);
        
        policyList.innerHTML = recommendations
            .map(rec => `<li style="margin-bottom: 10px; color: #78350f; line-height: 1.5;">${rec}</li>`)
            .join('');
    }

    generatePolicyRecommendations(jurisdiction, details) {
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
        
        return recommendations;
    }

    highlightJurisdictionInCharts(jurisdiction) {
        // Add highlighting logic for other charts
        console.log(`Highlighting ${jurisdiction} in charts`);
    }

    updateVisualizations() {
        console.log(`Updating visualizations for metric: ${this.currentMetric}, year: ${this.currentYear}`);
        
        // Re-render charts that depend on current selections
        this.renderBarChart();
        
        // Update map if metric changed
        if (this.currentMetric !== 'total-fines') {
            this.renderMap();
        }
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
                this.mapVisualization.resize(newWidth, 400);
            }

            // Re-render other charts to fit new container sizes
            this.renderTrendChart();
            this.renderBarChart();
            this.renderPieChart();
            this.renderScatterPlot();
            
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
                summary: this.currentData.summaryStats,
                jurisdictionRankings: this.dataLoader.getJurisdictionRanking(2023),
                selectedJurisdiction: this.selectedJurisdiction,
                keyInsights: this.generateKeyInsights()
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
        const insights = [];
        const stats = this.currentData.summaryStats;
        
        // Key finding about middle-aged drivers
        insights.push({
            title: "The Experience Paradox",
            finding: `Middle-aged drivers (40-64) account for ${stats.middleAgedPercentage.toFixed(0)}% of all fines`,
            implication: "Experience doesn't guarantee compliance"
        });

        // Technology impact
        const techJurisdictions = ['NSW', 'QLD', 'VIC', 'TAS'];
        insights.push({
            title: "Technology Transformation", 
            finding: "Jurisdictions with automated detection show 50-130% enforcement increases",
            implication: "Technology reveals true violation rates"
        });

        // Jurisdiction variation
        const rankings = this.dataLoader.getJurisdictionRanking(2023);
        const topJurisdiction = rankings[0];
        const bottomJurisdiction = rankings[rankings.length - 1];
        const ratio = topJurisdiction.total / bottomJurisdiction.total;
        
        insights.push({
            title: "Policy Impact",
            finding: `${ratio.toFixed(0)}:1 ratio between highest (${topJurisdiction.jurisdiction}) and lowest (${bottomJurisdiction.jurisdiction}) performing jurisdictions`,
            implication: "Policy choices determine enforcement outcomes"
        });

        return insights;
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
            setTimeout(() => document.body.removeChild(successDiv), 300);
        }, 3000);
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
    }
}

// Make globally available
window.InsightsDashboardController = InsightsDashboardController;