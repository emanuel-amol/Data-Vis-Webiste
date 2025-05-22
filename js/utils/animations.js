// Advanced Animation Utilities
// Provides smooth animations and transitions for enhanced user experience

class AnimationUtils {
  // Counter animation for statistics
  static animateCounter(element, endValue, duration = 2000, startValue = 0) {
    if (!element) return;
    
    const range = endValue - startValue;
    const minTimer = 50;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = Math.max(stepTime, minTimer);
    
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    
    function run() {
      const now = new Date().getTime();
      const remaining = Math.max((endTime - now) / duration, 0);
      const currentValue = Math.round(endValue - (remaining * range));
      
      if (typeof endValue === 'number' && endValue > 1000) {
        element.textContent = currentValue.toLocaleString();
      } else {
        element.textContent = currentValue;
      }
      
      if (currentValue === endValue) {
        // Animation complete
        element.classList.add('animation-complete');
      } else {
        setTimeout(run, timer);
      }
    }
    
    run();
  }
  
  // Fade in animation with observer
  static fadeInOnScroll(selector, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);
    
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });
  }
  
  // Stagger animation for multiple elements
  static staggerAnimation(elements, animationClass, delay = 100) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add(animationClass);
      }, index * delay);
    });
  }
  
  // Smooth scroll to element
  static smoothScrollTo(target, duration = 1000) {
    const targetElement = typeof target === 'string' ? 
      document.querySelector(target) : target;
    
    if (!targetElement) return;
    
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.offsetTop - 100; // 100px offset
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    requestAnimationFrame(animation.bind(this));
  }
  
  // Easing function
  static easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
  
  // Typewriter effect
  static typeWriter(element, text, speed = 50) {
    if (!element) return;
    
    element.textContent = '';
    let i = 0;
    
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    
    type();
  }
  
  // Pulse animation for attention
  static pulse(element, duration = 1000, iterations = 3) {
    if (!element) return;
    
    element.style.animation = `pulse ${duration}ms ease-in-out ${iterations}`;
    
    setTimeout(() => {
      element.style.animation = '';
    }, duration * iterations);
  }
  
  // Shake animation for errors
  static shake(element, duration = 500) {
    if (!element) return;
    
    element.style.animation = `shake ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  }
  
  // Progressive loading animation
  static progressiveLoad(container, items, delay = 200) {
    if (!container || !items.length) return;
    
    // Hide all items initially
    items.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
    });
    
    // Show items progressively
    items.forEach((item, index) => {
      setTimeout(() => {
        item.style.transition = 'all 0.6s ease-out';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * delay);
    });
  }
  
  // Chart animation utilities
  static animateChart(chartElement, animationType = 'fadeIn') {
    if (!chartElement) return;
    
    switch (animationType) {
      case 'fadeIn':
        chartElement.style.opacity = '0';
        chartElement.style.transition = 'opacity 1s ease-out';
        setTimeout(() => {
          chartElement.style.opacity = '1';
        }, 100);
        break;
        
      case 'slideUp':
        chartElement.style.transform = 'translateY(50px)';
        chartElement.style.opacity = '0';
        chartElement.style.transition = 'all 0.8s ease-out';
        setTimeout(() => {
          chartElement.style.transform = 'translateY(0)';
          chartElement.style.opacity = '1';
        }, 100);
        break;
        
      case 'scale':
        chartElement.style.transform = 'scale(0.8)';
        chartElement.style.opacity = '0';
        chartElement.style.transition = 'all 0.6s ease-out';
        setTimeout(() => {
          chartElement.style.transform = 'scale(1)';
          chartElement.style.opacity = '1';
        }, 100);
        break;
    }
  }
  
  // Loading spinner
  static showLoading(container, message = 'Loading...') {
    if (!container) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-state';
    loadingDiv.innerHTML = `
      <div style="text-align: center;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 15px; color: #666;">${message}</p>
      </div>
    `;
    
    container.appendChild(loadingDiv);
    return loadingDiv;
  }
  
  static hideLoading(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }
  
  // Notification system
  static showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 3000;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    // Set background color based on type
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Slide in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
    
    return notification;
  }
  
  // Hover effects for D3 elements
  static addHoverEffect(selection, options = {}) {
    const defaultOptions = {
      scale: 1.1,
      duration: 200,
      ...options
    };
    
    selection
      .on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(defaultOptions.duration)
          .attr('transform', function() {
            const current = d3.select(this).attr('transform') || '';
            return current + ` scale(${defaultOptions.scale})`;
          })
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(defaultOptions.duration)
          .attr('transform', function() {
            const current = d3.select(this).attr('transform') || '';
            return current.replace(` scale(${defaultOptions.scale})`, '');
          })
          .style('filter', 'none');
      });
  }
  
  // Particle effect for special moments
  static createParticleEffect(container, particleCount = 20) {
    if (!container) return;
    
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #3b82f6;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
      `;
      
      container.appendChild(particle);
      particles.push(particle);
      
      // Animate particle
      const startX = Math.random() * container.offsetWidth;
      const startY = Math.random() * container.offsetHeight;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY - Math.random() * 100;
      
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      
      particle.animate([
        { 
          left: startX + 'px', 
          top: startY + 'px', 
          opacity: 1 
        },
        { 
          left: endX + 'px', 
          top: endY + 'px', 
          opacity: 0 
        }
      ], {
        duration: 2000 + Math.random() * 1000,
        easing: 'ease-out'
      }).addEventListener('finish', () => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }
  }
  
  // Initialize all animations on page load
  static initializePageAnimations() {
    // Fade in elements with the class
    this.fadeInOnScroll('.animated-reveal');
    
    // Animate counters
    document.querySelectorAll('.counter').forEach(counter => {
      const target = parseInt(counter.dataset.target) || 0;
      this.animateCounter(counter, target);
    });
    
    // Progressive load for card grids
    const cardGrids = document.querySelectorAll('.stats-grid, .feature-grid, .insight-cards');
    cardGrids.forEach(grid => {
      const cards = grid.querySelectorAll('.stat-card, .feature-card, .insight-card');
      this.progressiveLoad(grid, Array.from(cards));
    });
  }
}

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .notification {
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    cursor: pointer;
  }
  
  .notification:hover {
    transform: translateX(-5px) !important;
  }
`;
document.head.appendChild(style);

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AnimationUtils.initializePageAnimations();
});

// Export for use in other modules
window.AnimationUtils = AnimationUtils;