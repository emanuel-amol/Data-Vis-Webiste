// js/insights/insights-animations.js
// Animation utilities for the insights page

class InsightsAnimations {
  constructor() {
    this.observers = new Map();
    this.animationQueues = new Map();
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupIntersectionObservers();
    this.setupScrollAnimations();
    this.initializePageAnimations();
    
    this.isInitialized = true;
    console.log('Insights animations initialized');
  }

  setupIntersectionObservers() {
    // Create intersection observer for animated reveals
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateReveal(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements with animated-reveal class
    document.querySelectorAll('.animated-reveal').forEach(element => {
      revealObserver.observe(element);
    });

    this.observers.set('reveal', revealObserver);
  }

  setupScrollAnimations() {
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-story');
    if (heroSection) {
      window.addEventListener('scroll', this.throttle(() => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        heroSection.style.transform = `translateY(${parallax}px)`;
      }, 16));
    }

    // Progressive disclosure animations
    this.setupProgressiveDisclosureAnimations();
  }

  setupProgressiveDisclosureAnimations() {
    const insightItems = document.querySelectorAll('.insight-item');
    
    insightItems.forEach((item, index) => {
      // Stagger the initial animations
      item.style.opacity = '0';
      item.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }

  initializePageAnimations() {
    // Animate statistics cards
    this.animateStatsCards();
    
    // Animate map elements
    this.animateMapElements();
    
    // Setup hover animations
    this.setupHoverAnimations();
  }

  animateStatsCards() {
    const statsCards = document.querySelectorAll('.interactive-stat');
    
    statsCards.forEach((card, index) => {
      // Initial state
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px) scale(0.9)';
      
      // Animate in with stagger
      setTimeout(() => {
        card.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
        
        // Add floating animation
        setTimeout(() => {
          this.addFloatingAnimation(card, index);
        }, 800);
        
      }, index * 150);
    });
  }

  addFloatingAnimation(element, index) {
    const delay = index * 0.5; // Stagger the floating
    const duration = 3 + (index * 0.3); // Different durations
    
    element.style.animation = `insights-float ${duration}s ease-in-out ${delay}s infinite`;
  }

  animateMapElements() {
    const jurisdictions = document.querySelectorAll('.jurisdiction');
    
    jurisdictions.forEach((jurisdiction, index) => {
      // Initial state
      jurisdiction.style.opacity = '0';
      jurisdiction.style.transform = 'scale(0.5)';
      
      // Animate in with stagger
      setTimeout(() => {
        jurisdiction.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        jurisdiction.style.opacity = '0.7';
        jurisdiction.style.transform = 'scale(1)';
        
        // Add pulse effect
        setTimeout(() => {
          this.addPulseEffect(jurisdiction);
        }, 600);
        
      }, index * 100);
    });
  }

  addPulseEffect(element) {
    const pulseAnimation = () => {
      element.style.transform = 'scale(1.05)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 300);
    };
    
    // Random pulse intervals
    setInterval(pulseAnimation, 3000 + Math.random() * 2000);
  }

  setupHoverAnimations() {
    // Enhanced hover effects for tool cards
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
        
        // Animate icon
        const icon = card.querySelector('.tool-icon');
        if (icon) {
          icon.style.transition = 'transform 0.3s ease';
          icon.style.transform = 'scale(1.2) rotate(5deg)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        
        const icon = card.querySelector('.tool-icon');
        if (icon) {
          icon.style.transform = 'scale(1) rotate(0deg)';
        }
      });
    });

    // Enhanced hover effects for comparison table rows
    const tableRows = document.querySelectorAll('.clickable-row');
    
    tableRows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.transition = 'all 0.2s ease';
        row.style.transform = 'translateX(5px)';
        row.style.backgroundColor = '#f8fafc';
        row.style.borderLeft = '4px solid #3b82f6';
      });
      
      row.addEventListener('mouseleave', () => {
        if (!row.classList.contains('selected')) {
          row.style.transform = 'translateX(0)';
          row.style.backgroundColor = '';
          row.style.borderLeft = '';
        }
      });
    });
  }

  animateReveal(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(40px)';
    element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Trigger animation
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }

  // Counter animation with enhanced easing
  animateCounter(element, start, end, duration = 2000, callback = null) {
    const startTime = performance.now();
    const change = end - start;
    
    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Enhanced easing function (ease-out-back)
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
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
        
        // Add completion effect
        this.addCompletionEffect(element);
        
        if (callback) callback();
      }
    };
    
    requestAnimationFrame(updateValue);
  }

  addCompletionEffect(element) {
    element.style.animation = 'insights-completion-pulse 0.6s ease';
    setTimeout(() => {
      element.style.animation = '';
    }, 600);
  }

  // Reveal insight with advanced animation
  animateInsightReveal(insightElement, duration = 500) {
    const content = insightElement.querySelector('.insight-content');
    if (!content) return;
    
    // Set initial state
    content.style.opacity = '0';
    content.style.transform = 'translateY(-20px) scale(0.95)';
    content.style.maxHeight = '0';
    content.style.overflow = 'hidden';
    content.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    
    // Animate reveal
    requestAnimationFrame(() => {
      content.style.opacity = '1';
      content.style.transform = 'translateY(0) scale(1)';
      content.style.maxHeight = '500px';
      content.style.padding = '30px';
    });
    
    // Add sparkle effect
    this.addSparkleEffect(insightElement);
  }

  animateInsightHide(insightElement, duration = 300) {
    const content = insightElement.querySelector('.insight-content');
    if (!content) return;
    
    content.style.transition = `all ${duration}ms ease-in`;
    content.style.opacity = '0';
    content.style.transform = 'translateY(-20px) scale(0.95)';
    content.style.maxHeight = '0';
    content.style.padding = '0 30px';
  }

  addSparkleEffect(element) {
    const sparkles = [];
    const numSparkles = 6;
    
    for (let i = 0; i < numSparkles; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #fbbf24;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
      `;
      
      element.appendChild(sparkle);
      sparkles.push(sparkle);
      
      // Animate sparkle
      const angle = (i / numSparkles) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      sparkle.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      sparkle.style.transform = `translate(${x}px, ${y}px) scale(0)`;
      sparkle.style.opacity = '0';
      
      setTimeout(() => {
        sparkle.style.transform = `translate(${x}px, ${y}px) scale(1)`;
        sparkle.style.opacity = '1';
        
        setTimeout(() => {
          sparkle.style.opacity = '0';
          sparkle.style.transform = `translate(${x * 1.5}px, ${y * 1.5}px) scale(0)`;
          
          setTimeout(() => {
            sparkle.remove();
          }, 300);
        }, 400);
      }, i * 100);
    }
  }

  // Animate map jurisdiction selection
  animateJurisdictionSelection(element, isSelected) {
    if (isSelected) {
      element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      element.style.transform = 'scale(1.08)';
      element.style.filter = 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) brightness(1.1)';
      
      // Add ripple effect
      this.addRippleEffect(element);
    } else {
      element.style.transform = 'scale(1)';
      element.style.filter = '';
    }
  }

  addRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      border: 2px solid #3b82f6;
      animation: insights-ripple 1s ease-out;
      pointer-events: none;
    `;
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const left = rect.left + rect.width / 2 - size / 2;
    const top = rect.top + rect.height / 2 - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = left + 'px';
    ripple.style.top = top + 'px';
    
    document.body.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 1000);
  }

  // Progress bar animation for loading states
  animateProgressBar(element, targetPercentage, duration = 1000) {
    let currentPercentage = 0;
    const increment = targetPercentage / (duration / 16);
    
    const updateProgress = () => {
      currentPercentage += increment;
      if (currentPercentage >= targetPercentage) {
        currentPercentage = targetPercentage;
      }
      
      element.style.width = currentPercentage + '%';
      
      if (currentPercentage < targetPercentage) {
        requestAnimationFrame(updateProgress);
      }
    };
    
    requestAnimationFrame(updateProgress);
  }

  // Notification animation
  showNotificationWithAnimation(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = 'insights-animated-notification';
    
    // Set up styles
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 10001;
      background: ${colors[type] || colors.info};
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      transform: translateX(400px) rotate(10deg);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 320px;
      backdrop-filter: blur(10px);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0) rotate(0deg)';
      notification.style.opacity = '1';
    });
    
    // Auto remove with animation
    setTimeout(() => {
      notification.style.transform = 'translateX(400px) rotate(-10deg)';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 400);
    }, duration);
    
    return notification;
  }

  // Utility functions
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

  // Cleanup method
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.animationQueues.clear();
  }
}

// Initialize CSS animations if not already present
function initializeInsightsCSS() {
  if (document.getElementById('insights-animations-css')) return;
  
  const style = document.createElement('style');
  style.id = 'insights-animations-css';
  style.textContent = `
    @keyframes insights-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes insights-completion-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); background-color: #10b981; }
      100% { transform: scale(1); }
    }
    
    @keyframes insights-ripple {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    @keyframes insights-sparkle {
      0% { transform: scale(0) rotate(0deg); opacity: 0; }
      50% { transform: scale(1) rotate(180deg); opacity: 1; }
      100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }
    
    @keyframes insights-slide-in {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .animated-reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .animated-reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    
    .insight-item {
      transition: all 0.3s ease;
    }
    
    .insight-item.revealed .insight-content {
      animation: insights-slide-in 0.5s ease-out;
    }
    
    .sparkle {
      animation: insights-sparkle 0.8s ease-out;
    }
    
    /* Enhanced hover states */
    .tool-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .jurisdiction {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .clickable-row {
      transition: all 0.2s ease;
    }
    
    /* Loading animation for buttons */
    .tool-btn:disabled {
      opacity: 0.7;
      transform: scale(0.98);
    }
    
    /* Smooth scroll for page navigation */
    html {
      scroll-behavior: smooth;
    }
    
    /* Focus animations for accessibility */
    .nav-btn:focus,
    .tool-btn:focus,
    .reveal-trigger:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      animation: insights-focus-pulse 0.3s ease;
    }
    
    @keyframes insights-focus-pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      100% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize the animations system
let insightsAnimations;

document.addEventListener('DOMContentLoaded', function() {
  initializeInsightsCSS();
  insightsAnimations = new InsightsAnimations();
  insightsAnimations.init();
  window.insightsAnimations = insightsAnimations;
  console.log('Insights animations system initialized');
});

// Export for use in other modules
window.InsightsAnimations = InsightsAnimations;