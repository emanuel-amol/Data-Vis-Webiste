// Insights Page Animations and Interactions
// File: js/insights/insights-animations.js

class InsightsAnimations {
    constructor() {
        this.animationConfig = {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            stagger: 100
        };
        this.observers = [];
        this.counters = [];
    }

    initialize() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupHoverEffects();
        this.setupInsightRevealers();
        this.setupLoadingStates();
        
        console.log('Insights animations initialized');
    }

    setupScrollAnimations() {
        // Create intersection observer for fade-in animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        // Observe elements that should animate in
        const animateElements = document.querySelectorAll(`
            .stats-dashboard,
            .policy-dashboard,
            .map-section,
            .insights-panel,
            .action-enablement,
            .tool-card,
            .insight-item
        `);

        animateElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity ${this.animationConfig.duration}ms ${this.animationConfig.easing} ${index * this.animationConfig.stagger}ms, transform ${this.animationConfig.duration}ms ${this.animationConfig.easing} ${index * this.animationConfig.stagger}ms`;
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    setupCounterAnimations() {
        const counterElements = document.querySelectorAll('.counter, .key-stat');
        
        const counterObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                        this.animateCounter(entry.target);
                        entry.target.classList.add('counted');
                    }
                });
            },
            { threshold: 0.5 }
        );

        counterElements.forEach(el => {
            counterObserver.observe(el);
        });

        this.observers.push(counterObserver);
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target')) || parseInt(element.textContent.replace(/\D/g, ''));
        const duration = 2000;
        const start = performance.now();
        const startValue = 0;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutQuart for smooth counter animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
            
            // Format the number appropriately
            if (element.textContent.includes('K')) {
                element.textContent = (currentValue / 1000).toFixed(0) + 'K';
            } else if (element.textContent.includes('%')) {
                element.textContent = currentValue + '%';
            } else if (element.textContent.includes('.')) {
                element.textContent = currentValue.toFixed(1) + 'x';
            } else {
                element.textContent = currentValue.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    setupHoverEffects() {
        // Enhanced hover effects for cards
        const cards = document.querySelectorAll('.stat-card, .tool-card, .insight-item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        // Button hover effects
        const buttons = document.querySelectorAll('.tool-btn, .export-btn, .reveal-trigger');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '';
            });
        });
    }

    setupInsightRevealers() {
        const insightItems = document.querySelectorAll('.insight-item');
        
        insightItems.forEach(item => {
            const trigger = item.querySelector('.insight-trigger');
            const content = item.querySelector('.insight-content');
            const button = item.querySelector('.reveal-trigger');
            
            if (trigger && content && button) {
                trigger.addEventListener('click', () => {
                    this.toggleInsight(item, content, button);
                });
            }
        });
    }

    toggleInsight(item, content, button) {
        const isRevealed = item.classList.contains('revealed');
        
        if (isRevealed) {
            // Hide insight
            item.classList.remove('revealed');
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            content.style.paddingTop = '0';
            content.style.paddingBottom = '0';
            button.textContent = 'Click to reveal';
            button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            // Show insight
            item.classList.add('revealed');
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            content.style.paddingTop = '30px';
            content.style.paddingBottom = '30px';
            button.textContent = 'Hide insight';
            button.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
            
            // Smooth scroll to reveal
            setTimeout(() => {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 300);
        }
    }

    setupLoadingStates() {
        // Add loading animations for data-dependent elements
        const loadingElements = document.querySelectorAll('#australia-map, .stats-grid, .dashboard-grid');
        
        loadingElements.forEach(el => {
            el.classList.add('loading-shimmer');
        });

        // Remove loading state when data is ready
        window.addEventListener('d3IntegrationReady', () => {
            setTimeout(() => {
                loadingElements.forEach(el => {
                    el.classList.remove('loading-shimmer');
                    el.classList.add('loaded');
                });
            }, 500);
        });
    }

    // Method to trigger specific animations
    animateElementIn(element, delay = 0) {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }

    // Method to create a pulsing effect for important elements
    pulseElement(element, duration = 2000) {
        element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
    }

    // Method to highlight jurisdiction selection
    highlightJurisdiction(jurisdiction) {
        // Add visual feedback for jurisdiction selection
        const mapContainer = document.querySelector('#australia-map-container');
        if (mapContainer) {
            mapContainer.classList.add('jurisdiction-selected');
            
            // Remove highlight after animation
            setTimeout(() => {
                mapContainer.classList.remove('jurisdiction-selected');
            }, 1000);
        }
    }

    // Method to animate chart transitions
    animateChartTransition(chartContainer) {
        chartContainer.style.opacity = '0.5';
        chartContainer.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            chartContainer.style.opacity = '1';
            chartContainer.style.transform = 'scale(1)';
        }, 300);
    }

    // Cleanup method
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.counters = [];
    }
}

// Add CSS animations
const animationStyles = `
    <style>
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }

        .loading-shimmer {
            position: relative;
            overflow: hidden;
        }

        .loading-shimmer::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shimmer 2s infinite;
            z-index: 1;
        }

        .loaded {
            animation: fadeInScale 0.5s ease-out;
        }

        .jurisdiction-selected::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 3px solid #3b82f6;
            border-radius: 12px;
            animation: selectedPulse 1s ease-out;
            pointer-events: none;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        @keyframes fadeInScale {
            0% {
                opacity: 0;
                transform: scale(0.95);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes selectedPulse {
            0% {
                opacity: 0;
                transform: scale(0.95);
            }
            50% {
                opacity: 1;
                transform: scale(1.02);
            }
            100% {
                opacity: 0;
                transform: scale(1);
            }
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.8;
                transform: scale(1.05);
            }
        }

        /* Enhanced transitions */
        .stat-card, .tool-card, .insight-item {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tool-btn, .export-btn, .reveal-trigger {
            transition: all 0.2s ease;
        }

        .insight-content {
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Chart transition effects */
        #australia-map, #trend-chart, #jurisdiction-bar-chart, #age-pie-chart, #performance-scatter {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
    </style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', animationStyles);

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.insightsAnimations = new InsightsAnimations();
        window.insightsAnimations.initialize();
    });
} else {
    window.insightsAnimations = new InsightsAnimations();
    window.insightsAnimations.initialize();
}

// Make globally available
window.InsightsAnimations = InsightsAnimations;// Insights Page Animations and Interactions
// File: js/insights/insights-animations.js

class InsightsAnimations {
    constructor() {
        this.animationConfig = {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            stagger: 100
        };
        this.observers = [];
        this.counters = [];
    }

    initialize() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupHoverEffects();
        this.setupInsightRevealers();
        this.setupLoadingStates();
        
        console.log('Insights animations initialized');
    }

    setupScrollAnimations() {
        // Create intersection observer for fade-in animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        // Observe elements that should animate in
        const animateElements = document.querySelectorAll(`
            .stats-dashboard,
            .policy-dashboard,
            .map-section,
            .insights-panel,
            .action-enablement,
            .tool-card,
            .insight-item
        `);

        animateElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity ${this.animationConfig.duration}ms ${this.animationConfig.easing} ${index * this.animationConfig.stagger}ms, transform ${this.animationConfig.duration}ms ${this.animationConfig.easing} ${index * this.animationConfig.stagger}ms`;
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    setupCounterAnimations() {
        const counterElements = document.querySelectorAll('.counter, .key-stat');
        
        const counterObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                        this.animateCounter(entry.target);
                        entry.target.classList.add('counted');
                    }
                });
            },
            { threshold: 0.5 }
        );

        counterElements.forEach(el => {
            counterObserver.observe(el);
        });

        this.observers.push(counterObserver);
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target')) || parseInt(element.textContent.replace(/\D/g, ''));
        const duration = 2000;
        const start = performance.now();
        const startValue = 0;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutQuart for smooth counter animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
            
            // Format the number appropriately
            if (element.textContent.includes('K')) {
                element.textContent = (currentValue / 1000).toFixed(0) + 'K';
            } else if (element.textContent.includes('%')) {
                element.textContent = currentValue + '%';
            } else if (element.textContent.includes('.')) {
                element.textContent = currentValue.toFixed(1) + 'x';
            } else {
                element.textContent = currentValue.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    setupHoverEffects() {
        // Enhanced hover effects for cards
        const cards = document.querySelectorAll('.stat-card, .tool-card, .insight-item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });

        // Button hover effects
        const buttons = document.querySelectorAll('.tool-btn, .export-btn, .reveal-trigger');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '';
            });
        });
    }

    setupInsightRevealers() {
        const insightItems = document.querySelectorAll('.insight-item');
        
        insightItems.forEach(item => {
            const trigger = item.querySelector('.insight-trigger');
            const content = item.querySelector('.insight-content');
            const button = item.querySelector('.reveal-trigger');
            
            if (trigger && content && button) {
                trigger.addEventListener('click', () => {
                    this.toggleInsight(item, content, button);
                });
            }
        });
    }

    toggleInsight(item, content, button) {
        const isRevealed = item.classList.contains('revealed');
        
        if (isRevealed) {
            // Hide insight
            item.classList.remove('revealed');
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            content.style.paddingTop = '0';
            content.style.paddingBottom = '0';
            button.textContent = 'Click to reveal';
            button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            // Show insight
            item.classList.add('revealed');
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            content.style.paddingTop = '30px';
            content.style.paddingBottom = '30px';
            button.textContent = 'Hide insight';
            button.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
            
            // Smooth scroll to reveal
            setTimeout(() => {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 300);
        }
    }

    setupLoadingStates() {
        // Add loading animations for data-dependent elements
        const loadingElements = document.querySelectorAll('#australia-map, .stats-grid, .dashboard-grid');
        
        loadingElements.forEach(el => {
            el.classList.add('loading-shimmer');
        });

        // Remove loading state when data is ready
        window.addEventListener('d3IntegrationReady', () => {
            setTimeout(() => {
                loadingElements.forEach(el => {
                    el.classList.remove('loading-shimmer');
                    el.classList.add('loaded');
                });
            }, 500);
        });
    }

    // Method to trigger specific animations
    animateElementIn(element, delay = 0) {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }

    // Method to create a pulsing effect for important elements
    pulseElement(element, duration = 2000) {
        element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
    }

    // Method to highlight jurisdiction selection
    highlightJurisdiction(jurisdiction) {
        // Add visual feedback for jurisdiction selection
        const mapContainer = document.querySelector('#australia-map-container');
        if (mapContainer) {
            mapContainer.classList.add('jurisdiction-selected');
            
            // Remove highlight after animation
            setTimeout(() => {
                mapContainer.classList.remove('jurisdiction-selected');
            }, 1000);
        }
    }

    // Method to animate chart transitions
    animateChartTransition(chartContainer) {
        chartContainer.style.opacity = '0.5';
        chartContainer.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            chartContainer.style.opacity = '1';
            chartContainer.style.transform = 'scale(1)';
        }, 300);
    }

    // Cleanup method
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.counters = [];
    }
}



// Inject styles
document.head.insertAdjacentHTML('beforeend', animationStyles);

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.insightsAnimations = new InsightsAnimations();
        window.insightsAnimations.initialize();
    });
} else {
    window.insightsAnimations = new InsightsAnimations();
    window.insightsAnimations.initialize();
}

// Make globally available
window.InsightsAnimations = InsightsAnimations;