// js/insights/insights-map-visualization.js
// Interactive map visualization for the insights page

class InsightsMapVisualization {
  constructor() {
    this.data = null;
    this.svg = null;
    this.selectedJurisdiction = null;
    this.tooltip = null;
    this.isInitialized = false;
    
    // Colors for different performance levels
    this.colors = {
      'veryHigh': '#1e40af',  // NSW level
      'high': '#7c3aed',      // VIC level  
      'medium': '#059669',    // QLD/WA level
      'low': '#4b5563'        // Others
    };

    // Jurisdiction coordinates and shapes for better map
    this.jurisdictionShapes = {
      'NSW': { 
        type: 'rect', 
        x: 400, y: 200, width: 150, height: 150,
        textX: 475, textY: 275
      },
      'VIC': { 
        type: 'rect', 
        x: 300, y: 350, width: 150, height: 100,
        textX: 375, textY: 400
      },
      'QLD': { 
        type: 'rect', 
        x: 400, y: 100, width: 200, height: 150,
        textX: 500, textY: 175
      },
      'WA': { 
        type: 'rect', 
        x: 50, y: 150, width: 150, height: 250,
        textX: 125, textY: 275
      },
      'SA': { 
        type: 'rect', 
        x: 250, y: 250, width: 100, height: 150,
        textX: 300, textY: 325
      },
      'TAS': { 
        type: 'rect', 
        x: 350, y: 480, width: 70, height: 40,
        textX: 385, textY: 500
      },
      'NT': { 
        type: 'rect', 
        x: 250, y: 50, width: 150, height: 150,
        textX: 325, textY: 125
      },
      'ACT': { 
        type: 'circle', 
        cx: 480, cy: 320, r: 15,
        textX: 480, textY: 325
      }
    };
  }

  init() {
    if (this.isInitialized) return;
    
    this.createTooltip();
    this.setupMapInteractivity();
    this.loadData();
    
    this.isInitialized = true;
    console.log('Insights map visualization initialized');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'insights-map-tooltip')
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
      .style('z-index', 1010);
  }

  setupMapInteractivity() {
    // Get the SVG element
    this.svg = d3.select('#australia-map');
    
    // Add interactive behavior to existing map elements
    this.svg.selectAll('.jurisdiction')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const jurisdiction = event.target.getAttribute('data-jurisdiction');
        this.selectJurisdiction(jurisdiction);
      })
      .on('mouseover', (event, d) => {
        const element = event.target;
        const jurisdiction = element.getAttribute('data-jurisdiction');
        
        // Visual feedback
        d3.select(element)
          .transition()
          .duration(200)
          .style('opacity', '1')
          .style('transform', 'scale(1.05)');
        
        this.showTooltip(event, jurisdiction);
      })
      .on('mousemove', (event) => {
        this.moveTooltip(event);
      })
      .on('mouseout', (event, d) => {
        const element = event.target;
        
        // Reset visual state if not selected
        if (!element.classList.contains('selected')) {
          d3.select(element)
            .transition()
            .duration(200)
            .style('opacity', '0.7')
            .style('transform', 'scale(1)');
        }
        
        this.hideTooltip();
      });
  }

  loadData() {
    if (window.insightsData && window.insightsData.jurisdictions) {
      this.data = window.insightsData;
      this.updateMapColors();
    } else {
      document.addEventListener('insightsDataReady', (event) => {
        this.data = event.detail.data;
        this.updateMapColors();
      });
    }
  }

  updateMapColors() {
    if (!this.data) return;
    
    console.log('Updating map colors with data:', this.data.jurisdictions);
    
    // Update map colors and data attributes based on actual data
    Object.entries(this.data.jurisdictions).forEach(([jurisdiction, data]) => {
      const element = this.svg.select(`#${jurisdiction}`);
      
      if (!element.empty()) {
        // Determine color based on performance
        let color = this.colors.low;
        if (data.totalFines > 1000000) color = this.colors.veryHigh;
        else if (data.totalFines > 500000) color = this.colors.high;
        else if (data.totalFines > 200000) color = this.colors.medium;
        
        // Update element attributes
        element
          .attr('data-fines', data.totalFines)
          .attr('data-growth', Math.round(data.growthRate))
          .attr('data-rank', data.rank)
          .attr('data-per-capita', Math.round(data.perCapita))
          .style('fill', color);
      }
    });
  }

  selectJurisdiction(jurisdictionCode) {
    if (!this.data || !this.data.jurisdictions[jurisdictionCode]) return;
    
    this.selectedJurisdiction = jurisdictionCode;
    const jurisdictionData = window.insightsDataLoader.getJurisdictionDetails(jurisdictionCode);
    const recommendations = window.insightsDataLoader.getPolicyRecommendations(jurisdictionCode);
    
    console.log('Selected jurisdiction:', jurisdictionCode, jurisdictionData);
    
    // Update visual selection
    this.svg.selectAll('.jurisdiction')
      .classed('selected', false)
      .style('opacity', '0.7')
      .style('transform', 'scale(1)');
    
    this.svg.select(`#${jurisdictionCode}`)
      .classed('selected', true)
      .style('opacity', '1')
      .style('transform', 'scale(1.05)')
      .style('filter', 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))');
    
    // Update insights panel
    this.updateInsightsPanel(jurisdictionData, recommendations);
    
    // Update table selection
    d3.selectAll('.clickable-row')
      .classed('selected', false);
    d3.select(`[data-jurisdiction="${jurisdictionCode}"]`)
      .classed('selected', true);
    
    // Trigger custom event for other components
    document.dispatchEvent(new CustomEvent('jurisdictionSelected', {
      detail: { 
        jurisdiction: jurisdictionCode, 
        data: jurisdictionData,
        recommendations: recommendations
      }
    }));
  }

  updateInsightsPanel(jurisdictionData, recommendations) {
    // Show the insights panel
    const insightsPanel = document.getElementById('jurisdiction-details');
    const selectedText = document.getElementById('selected-jurisdiction');
    
    if (selectedText) {
      selectedText.textContent = `Analysis for ${jurisdictionData.name}`;
    }
    
    if (insightsPanel) {
      insightsPanel.style.display = 'block';
    }
    
    // Update jurisdiction details
    this.updateElement('jurisdiction-name', jurisdictionData.name);
    this.updateElement('metric-fines', jurisdictionData.totalFines.toLocaleString());
    this.updateElement('metric-growth', `+${jurisdictionData.growthRate.toFixed(1)}%`);
    this.updateElement('metric-rank', `${jurisdictionData.rank}${this.getOrdinalSuffix(jurisdictionData.rank)}`);
    
    // Update technology impact
    const techDescription = this.getTechnologyDescription(jurisdictionData);
    this.updateElement('tech-description', techDescription);
    this.updateElement('tech-boost', `+${jurisdictionData.growthRate.toFixed(1)}%`);
    
    // Update age breakdown (using sample data for now)
    this.updateAgeBreakdown(jurisdictionData.code);
    
    // Update policy recommendations
    this.updatePolicyRecommendations(recommendations);
    
    // Scroll to insights panel
    const insightsPanelElement = document.querySelector('.insights-panel');
    if (insightsPanelElement) {
      insightsPanelElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }

  updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }

  updateAgeBreakdown(jurisdictionCode) {
    // Calculate age breakdown for the selected jurisdiction
    if (!this.data || !this.data.raw) return;
    
    const jurisdictionRecords = this.data.raw.filter(d => d.JURISDICTION === jurisdictionCode);
    const ageGroupTotals = {};
    
    jurisdictionRecords.forEach(record => {
      const ageGroup = record.AGE_GROUP;
      if (!ageGroupTotals[ageGroup]) {
        ageGroupTotals[ageGroup] = 0;
      }
      ageGroupTotals[ageGroup] += record.FINES;
    });
    
    const totalFines = Object.values(ageGroupTotals).reduce((sum, val) => sum + val, 0);
    
    // Update age group percentages
    const ageMapping = {
      '40-64': 'age-40-64',
      '26-39': 'age-26-39',
      '17-25': 'age-17-25'
    };
    
    Object.entries(ageMapping).forEach(([ageGroup, elementId]) => {
      const fines = ageGroupTotals[ageGroup] || 0;
      const percentage = totalFines > 0 ? ((fines / totalFines) * 100).toFixed(1) : 0;
      this.updateElement(elementId, `${percentage}%`);
    });
  }

  updatePolicyRecommendations(recommendations) {
    const policyList = document.getElementById('policy-list');
    if (policyList && recommendations) {
      policyList.innerHTML = '';
      recommendations.forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        policyList.appendChild(li);
      });
    }
  }

  getTechnologyDescription(data) {
    if (data.growthRate > 100) {
      return 'Pioneer in mobile phone detection technology deployment. Revolutionary camera network implemented 2019-2021.';
    } else if (data.growthRate > 40) {
      return 'Consistent leader with systematic camera deployment strategy. Maintained highest per-capita rates.';
    } else if (data.growthRate > 20) {
      return 'Steady growth with balanced urban-regional deployment. Sustainable development approach.';
    } else if (data.growthRate > 10) {
      return 'Moderate technology adoption. Opportunity for significant improvement with enhanced systems.';
    } else {
      return 'Limited technology deployment. Significant opportunity for modernization and improvement.';
    }
  }

  getOrdinalSuffix(number) {
    const j = number % 10;
    const k = number % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  showTooltip(event, jurisdictionCode) {
    if (!this.data || !this.data.jurisdictions[jurisdictionCode]) return;
    
    const data = this.data.jurisdictions[jurisdictionCode];
    const jurisdictionDetails = window.insightsDataLoader.getJurisdictionDetails(jurisdictionCode);
    
    this.tooltip
      .style('visibility', 'visible')
      .html(`
        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
          <strong>${jurisdictionDetails.name}</strong>
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Total Fines:</strong> ${data.totalFines.toLocaleString()}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Growth Rate:</strong> +${data.growthRate.toFixed(1)}%
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Per Capita:</strong> ${data.perCapita.toFixed(0)} per 100k
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Ranking:</strong> #${data.rank} nationally
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
          <strong>Technology Score:</strong> ${data.techScore}<br>
          Click to view detailed analysis
        </div>
      `);
  }

  moveTooltip(event) {
    this.tooltip
      .style('top', (event.pageY - 10) + 'px')
      .style('left', (event.pageX + 15) + 'px');
  }

  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  // Method to update data and refresh visualization
  updateData(newData) {
    this.data = newData;
    this.updateMapColors();
  }

  // Method to highlight specific jurisdictions
  highlightJurisdictions(jurisdictionCodes) {
    this.svg.selectAll('.jurisdiction')
      .style('opacity', d => {
        const jurisdiction = d3.select(d).attr('data-jurisdiction');
        return jurisdictionCodes.includes(jurisdiction) ? '1' : '0.3';
      });
  }

  // Method to reset all highlighting
  resetHighlighting() {
    this.svg.selectAll('.jurisdiction')
      .style('opacity', '0.7');
  }

  // Method to get current selection
  getSelectedJurisdiction() {
    return this.selectedJurisdiction;
  }

  // Method to programmatically select a jurisdiction
  programmaticSelect(jurisdictionCode) {
    this.selectJurisdiction(jurisdictionCode);
  }
}

// Initialize the map visualization
let insightsMapVisualization;

document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.getElementById('australia-map');
  if (mapContainer) {
    insightsMapVisualization = new InsightsMapVisualization();
    insightsMapVisualization.init();
    window.insightsMapVisualization = insightsMapVisualization;
    console.log('Insights map visualization initialized');
  }
});

// Export for use in other modules
window.InsightsMapVisualization = InsightsMapVisualization;