// js/storytelling/enhanced-chart-interactions.js - Create this new file

class EnhancedChartInteractions {
  constructor() {
    this.activeChart = null;
    this.tooltips = new Map();
    this.annotations = new Map();
    this.transitionDuration = 750;
    
    this.init();
  }

  init() {
    this.setupGlobalTooltip();
    this.setupKeyboardNavigation();
    this.setupChartLinking();
    this.setupContextualHelp();
  }

  setupGlobalTooltip() {
    // Create enhanced tooltip system
    this.globalTooltip = d3.select('body')
      .append('div')
      .attr('class', 'enhanced-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '15px 20px')
      .style('border-radius', '12px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('max-width', '320px')
      .style('box-shadow', '0 8px 25px rgba(0,0,0,0.3)')
      .style('backdrop-filter', 'blur(10px)')
      .style('z-index', 2000);
  }

  enhanceChart(chartElement, options = {}) {
    const {
      type = 'default',
      data = null,
      insights = [],
      comparisons = [],
      annotations = []
    } = options;

    // Add progressive disclosure
    this.addProgressiveDisclosure(chartElement, insights);
    
    // Add contextual annotations
    this.addContextualAnnotations(chartElement, annotations);
    
    // Add comparison mode
    this.addComparisonMode(chartElement, comparisons);
    
    // Add insight highlights
    this.addInsightHighlights(chartElement, insights);
    
    return this;
  }

  addProgressiveDisclosure(chartElement, insights) {
    if (!insights.length) return;

    const controlsContainer = d3.select(chartElement)
      .append('div')
      .attr('class', 'chart-disclosure-controls')
      .style('margin-top', '20px')
      .style('text-align', 'center');

    insights.forEach((insight, index) => {
      const button = controlsContainer
        .append('button')
        .attr('class', 'disclosure-btn')
        .attr('data-insight', index)
        .style('margin', '0 8px')
        .style('padding', '10px 16px')
        .style('background', '#f3f4f6')
        .style('border', '2px solid #e5e7eb')
        .style('border-radius', '8px')
        .style('cursor', 'pointer')
        .style('transition', 'all 0.3s ease')
        .text(insight.title);

      button.on('click', () => this.revealInsight(chartElement, index, insight));
      
      button.on('mouseenter', function() {
        d3.select(this)
          .style('background', '#e5e7eb')
          .style('border-color', '#3b82f6');
      });
      
      button.on('mouseleave', function() {
        d3.select(this)
          .style('background', '#f3f4f6')
          .style('border-color', '#e5e7eb');
      });
    });
  }

  revealInsight(chartElement, index, insight) {
    // Highlight relevant chart elements
    const svg = d3.select(chartElement).select('svg');
    
    // Remove previous highlights
    svg.selectAll('.insight-highlight').remove();
    
    // Add new highlights based on insight data
    if (insight.highlightElements) {
      insight.highlightElements.forEach(element => {
        svg.selectAll(element.selector)
          .classed('insight-highlight', true)
          .transition()
          .duration(this.transitionDuration)
          .style('stroke', '#f59e0b')
          .style('stroke-width', '3px')
          .style('filter', 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))');
      });
    }

    // Show insight explanation
    this.showInsightExplanation(chartElement, insight);
    
    // Update button states
    d3.select(chartElement)
      .selectAll('.disclosure-btn')
      .style('background', '#f3f4f6')
      .style('border-color', '#e5e7eb');
      
    d3.select(chartElement)
      .select(`[data-insight="${index}"]`)
      .style('background', '#3b82f6')
      .style('border-color', '#1d4ed8')
      .style('color', 'white');
  }

  showInsightExplanation(chartElement, insight) {
    // Remove existing explanation
    d3.select(chartElement).select('.insight-explanation').remove();
    
    const explanation = d3.select(chartElement)
      .append('div')
      .attr('class', 'insight-explanation')
      .style('margin-top', '20px')
      .style('padding', '20px')
      .style('background', 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)')
      .style('border-radius', '12px')
      .style('border-left', '5px solid #f59e0b')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)');

    explanation.append('h4')
      .style('color', '#92400e')
      .style('margin-bottom', '10px')
      .text(insight.title);

    explanation.append('p')
      .style('color', '#451a03')
      .style('line-height', '1.6')
      .style('margin', '0')
      .text(insight.explanation);

    if (insight.dataPoint) {
      explanation.append('div')
        .attr('class', 'insight-data-point')
        .style('margin-top', '15px')
        .style('padding', '10px')
        .style('background', 'rgba(146, 64, 14, 0.1)')
        .style('border-radius', '6px')
        .html(`<strong>Key Data:</strong> ${insight.dataPoint}`);
    }

    // Animate in
    explanation.transition()
      .duration(500)
      .style('opacity', '1')
      .style('transform', 'translateY(0)');
  }

  addContextualAnnotations(chartElement, annotations) {
    if (!annotations.length) return;

    const svg = d3.select(chartElement).select('svg');
    const annotationGroup = svg.append('g').attr('class', 'contextual-annotations');

    annotations.forEach((annotation, index) => {
      this.createSmartAnnotation(annotationGroup, annotation, index);
    });
  }

  createSmartAnnotation(group, annotation, index) {
    const annotationContainer = group.append('g')
      .attr('class', `annotation-${index}`)
      .style('opacity', 0);

    // Create annotation line
    if (annotation.line) {
      annotationContainer.append('line')
        .attr('x1', annotation.line.x1)
        .attr('y1', annotation.line.y1)
        .attr('x2', annotation.line.x2)
        .attr('y2', annotation.line.y2)
        .attr('stroke', annotation.color || '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');
    }

    // Create annotation text background
    const textBg = annotationContainer.append('rect')
      .attr('x', annotation.x - 5)
      .attr('y', annotation.y - 20)
      .attr('rx', 6)
      .attr('fill', annotation.color || '#f59e0b')
      .attr('opacity', 0.9);

    // Create annotation text
    const text = annotationContainer.append('text')
      .attr('x', annotation.x)
      .attr('y', annotation.y - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(annotation.text);

    // Adjust background size to text
    const textBBox = text.node().getBBox();
    textBg
      .attr('x', textBBox.x - 8)
      .attr('y', textBBox.y - 4)
      .attr('width', textBBox.width + 16)
      .attr('height', textBBox.height + 8);

    // Modify the animation and event handling
    annotationContainer
      .style("cursor", "pointer")
      .on("click", () => {
        if (annotation.onClick) {
          annotation.onClick(annotation);
        } else {
          this.showAnnotationDetail(annotation);
        }
      })
      .transition()
      .duration(600)
      .style("opacity", 1);

    return annotationContainer;
  }

  showAnnotationDetail(annotation) {
    this.globalTooltip
      .style('visibility', 'visible')
      .html(`
        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 10px; padding-bottom: 8px;">
          <strong>${annotation.title || 'Annotation'}</strong>
        </div>
        <p style="margin: 0; line-height: 1.5;">${annotation.detail || annotation.text}</p>
        ${annotation.significance ? `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);"><em>Significance: ${annotation.significance}</em></div>` : ''}
      `);

    // Position tooltip near annotation
    this.globalTooltip
      .style('left', `${annotation.x + 20}px`)
      .style('top', `${annotation.y - 50}px`);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.globalTooltip.style('visibility', 'hidden');
    }, 5000);
  }

  addComparisonMode(chartElement, comparisons) {
    if (!comparisons.length) return;

    const controlsContainer = d3.select(chartElement)
      .append('div')
      .attr('class', 'comparison-controls')
      .style('margin-top', '15px')
      .style('text-align', 'center');

    controlsContainer.append('label')
      .style('margin-right', '10px')
      .style('font-weight', '600')
      .text('Compare: ');

    const select = controlsContainer.append('select')
      .attr('class', 'comparison-select')
      .style('padding', '8px 12px')
      .style('border', '2px solid #e5e7eb')
      .style('border-radius', '6px')
      .style('background', 'white')
      .style('cursor', 'pointer');

    select.append('option')
      .attr('value', '')
      .text('Select comparison...');

    comparisons.forEach((comparison, index) => {
      select.append('option')
        .attr('value', index)
        .text(comparison.title);
    });

    select.on('change', function() {
      const selectedIndex = this.value;
      if (selectedIndex !== '') {
        const comparison = comparisons[selectedIndex];
        this.executeComparison(chartElement, comparison);
      } else {
        this.clearComparison(chartElement);
      }
    }.bind(this));
  }

  executeComparison(chartElement, comparison) {
    const svg = d3.select(chartElement).select('svg');
    
    // Clear previous comparisons
    svg.selectAll('.comparison-highlight').remove();
    
    // Apply comparison highlighting
    if (comparison.highlightA) {
      svg.selectAll(comparison.highlightA.selector)
        .classed('comparison-highlight', true)
        .transition()
        .duration(this.transitionDuration)
        .style('fill', comparison.highlightA.color || '#3b82f6')
        .style('stroke', comparison.highlightA.color || '#3b82f6')
        .style('stroke-width', '3px');
    }

    if (comparison.highlightB) {
      svg.selectAll(comparison.highlightB.selector)
        .classed('comparison-highlight', true)
        .transition()
        .duration(this.transitionDuration)
        .style('fill', comparison.highlightB.color || '#ef4444')
        .style('stroke', comparison.highlightB.color || '#ef4444')
        .style('stroke-width', '3px');
    }

    // Show comparison results
    this.showComparisonResults(chartElement, comparison);
  }

  showComparisonResults(chartElement, comparison) {
    // Remove existing results
    d3.select(chartElement).select('.comparison-results').remove();
    
    const results = d3.select(chartElement)
      .append('div')
      .attr('class', 'comparison-results')
      .style('margin-top', '20px')
      .style('padding', '20px')
      .style('background', '#f8fafc')
      .style('border-radius', '12px')
      .style('border', '2px solid #e2e8f0');

    results.append('h4')
      .style('color', '#1e293b')
      .style('margin-bottom', '15px')
      .text(`Comparison: ${comparison.title}`);

    if (comparison.metrics) {
      const metricsContainer = results.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
        .style('gap', '15px');

      comparison.metrics.forEach(metric => {
        const metricCard = metricsContainer.append('div')
          .style('background', 'white')
          .style('padding', '15px')
          .style('border-radius', '8px')
          .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)');

        metricCard.append('div')
          .style('font-size', '1.5rem')
          .style('font-weight', '700')
          .style('color', metric.color || '#3b82f6')
          .text(metric.value);

        metricCard.append('div')
          .style('font-size', '0.9rem')
          .style('color', '#64748b')
          .text(metric.label);
      });
    }

    if (comparison.conclusion) {
      results.append('p')
        .style('margin-top', '15px')
        .style('padding', '12px')
        .style('background', 'rgba(59, 130, 246, 0.1)')
        .style('border-radius', '6px')
        .style('color', '#1e40af')
        .style('font-weight', '600')
        .text(comparison.conclusion);
    }
  }

  clearComparison(chartElement) {
    const svg = d3.select(chartElement).select('svg');
    
    // Remove comparison highlights
    svg.selectAll('.comparison-highlight')
      .classed('comparison-highlight', false)
      .transition()
      .duration(this.transitionDuration)
      .style('fill', null)
      .style('stroke', null)
      .style('stroke-width', null);

    // Remove comparison results
    d3.select(chartElement).select('.comparison-results').remove();
  }

  addInsightHighlights(chartElement, insights) {
    // Add subtle visual cues for available insights
    const svg = d3.select(chartElement).select('svg');
    
    insights.forEach((insight, index) => {
      if (insight.hintElements) {
        insight.hintElements.forEach(hint => {
          // Add pulsing indicator
          const indicator = svg.append('circle')
            .attr('class', 'insight-hint')
            .attr('cx', hint.x)
            .attr('cy', hint.y)
            .attr('r', 4)
            .attr('fill', '#f59e0b')
            .attr('opacity', 0.7)
            .style('cursor', 'pointer');

          // Pulsing animation
          indicator
            .transition()
            .duration(2000)
            .attr('r', 8)
            .attr('opacity', 0.3)
            .transition()
            .duration(2000)
            .attr('r', 4)
            .attr('opacity', 0.7)
            .on('end', function repeat() {
              d3.select(this)
                .transition()
                .duration(2000)
                .attr('r', 8)
                .attr('opacity', 0.3)
                .transition()
                .duration(2000)
                .attr('r', 4)
                .attr('opacity', 0.7)
                .on('end', repeat);
            });

          // Click to reveal insight
          indicator.on('click', () => {
            this.revealInsight(chartElement, index, insight);
          });
        });
      }
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (event.target.closest('.enhanced-chart')) {
        this.handleKeyboardNavigation(event);
      }
    });
  }

  handleKeyboardNavigation(event) {
    switch (event.key) {
      case 'i':
      case 'I':
        // Toggle insights
        event.preventDefault();
        this.toggleInsights();
        break;
      case 'c':
      case 'C':
        // Toggle comparisons
        event.preventDefault();
        this.toggleComparisons();
        break;
      case 'h':
      case 'H':
        // Show help
        event.preventDefault();
        this.showKeyboardHelp();
        break;
      case 'Escape':
        // Clear all overlays
        event.preventDefault();
        this.clearAllOverlays();
        break;
    }
  }

  setupChartLinking() {
    // Enable cross-chart highlighting and filtering
    document.addEventListener('chartInteraction', (event) => {
      const { sourceChart, interactionType, data } = event.detail;
      this.propagateChartInteraction(sourceChart, interactionType, data);
    });
  }

  propagateChartInteraction(sourceChart, interactionType, data) {
    // Find related charts and update them
    const allCharts = document.querySelectorAll('.enhanced-chart');
    
    allCharts.forEach(chart => {
      if (chart !== sourceChart) {
        this.updateLinkedChart(chart, interactionType, data);
      }
    });
  }

  updateLinkedChart(chart, interactionType, data) {
    // Update linked charts based on interaction
    const svg = d3.select(chart).select('svg');
    
    switch (interactionType) {
      case 'highlight':
        // Highlight related elements
        svg.selectAll(`[data-category="${data.category}"]`)
          .style('opacity', 1)
          .style('stroke', '#f59e0b')
          .style('stroke-width', '2px');
        
        svg.selectAll(`:not([data-category="${data.category}"])`)
          .style('opacity', 0.3);
        break;
        
      case 'filter':
        // Filter chart based on selection
        this.filterChart(chart, data.filters);
        break;
        
      case 'reset':
        // Reset chart to default state
        this.resetChart(chart);
        break;
    }
  }

  setupContextualHelp() {
    // Add contextual help system
    document.addEventListener('mouseover', (event) => {
      if (event.target.closest('.chart-element')) {
        this.showContextualHelp(event.target);
      }
    });
    
    document.addEventListener('mouseout', (event) => {
      if (event.target.closest('.chart-element')) {
        this.hideContextualHelp();
      }
    });
  }

  showContextualHelp(element) {
    const helpText = element.getAttribute('data-help');
    if (!helpText) return;

    this.globalTooltip
      .style('visibility', 'visible')
      .html(`
        <div style="font-size: 12px; opacity: 0.8;">💡 Tip</div>
        <div style="margin-top: 5px;">${helpText}</div>
      `);
  }

  hideContextualHelp() {
    this.globalTooltip.style('visibility', 'hidden');
  }

  // Utility methods
  showKeyboardHelp() {
    const helpModal = d3.select('body')
      .append('div')
      .attr('class', 'keyboard-help-modal')
      .style('position', 'fixed')
      .style('top', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('z-index', 9999);

    const helpContent = helpModal.append('div')
      .style('background', 'white')
      .style('padding', '30px')
      .style('border-radius', '12px')
      .style('max-width', '400px');

    helpContent.append('h3')
      .text('Keyboard Shortcuts')
      .style('margin-bottom', '20px');

    const shortcuts = [
      { key: 'I', action: 'Toggle insights' },
      { key: 'C', action: 'Toggle comparisons' },
      { key: 'H', action: 'Show this help' },
      { key: 'ESC', action: 'Clear overlays' }
    ];

    shortcuts.forEach(shortcut => {
      const row = helpContent.append('div')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('margin-bottom', '10px');

      row.append('kbd')
        .text(shortcut.key)
        .style('background', '#f3f4f6')
        .style('padding', '4px 8px')
        .style('border-radius', '4px')
        .style('font-family', 'monospace');

      row.append('span')
        .text(shortcut.action);
    });

    helpContent.append('button')
      .text('Close')
      .style('margin-top', '20px')
      .style('padding', '10px 20px')
      .style('background', '#3b82f6')
      .style('color', 'white')
      .style('border', 'none')
      .style('border-radius', '6px')
      .style('cursor', 'pointer')
      .on('click', () => helpModal.remove());

    helpModal.on('click', function(event) {
      if (event.target === this) {
        helpModal.remove();
      }
    });
  }

  clearAllOverlays() {
    // Clear all tooltips, annotations, and highlights
    this.globalTooltip.style('visibility', 'hidden');
    d3.selectAll('.insight-explanation').remove();
    d3.selectAll('.comparison-results').remove();
    d3.selectAll('.insight-highlight').classed('insight-highlight', false);
    d3.selectAll('.comparison-highlight').classed('comparison-highlight', false);
  }

  // Export methods for external use
  getActiveChart() {
    return this.activeChart;
  }

  setActiveChart(chart) {
    this.activeChart = chart;
  }
}

// Initialize enhanced chart interactions
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedChartInteractions = new EnhancedChartInteractions();
});

// Export for external use
window.EnhancedChartInteractions = EnhancedChartInteractions;