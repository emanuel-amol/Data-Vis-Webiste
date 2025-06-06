// js/insights/d3-responsive-map-visualization.js
// Responsive map visualization that updates with data changes

class ResponsiveD3MapVisualization {
  constructor(containerId = 'australia-map') {
    this.containerId = containerId;
    this.svg = null;
    this.tooltip = null;
    this.colorScale = null;
    this.data = null;
    this.selectedJurisdiction = null;
    this.currentMetric = 'totalFines';
    
    // Animation settings
    this.transitionDuration = 750;
    
    // Map dimensions and settings
    this.dimensions = {
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    };
    
    // Jurisdiction shapes (simplified for demo)
    this.jurisdictionShapes = {
      'NSW': { type: 'rect', x: 400, y: 200, width: 150, height: 150 },
      'VIC': { type: 'rect', x: 300, y: 350, width: 150, height: 100 },
      'QLD': { type: 'rect', x: 400, y: 100, width: 200, height: 150 },
      'WA': { type: 'rect', x: 50, y: 150, width: 150, height: 250 },
      'SA': { type: 'rect', x: 250, y: 250, width: 100, height: 150 },
      'TAS': { type: 'rect', x: 350, y: 480, width: 70, height: 40 },
      'NT': { type: 'rect', x: 250, y: 50, width: 150, height: 150 },
      'ACT': { type: 'circle', cx: 480, cy: 320, r: 15 }
    };
    
    this.jurisdictionLabels = {
      'NSW': { x: 475, y: 275 },
      'VIC': { x: 375, y: 400 },
      'QLD': { x: 500, y: 175 },
      'WA': { x: 125, y: 275 },
      'SA': { x: 300, y: 325 },
      'TAS': { x: 385, y: 500 },
      'NT': { x: 325, y: 125 },
      'ACT': { x: 480, y: 325 }
    };
  }

  init() {
    this.setupSVG();
    this.createTooltip();
    this.createColorScale();
    this.subscribeToDataChanges();
    
    console.log('Responsive D3 Map Visualization initialized');
  }

  setupSVG() {
    // Remove existing SVG if any
    d3.select(`#${this.containerId}`).selectAll('*').remove();
    
    this.svg = d3.select(`#${this.containerId}`)
      .attr('width', '100%')
      .attr('height', this.dimensions.height)
      .attr('viewBox', `0 0 ${this.dimensions.width} ${this.dimensions.height}`)
      .style('background', 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)');
    
    // Create main group for map elements
    this.mapGroup = this.svg.append('g')
      .attr('class', 'map-group');
    
    // Create group for jurisdictions
    this.jurisdictionGroup = this.mapGroup.append('g')
      .attr('class', 'jurisdictions');
    
    // Create group for labels
    this.labelGroup = this.mapGroup.append('g')
      .attr('class', 'labels');
  }

  createTooltip() {
    // Remove existing tooltip
    d3.select('.d3-map-tooltip').remove();
    
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'd3-map-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('color', '#fff')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('max-width', '300px')
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.3)')
      .style('z-index', '1010')
      .style('font-family', 'system-ui, -apple-system, sans-serif');
  }

  createColorScale() {
    this.colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues);
  }

  subscribeToDataChanges() {
    // Subscribe to data loader updates
    if (window.enhancedD3DataLoader) {
      window.enhancedD3DataLoader.subscribe('dataLoaded', (data) => {
        this.updateData(data);
      }, 'map-visualization');
      
      window.enhancedD3DataLoader.subscribe('dataFiltered', (data) => {
        this.updateData(data);
      }, 'map-visualization-filter');
    }
    
    // Listen for data ready event
    document.addEventListener('d3DataReady', (event) => {
      this.updateData(event.detail.data);
    });
  }

  updateData(data) {
    this.data = data;
    this.updateColorScale();
    this.renderJurisdictions();
    this.renderLabels();
    
    console.log('Map visualization updated with new data');
  }

  updateColorScale() {
    if (!this.data || !this.data.byJurisdiction) return;
    
    const values = this.data.byJurisdiction.map(d => d[this.currentMetric]);
    const extent = d3.extent(values);
    
    this.colorScale.domain(extent);
  }

  renderJurisdictions() {
    if (!this.data || !this.data.byJurisdiction) return;
    
    // Bind data to jurisdiction elements
    const jurisdictions = this.jurisdictionGroup
      .selectAll('.jurisdiction')
      .data(this.data.byJurisdiction, d => d.jurisdiction);
    
    // Remove old elements
    jurisdictions.exit()
      .transition()
      .duration(this.transitionDuration)
      .style('opacity', 0)
      .remove();
    
    // Add new elements
    const jurisdictionsEnter = jurisdictions.enter()
      .append('g')
      .attr('class', 'jurisdiction')
      .attr('data-jurisdiction', d => d.jurisdiction);
    
    // Add shapes based on jurisdiction type
    jurisdictionsEnter.each((d, i, nodes) => {
      const group = d3.select(nodes[i]);
      const shape = this.jurisdictionShapes[d.jurisdiction];
      
      if (shape.type === 'rect') {
        group.append('rect')
          .attr('x', shape.x)
          .attr('y', shape.y)
          .attr('width', shape.width)
          .attr('height', shape.height);
      } else if (shape.type === 'circle') {
        group.append('circle')
          .attr('cx', shape.cx)
          .attr('cy', shape.cy)
          .attr('r', shape.r);
      }
    });
    
    // Merge enter and update selections
    const jurisdictionsMerged = jurisdictionsEnter.merge(jurisdictions);
    
    // Update styles and interactions
    jurisdictionsMerged
      .style('cursor', 'pointer')
      .on('click', (event, d) => this.selectJurisdiction(d.jurisdiction))
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());
    
    // Update colors with transition
    jurisdictionsMerged.selectAll('rect, circle')
      .transition()
      .duration(this.transitionDuration)
      .style('fill', d => this.colorScale(d[this.currentMetric]))
      .style('stroke', '#1e40af')
      .style('stroke-width', '2px')
      .style('opacity', 0.8);
    
    // Add hover effects
    jurisdictionsMerged
      .on('mouseenter', function(event, d) {
        d3.select(this).selectAll('rect, circle')
          .transition()
          .duration(200)
          .style('opacity', 1)
          .style('transform', 'scale(1.05)')
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
      })
      .on('mouseleave', function(event, d) {
        if (!d3.select(this).classed('selected')) {
          d3.select(this).selectAll('rect, circle')
            .transition()
            .duration(200)
            .style('opacity', 0.8)
            .style('transform', 'scale(1)')
            .style('filter', 'none');
        }
      });
  }

  renderLabels() {
    if (!this.data || !this.data.byJurisdiction) return;
    
    // Bind data to label elements
    const labels = this.labelGroup
      .selectAll('.jurisdiction-label')
      .data(this.data.byJurisdiction, d => d.jurisdiction);
    
    // Remove old labels
    labels.exit()
      .transition()
      .duration(this.transitionDuration)
      .style('opacity', 0)
      .remove();
    
    // Add new labels
    const labelsEnter = labels.enter()
      .append('text')
      .attr('class', 'jurisdiction-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '12px')
      .style('fill', 'white')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
      .style('pointer-events', 'none');
    
    // Merge and update positions
    const labelsMerged = labelsEnter.merge(labels);
    
    labelsMerged
      .attr('x', d => this.jurisdictionLabels[d.jurisdiction].x)
      .attr('y', d => this.jurisdictionLabels[d.jurisdiction].y)
      .text(d => d.jurisdiction)
      .transition()
      .duration(this.transitionDuration)
      .style('opacity', 1);
  }

  selectJurisdiction(jurisdictionCode) {
    this.selectedJurisdiction = jurisdictionCode;
    
    // Update visual selection
    this.jurisdictionGroup.selectAll('.jurisdiction')
      .classed('selected', false)
      .selectAll('rect, circle')
      .transition()
      .duration(300)
      .style('opacity', 0.8)
      .style('transform', 'scale(1)')
      .style('filter', 'none')
      .style('stroke-width', '2px');
    
    // Highlight selected jurisdiction
    const selected = this.jurisdictionGroup
      .selectAll(`.jurisdiction[data-jurisdiction="${jurisdictionCode}"]`)
      .classed('selected', true);
    
    selected.selectAll('rect, circle')
      .transition()
      .duration(300)
      .style('opacity', 1)
      .style('transform', 'scale(1.1)')
      .style('filter', 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))')
      .style('stroke-width', '3px')
      .style('stroke', '#3b82f6');
    
    // Get jurisdiction data
    const jurisdictionData = this.data.byJurisdiction.find(d => d.jurisdiction === jurisdictionCode);
    
    // Dispatch selection event
    document.dispatchEvent(new CustomEvent('jurisdictionSelected', {
      detail: { 
        jurisdiction: jurisdictionCode, 
        data: jurisdictionData 
      }
    }));
    
    console.log('Jurisdiction selected:', jurisdictionCode, jurisdictionData);
  }

  changeMetric(metric) {
    this.currentMetric = metric;
    this.updateColorScale();
    
    // Update colors with smooth transition
    this.jurisdictionGroup.selectAll('.jurisdiction rect, .jurisdiction circle')
      .transition()
      .duration(this.transitionDuration)
      .style('fill', d => this.colorScale(d[this.currentMetric]));
    
    console.log('Map metric changed to:', metric);
  }

  showTooltip(event, d) {
    const formatNumber = d3.format(',');
    const formatPercent = d3.format('.1f');
    
    const tooltipContent = `
      <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
        <strong>${d.jurisdiction}</strong>
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Total Fines:</strong> ${formatNumber(d.totalFines)}
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Per Capita:</strong> ${formatNumber(Math.round(d.perCapita))} per 100k
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Growth Rate:</strong> ${formatPercent(d.growthRate)}%
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Tech Ratio:</strong> ${formatPercent(d.techRatio * 100)}%
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
        Click for detailed analysis
      </div>
    `;
    
    this.tooltip
      .style('visibility', 'visible')
      .html(tooltipContent);
    
    this.moveTooltip(event);
  }

  moveTooltip(event) {
    this.tooltip
      .style('top', (event.pageY - 10) + 'px')
      .style('left', (event.pageX + 15) + 'px');
  }

  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  // Animation methods
  animateJurisdictionPulse(jurisdictionCode) {
    const jurisdiction = this.jurisdictionGroup
      .select(`.jurisdiction[data-jurisdiction="${jurisdictionCode}"]`);
    
    const pulse = () => {
      jurisdiction.selectAll('rect, circle')
        .transition()
        .duration(600)
        .style('transform', 'scale(1.05)')
        .transition()
        .duration(600)
        .style('transform', 'scale(1)');
    };
    
    // Pulse 3 times
    pulse();
    setTimeout(pulse, 1200);
    setTimeout(pulse, 2400);
  }

  highlightTopPerformers(count = 3) {
    if (!this.data || !this.data.byJurisdiction) return;
    
    const topPerformers = [...this.data.byJurisdiction]
      .sort((a, b) => b[this.currentMetric] - a[this.currentMetric])
      .slice(0, count)
      .map(d => d.jurisdiction);
    
    // Dim all jurisdictions
    this.jurisdictionGroup.selectAll('.jurisdiction rect, .jurisdiction circle')
      .transition()
      .duration(500)
      .style('opacity', 0.3);
    
    // Highlight top performers
    topPerformers.forEach((jurisdiction, index) => {
      setTimeout(() => {
        this.jurisdictionGroup
          .select(`.jurisdiction[data-jurisdiction="${jurisdiction}"] rect, .jurisdiction[data-jurisdiction="${jurisdiction}"] circle`)
          .transition()
          .duration(500)
          .style('opacity', 1)
          .style('filter', 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))');
        
        this.animateJurisdictionPulse(jurisdiction);
      }, index * 300);
    });
    
    // Reset after 5 seconds
    setTimeout(() => {
      this.resetHighlighting();
    }, 5000);
  }

  resetHighlighting() {
    this.jurisdictionGroup.selectAll('.jurisdiction rect, .jurisdiction circle')
      .transition()
      .duration(500)
      .style('opacity', 0.8)
      .style('filter', 'none');
  }

  // Zoom and pan functionality
  enableZoomPan() {
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        this.mapGroup.attr('transform', event.transform);
      });
    
    this.svg.call(zoom);
  }

  // Responsive resize
  resize() {
    const container = document.getElementById(this.containerId);
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const aspectRatio = this.dimensions.width / this.dimensions.height;
    const newHeight = containerWidth / aspectRatio;
    
    this.svg
      .attr('width', '100%')
      .attr('height', newHeight)
      .attr('viewBox', `0 0 ${this.dimensions.width} ${this.dimensions.height}`);
  }

  // Legend creation
  createLegend() {
    if (!this.data || !this.colorScale) return;
    
    // Remove existing legend
    this.svg.select('.legend').remove();
    
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = this.dimensions.width - legendWidth - 40;
    const legendY = 40;
    
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);
    
    // Create gradient for legend
    const defs = this.svg.select('defs').empty() ? this.svg.append('defs') : this.svg.select('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient');
    
    const domain = this.colorScale.domain();
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const value = domain[0] + (domain[1] - domain[0]) * (i / steps);
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', this.colorScale(value));
    }
    
    // Legend rectangle
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
      .style('stroke', '#ccc')
      .style('stroke-width', 1);
    
    // Legend labels
    const legendScale = d3.scaleLinear()
      .domain(domain)
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.0s'));
    
    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .style('font-size', '10px');
    
    // Legend title
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(this.getMetricDisplayName(this.currentMetric));
  }

  getMetricDisplayName(metric) {
    const displayNames = {
      totalFines: 'Total Fines',
      perCapita: 'Per Capita Rate',
      growthRate: 'Growth Rate (%)',
      techRatio: 'Technology Ratio'
    };
    return displayNames[metric] || metric;
  }

  // Public API methods
  getSelectedJurisdiction() {
    return this.selectedJurisdiction;
  }

  programmaticSelect(jurisdictionCode) {
    this.selectJurisdiction(jurisdictionCode);
  }

  setMetric(metric) {
    this.changeMetric(metric);
    this.createLegend();
  }

  getCurrentData() {
    return this.data;
  }

  exportMapData() {
    return {
      data: this.data,
      selectedJurisdiction: this.selectedJurisdiction,
      currentMetric: this.currentMetric,
      timestamp: new Date().toISOString()
    };
  }

  // Animation showcase for demo
  runDemoAnimation() {
    console.log('Running map demo animation...');
    
    // Highlight top 3 performers
    setTimeout(() => {
      this.highlightTopPerformers(3);
    }, 1000);
    
    // Change metric after 6 seconds
    setTimeout(() => {
      this.changeMetric('perCapita');
      this.createLegend();
    }, 6000);
    
    // Change back to total fines
    setTimeout(() => {
      this.changeMetric('totalFines');
      this.createLegend();
    }, 10000);
  }
}

// Global event handlers for integration
window.responsiveD3Map = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.getElementById('australia-map');
  if (mapContainer) {
    window.responsiveD3Map = new ResponsiveD3MapVisualization('australia-map');
    window.responsiveD3Map.init();
    
    // Enable zoom/pan
    window.responsiveD3Map.enableZoomPan();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      window.responsiveD3Map.resize();
    });
    
    console.log('Responsive D3 Map Visualization initialized');
  }
});

// Export the class
window.ResponsiveD3MapVisualization = ResponsiveD3MapVisualization;