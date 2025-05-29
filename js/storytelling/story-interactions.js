// js/storytelling/story-interactions.js - Create this new file

class StoryInteractions {
  constructor() {
    this.isRevealed = false;
    this.revealedInsights = new Set();
    this.init();
  }

  init() {
    this.setupRevealButton();
    this.setupInsightRevealers();
    this.setupJourneyInteractions();
    this.setupHypothesisCards();
  }

  setupRevealButton() {
    const revealBtn = document.querySelector('.reveal-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => this.revealAnswer());
    }
  }

  revealAnswer() {
    if (this.isRevealed) return;
    
    this.isRevealed = true;
    
    // Animate hypothesis cards
    const cards = document.querySelectorAll('.hypothesis-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('revealed');
        
        // Add sound effect if available
        this.playRevealSound();
        
        // Trigger confetti for correct answer
        if (card.dataset.correct === 'true') {
          setTimeout(() => this.triggerConfetti(card), 500);
        }
      }, index * 300);
    });

    // Show data revelation section
    setTimeout(() => {
      const revelation = document.getElementById('data-revelation');
      const counter = document.getElementById('counter-display');
      
      if (revelation && counter) {
        revelation.style.display = 'block';
        
        // Animate counter
        this.animateCounter(counter, 604750, 2000);
        
        // Update reveal button
        const revealBtn = document.querySelector('.reveal-btn');
        if (revealBtn) {
          revealBtn.textContent = 'Explore the Full Story Below';
          revealBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          
          // Scroll to next section when clicked again
          revealBtn.onclick = () => {
            document.querySelector('.scrollytelling-container')?.scrollIntoView({ 
              behavior: 'smooth' 
            });
          };
        }
      }
    }, 1200);
  }

  animateCounter(element, endValue, duration) {
    const startValue = 0;
    const range = endValue - startValue;
    const startTime = performance.now();
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + range * easeOutCubic);
      
      element.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = endValue.toLocaleString();
        element.style.textShadow = '0 0 20px rgba(245, 158, 11, 0.8)';
      }
    };
    
    requestAnimationFrame(updateCounter);
  }

  setupInsightRevealers() {
    const revealTriggers = document.querySelectorAll('.reveal-trigger');
    
    revealTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const insightItem = trigger.closest('.insight-item');
        const insightId = insightItem.dataset.reveal;
        
        if (this.revealedInsights.has(insightId)) {
          // Hide insight
          this.hideInsight(insightItem, insightId);
        } else {
          // Reveal insight
          this.revealInsight(insightItem, insightId);
        }
      });
    });
  }

  revealInsight(insightItem, insightId) {
    insightItem.classList.add('revealed');
    this.revealedInsights.add(insightId);
    
    // Animate the reveal
    const content = insightItem.querySelector('.insight-content');
    setTimeout(() => {
      content.style.opacity = '0';
      content.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        content.style.transition = 'all 0.5s ease';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      }, 100);
    }, 100);

    // Track analytics if available
    this.trackInsightRevealed(insightId);
  }

  hideInsight(insightItem, insightId) {
    insightItem.classList.remove('revealed');
    this.revealedInsights.delete(insightId);
  }

  setupJourneyInteractions() {
    const journeySteps = document.querySelectorAll('.journey-step');
    
    journeySteps.forEach(step => {
      step.addEventListener('click', () => {
        const journey = step.dataset.journey;
        this.navigateToJourney(journey);
      });
      
      // Add hover effects
      step.addEventListener('mouseenter', () => {
        this.previewJourney(step);
      });
      
      step.addEventListener('mouseleave', () => {
        this.hideJourneyPreview();
      });
    });
  }

  navigateToJourney(journey) {
    const routes = {
      'trends': 'pages/time-trends.html',
      'geography': 'pages/jurisdictions.html',
      'demographics': 'pages/age-analysis.html',
      'insights': 'pages/insights.html'
    };
    
    if (routes[journey]) {
      // Add transition effect
      document.body.style.transition = 'opacity 0.3s ease';
      document.body.style.opacity = '0.7';
      
      setTimeout(() => {
        window.location.href = routes[journey];
      }, 300);
    }
  }

  previewJourney(step) {
    // Create preview tooltip
    const preview = document.createElement('div');
    preview.className = 'journey-preview';
    preview.innerHTML = this.getJourneyPreviewContent(step.dataset.journey);
    
    document.body.appendChild(preview);
    
    // Position preview
    const rect = step.getBoundingClientRect();
    preview.style.left = `${rect.left + rect.width / 2}px`;
    preview.style.top = `${rect.top - 10}px`;
    preview.style.transform = 'translateX(-50%) translateY(-100%)';
  }

  hideJourneyPreview() {
    const preview = document.querySelector('.journey-preview');
    if (preview) {
      preview.remove();
    }
  }

  getJourneyPreviewContent(journey) {
    const previews = {
      'trends': '📊 See the dramatic 37% spike in 2021 and discover what caused it',
      'geography': '🗺️ NSW and Victoria lead with surprising enforcement patterns',
      'demographics': '👥 Why middle-aged drivers top the violation charts',
      'insights': '💡 Three key findings that challenge conventional wisdom'
    };
    
    return `<div class="preview-content">${previews[journey] || 'Explore this section'}</div>`;
  }

  setupHypothesisCards() {
    const cards = document.querySelectorAll('.hypothesis-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (!this.isRevealed) {
          card.style.transform = 'translateY(-5px) scale(1.02)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        if (!this.isRevealed) {
          card.style.transform = 'translateY(0) scale(1)';
        }
      });
    });
  }

  triggerConfetti(element) {
    // Simple confetti effect
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        this.createConfettiPiece(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          colors[Math.floor(Math.random() * colors.length)]
        );
      }, i * 20);
    }
  }

  createConfettiPiece(x, y, color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: ${color};
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 10000;
      border-radius: 2px;
    `;
    
    document.body.appendChild(confetti);
    
    // Animate confetti
    const angle = Math.random() * Math.PI * 2;
    const velocity = 5 + Math.random() * 10;
    const gravity = 0.5;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity;
    let posX = x;
    let posY = y;
    
    const animate = () => {
      posX += vx;
      posY += vy;
      vy += gravity;
      
      confetti.style.left = posX + 'px';
      confetti.style.top = posY + 'px';
      confetti.style.transform = `rotate(${posX}deg)`;
      
      if (posY < window.innerHeight + 100) {
        requestAnimationFrame(animate);
      } else {
        confetti.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }

  playRevealSound() {
    // Create a simple audio context for sound effects
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        // Fallback - no sound
        console.log('Audio not available');
      }
    }
  }

  trackInsightRevealed(insightId) {
    // Analytics tracking if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'insight_revealed', {
        'custom_parameter': insightId
      });
    }
  }

  // Method to reset all interactions (useful for testing)
  reset() {
    this.isRevealed = false;
    this.revealedInsights.clear();
    
    document.querySelectorAll('.hypothesis-card').forEach(card => {
      card.classList.remove('revealed');
    });
    
    document.querySelectorAll('.insight-item').forEach(item => {
      item.classList.remove('revealed');
    });
    
    const revelation = document.getElementById('data-revelation');
    if (revelation) {
      revelation.style.display = 'none';
    }
  }
}

// CSS for dynamic elements
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .journey-preview {
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    max-width: 250px;
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    animation: fadeInPreview 0.3s ease forwards;
  }
  
  @keyframes fadeInPreview {
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(-100%) translateY(-10px);
    }
  }
  
  .journey-preview::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px 5px 0;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
  }
`;
document.head.appendChild(styleSheet);

// Initialize story interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.storyInteractions = new StoryInteractions();
});

// Export for external use
window.StoryInteractions = StoryInteractions;