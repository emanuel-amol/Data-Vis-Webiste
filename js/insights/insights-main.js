// Main Insights Page Controller
// File: js/insights/insights-main.js

class InsightsMain {
    constructor() {
        this.isInitialized = false;
        this.dashboard = null;
        this.animations = null;
        this.eventListeners = [];
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('Insights main already initialized');
            return;
        }

        try {
            console.log('Initializing Insights page...');

            // Wait for D3 integration to be ready
            await this.waitForD3Integration();
            
            // Setup page-specific functionality
            this.setupActionButtons();
            this.setupInsightToggles();
            this.setupPolicyTools();
            this.setupKeyboardShortcuts();
            
            // Connect to dashboard events
            this.connectToDashboard();
            
            this.isInitialized = true;
            console.log('Insights page initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Insights page:', error);
            this.showErrorState();
        }
    }

    async waitForD3Integration() {
        return new Promise((resolve, reject) => {
            if (window.d3Integration && window.d3Integration.isReady()) {
                this.dashboard = window.d3Integration.getDashboard();
                resolve();
                return;
            }

            // Listen for integration ready event
            const timeout = setTimeout(() => {
                reject(new Error('D3 Integration timeout'));
            }, 10000);

            window.addEventListener('d3IntegrationReady', (event) => {
                clearTimeout(timeout);
                this.dashboard = event.detail.dashboard;
                resolve();
            }, { once: true });
        });
    }

    setupActionButtons() {
        // Executive Report Generation
        const reportBtn = document.getElementById('export-report');
        if (reportBtn) {
            const listener = () => this.generateExecutiveReport();
            reportBtn.addEventListener('click', listener);
            this.eventListeners.push(() => reportBtn.removeEventListener('click', listener));
        }

        // Tool card buttons
        this.setupToolCardButtons();
    }

    setupToolCardButtons() {
        const toolButtons = {
            'generateExecutiveReport': () => this.generateExecutiveReport(),
            'exportDataPackage': () => this.exportDataPackage(),
            'openPolicySimulator': () => this.openPolicySimulator(),
            'viewRoadmap': () => this.viewImplementationRoadmap()
        };

        Object.entries(toolButtons).forEach(([fnName, handler]) => {
            // Find buttons that call this function
            const buttons = document.querySelectorAll(`[onclick*="${fnName}"]`);
            buttons.forEach(btn => {
                // Remove inline onclick and add proper event listener
                btn.removeAttribute('onclick');
                const listener = (e) => {
                    e.preventDefault();
                    handler();
                };
                btn.addEventListener('click', listener);
                this.eventListeners.push(() => btn.removeEventListener('click', listener));
            });
        });
    }

    setupInsightToggles() {
        // Global toggle function for insights
        window.toggleInsight = (triggerElement) => {
            const insightItem = triggerElement.closest('.insight-item');
            const content = insightItem.querySelector('.insight-content');
            const button = insightItem.querySelector('.reveal-trigger');
            
            if (window.insightsAnimations) {
                window.insightsAnimations.toggleInsight(insightItem, content, button);
            }
        };

        // Setup reveal all/hide all functionality
        this.setupBulkInsightControls();
    }

    setupBulkInsightControls() {
        const insightsSection = document.querySelector('.insights-preview');
        if (!insightsSection) return;

        // Add bulk control buttons
        const bulkControls = document.createElement('div');
        bulkControls.className = 'bulk-controls';
        bulkControls.style.cssText = `
            text-align: center; margin-bottom: 30px;
            display: flex; gap: 15px; justify-content: center;
        `;

        const revealAllBtn = document.createElement('button');
        revealAllBtn.textContent = 'Reveal All Insights';
        revealAllBtn.className = 'tool-btn';
        revealAllBtn.style.width = 'auto';

        const hideAllBtn = document.createElement('button');
        hideAllBtn.textContent = 'Hide All Insights';
        hideAllBtn.className = 'export-btn';
        hideAllBtn.style.width = 'auto';

        bulkControls.appendChild(revealAllBtn);
        bulkControls.appendChild(hideAllBtn);

        const revealer = insightsSection.querySelector('.insight-revealer');
        revealer.parentNode.insertBefore(bulkControls, revealer);

        // Event listeners
        const revealAllListener = () => this.revealAllInsights();
        const hideAllListener = () => this.hideAllInsights();

        revealAllBtn.addEventListener('click', revealAllListener);
        hideAllBtn.addEventListener('click', hideAllListener);

        this.eventListeners.push(() => {
            revealAllBtn.removeEventListener('click', revealAllListener);
            hideAllBtn.removeEventListener('click', hideAllListener);
        });
    }

    revealAllInsights() {
        const insightItems = document.querySelectorAll('.insight-item');
        insightItems.forEach((item, index) => {
            setTimeout(() => {
                if (!item.classList.contains('revealed')) {
                    const trigger = item.querySelector('.insight-trigger');
                    if (trigger) trigger.click();
                }
            }, index * 200);
        });
    }

    hideAllInsights() {
        const insightItems = document.querySelectorAll('.insight-item.revealed');
        insightItems.forEach((item, index) => {
            setTimeout(() => {
                const trigger = item.querySelector('.insight-trigger');
                if (trigger) trigger.click();
            }, index * 100);
        });
    }

    setupPolicyTools() {
        // Enhanced policy simulation
        this.setupPolicySimulation();
        
        // Jurisdiction comparison tools
        this.setupJurisdictionComparison();
    }

    setupPolicySimulation() {
        // Create modal for policy simulation
        this.createPolicySimulatorModal();
    }

    createPolicySimulatorModal() {
        const modal = document.createElement('div');
        modal.id = 'policy-simulator-modal';
        modal.style.cssText = `
            display: none; position: fixed; z-index: 1000;
            left: 0; top: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white; margin: 5% auto; padding: 30px;
            border-radius: 16px; width: 80%; max-width: 800px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-height: 80vh; overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: #0C1A3C; margin: 0;">Policy Impact Simulator</h2>
                <button id="close-simulator" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            
            <div class="simulator-content">
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                    <h3 style="color: #374151; margin-bottom: 15px;">Scenario Configuration</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Technology Deployment</label>
                            <select id="tech-level" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                                <option value="none">No Automation</option>
                                <option value="partial">Partial Deployment</option>
                                <option value="full">Full Automation</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Enforcement Intensity</label>
                            <select id="enforcement-level" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                                <option value="low">Low (Current NT level)</option>
                                <option value="medium">Medium (Current SA level)</option>
                                <option value="high">High (Current VIC level)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Target Jurisdiction</label>
                            <select id="target-jurisdiction" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                                <option value="ACT">ACT</option>
                                <option value="NSW">NSW</option>
                                <option value="NT">NT</option>
                                <option value="QLD">QLD</option>
                                <option value="SA">SA</option>
                                <option value="TAS">TAS</option>
                                <option value="VIC">VIC</option>
                                <option value="WA">WA</option>
                            </select>
                        </div>
                    </div>
                    
                    <button id="run-simulation" style="margin-top: 20px; background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Run Simulation
                    </button>
                </div>
                
                <div id="simulation-results" style="display: none;">
                    <h3 style="color: #374151; margin-bottom: 15px;">Projected Outcomes</h3>
                    <div id="results-content"></div>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Setup modal event listeners
        const closeBtn = modal.querySelector('#close-simulator');
        const runBtn = modal.querySelector('#run-simulation');

        const closeListener = () => modal.style.display = 'none';
        const runListener = () => this.runPolicySimulation();

        closeBtn.addEventListener('click', closeListener);
        runBtn.addEventListener('click', runListener);

        // Close on outside click
        const outsideClickListener = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
        modal.addEventListener('click', outsideClickListener);

        this.eventListeners.push(() => {
            closeBtn.removeEventListener('click', closeListener);
            runBtn.removeEventListener('click', runListener);
            modal.removeEventListener('click', outsideClickListener);
        });
    }

    setupJurisdictionComparison() {
        // Add comparison functionality
        console.log('Setting up jurisdiction comparison tools');
    }

    setupKeyboardShortcuts() {
        const keyboardListener = (e) => {
            // Ctrl/Cmd + E: Export report
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.generateExecutiveReport();
            }
            
            // Ctrl/Cmd + S: Open simulator
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.openPolicySimulator();
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                const modal = document.getElementById('policy-simulator-modal');
                if (modal && modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            }
        };

        document.addEventListener('keydown', keyboardListener);
        this.eventListeners.push(() => document.removeEventListener('keydown', keyboardListener));
    }

    connectToDashboard() {
        if (!this.dashboard) return;

        // Listen for jurisdiction selection changes
        window.addEventListener('jurisdictionSelected', (event) => {
            this.handleJurisdictionChange(event.detail.jurisdiction);
        });
    }

    handleJurisdictionChange(jurisdiction) {
        console.log(`Jurisdiction changed to: ${jurisdiction}`);
        
        // Animate jurisdiction highlight
        if (window.insightsAnimations) {
            window.insightsAnimations.highlightJurisdiction(jurisdiction);
        }
    }

    // Action button implementations
    generateExecutiveReport() {
        if (!this.dashboard) {
            this.showNotification('Dashboard not ready. Please wait...', 'warning');
            return;
        }

        try {
            // Use dashboard export functionality
            this.dashboard.exportReport();
            this.showNotification('Executive report generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Failed to generate report. Please try again.', 'error');
        }
    }

    exportDataPackage() {
        this.showNotification('Preparing data package...', 'info');
        
        setTimeout(() => {
            // Simulate data package creation
            const dataPackage = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                description: 'Australian Road Safety Enforcement Data Package',
                contents: [
                    'Raw enforcement data (CSV)',
                    'Processed statistics (JSON)', 
                    'Visualization assets (SVG/PNG)',
                    'Executive summary (PDF)',
                    'Policy recommendations (DOCX)'
                ]
            };

            const blob = new Blob([JSON.stringify(dataPackage, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `road-safety-data-package-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showNotification('Data package exported successfully!', 'success');
        }, 1500);
    }

    openPolicySimulator() {
        const modal = document.getElementById('policy-simulator-modal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            this.showNotification('Policy simulator not available. Please refresh the page.', 'warning');
        }
    }

    runPolicySimulation() {
        const techLevel = document.getElementById('tech-level').value;
        const enforcementLevel = document.getElementById('enforcement-level').value;
        const targetJurisdiction = document.getElementById('target-jurisdiction').value;
        
        // Simulate policy outcomes
        const results = this.calculatePolicyOutcomes(techLevel, enforcementLevel, targetJurisdiction);
        
        const resultsDiv = document.getElementById('simulation-results');
        const resultsContent = document.getElementById('results-content');
        
        resultsContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <div style="font-size: 24px; font-weight: bold; color: #047857;">${results.projectedIncrease}%</div>
                    <div style="color: #065f46;">Projected Enforcement Increase</div>
                </div>
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <div style="font-size: 24px; font-weight: bold; color: #1d4ed8;">${results.estimatedCost}</div>
                    <div style="color: #1e40af;">Implementation Cost</div>
                </div>
                <div style="background: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308;">
                    <div style="font-size: 24px; font-weight: bold; color: #a16207;">${results.timeframe}</div>
                    <div style="color: #92400e;">Implementation Timeline</div>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                <h4 style="color: #374151; margin-bottom: 15px;">Key Recommendations</h4>
                <ul style="color: #4b5563; line-height: 1.6;">
                    ${results.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    calculatePolicyOutcomes(techLevel, enforcementLevel, jurisdiction) {
        // Simplified simulation logic
        const baseMultipliers = {
            tech: { none: 1, partial: 1.5, full: 2.2 },
            enforcement: { low: 1, medium: 1.3, high: 1.8 }
        };
        
        const increase = Math.round((baseMultipliers.tech[techLevel] * baseMultipliers.enforcement[enforcementLevel] - 1) * 100);
        
        const costs = {
            none: '$2M', partial: '$8M', full: '$25M'
        };
        
        const timeframes = {
            none: '6 months', partial: '18 months', full: '3 years'
        };
        
        const recommendations = [
            'Implement phased deployment to minimize disruption',
            'Establish training programs for enforcement personnel',
            'Create public awareness campaigns about new technologies',
            'Set up monitoring systems to track effectiveness'
        ];
        
        if (techLevel === 'full') {
            recommendations.push('Consider partnerships with technology vendors for maintenance');
        }
        
        return {
            projectedIncrease: increase,
            estimatedCost: costs[techLevel],
            timeframe: timeframes[techLevel],
            recommendations
        };
    }

    viewImplementationRoadmap() {
        // Create and show implementation roadmap
        this.showImplementationRoadmap();
    }

    showImplementationRoadmap() {
        const roadmapWindow = window.open('', '_blank', 'width=800,height=600');
        roadmapWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Implementation Roadmap - Road Safety Enforcement</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 30px; line-height: 1.6; }
                    .phase { background: #f8fafc; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
                    .phase h3 { color: #1e40af; margin-top: 0; }
                    .timeline { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
                    .duration { background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
                </style>
            </head>
            <body>
                <h1>Road Safety Enforcement Implementation Roadmap</h1>
                
                <div class="phase">
                    <div class="timeline">
                        <h3>Phase 1: Assessment & Planning</h3>
                        <span class="duration">Months 1-3</span>
                    </div>
                    <ul>
                        <li>Conduct comprehensive baseline assessment</li>
                        <li>Analyze current enforcement capabilities</li>
                        <li>Identify technology gaps and opportunities</li>
                        <li>Develop budget and resource requirements</li>
                    </ul>
                </div>
                
                <div class="phase">
                    <div class="timeline">
                        <h3>Phase 2: Technology Procurement</h3>
                        <span class="duration">Months 4-8</span>
                    </div>
                    <ul>
                        <li>Issue RFPs for automated detection systems</li>
                        <li>Evaluate vendor proposals and capabilities</li>
                        <li>Negotiate contracts and service agreements</li>
                        <li>Begin staff training programs</li>
                    </ul>
                </div>
                
                <div class="phase">
                    <div class="timeline">
                        <h3>Phase 3: Pilot Deployment</h3>
                        <span class="duration">Months 9-12</span>
                    </div>
                    <ul>
                        <li>Deploy systems in selected high-priority areas</li>
                        <li>Monitor performance and adjust operations</li>
                        <li>Gather feedback from enforcement personnel</li>
                        <li>Measure impact on violation detection rates</li>
                    </ul>
                </div>
                
                <div class="phase">
                    <div class="timeline">
                        <h3>Phase 4: Full Rollout</h3>
                        <span class="duration">Months 13-24</span>
                    </div>
                    <ul>
                        <li>Expand deployment based on pilot results</li>
                        <li>Implement comprehensive monitoring systems</li>
                        <li>Launch public awareness campaigns</li>
                        <li>Establish ongoing maintenance protocols</li>
                    </ul>
                </div>
                
                <div class="phase">
                    <div class="timeline">
                        <h3>Phase 5: Optimization & Expansion</h3>
                        <span class="duration">Year 2+</span>
                    </div>
                    <ul>
                        <li>Analyze long-term effectiveness data</li>
                        <li>Identify additional deployment opportunities</li>
                        <li>Share best practices with other jurisdictions</li>
                        <li>Continuously improve processes and technology</li>
                    </ul>
                </div>
                
                <div style="margin-top: 40px; padding: 20px; background: #fef3c7; border-radius: 8px;">
                    <h3 style="color: #92400e;">Critical Success Factors</h3>
                    <ul style="color: #78350f;">
                        <li>Strong executive sponsorship and cross-agency collaboration</li>
                        <li>Adequate funding and resource allocation</li>
                        <li>Comprehensive change management and training</li>
                        <li>Regular monitoring and performance evaluation</li>
                        <li>Stakeholder engagement and public communication</li>
                    </ul>
                </div>
            </body>
            </html>
        `);
        roadmapWindow.document.close();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1001;
            background: ${colors[type]}; color: white; padding: 16px 20px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-weight: 600; max-width: 400px; word-wrap: break-word;
            transform: translateX(100%); transition: transform 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showErrorState() {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
                    <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
                    <h2 style="color: #374151; margin-bottom: 16px;">Unable to Load Dashboard</h2>
                    <p style="margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto;">
                        The interactive dashboard failed to initialize. This may be due to browser compatibility issues or network connectivity problems.
                    </p>
                    <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Retry Loading
                    </button>
                </div>
            `;
        }
    }

    // Cleanup method
    destroy() {
        this.eventListeners.forEach(cleanup => cleanup());
        this.eventListeners = [];
        this.isInitialized = false;
    }
}

// Initialize when DOM is ready
const insightsMain = new InsightsMain();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        insightsMain.initialize();
    });
} else {
    insightsMain.initialize();
}

// Make globally available
window.insightsMain = insightsMain;

// Global function implementations (for compatibility with existing HTML)
window.generateExecutiveReport = () => insightsMain.generateExecutiveReport();
window.exportDataPackage = () => insightsMain.exportDataPackage();
window.openPolicySimulator = () => insightsMain.openPolicySimulator();
window.viewRoadmap = () => insightsMain.viewImplementationRoadmap();