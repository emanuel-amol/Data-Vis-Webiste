// Enhanced Age Analysis with Statistical Features
// Advanced bar chart with confidence intervals, significance testing, and interactive features

class EnhancedAgeAnalysis {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.margin = { top: 80, right: 200, bottom: 80, left: 80 };
    this.width = (options.width || 900) - this.margin.left - this.margin.right;
    this.height = (options.height || 600) - this.margin.top - this.margin.bottom;
    
    this.data = [];
    this.originalData = [];
    this.populationData = this.getPopulationData();
    this.showPerCapita = false;
    this.showConfidenceIntervals = true;
    this.animationDuration = 750;
    
    this.ageOrder = ["0-16", "17-25", "26-39", "40-64", "65 and over"];
    this.colorScale = d3.scaleOrdinal()
      .domain(this.ageOrder)
      .range(["#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]);
    
    this.initializeChart();
    this.loadData();
  }
  
  initializeChart() {
    // Clear existing content
    d3.select(`#${this.containerId}`).selectAll("*").remove();
    
    // Create main SVG
    this.svg = d3.select(`#${this.containerId}`)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .attr("class", "age-analysis-chart");
    
    // Create chart group
    this.chartGroup = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    
    // Add title
    this.svg.append("text")
      .attr("x", this.margin.left + this.width/2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("class", "main-title")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Age Demographics: Enforcement Statistics with Statistical Analysis");
    
    // Add subtitle
    this.svg.append("text")
      .attr("x", this.margin.left + this.width/2)
      .attr("y", 55)
      .attr("text-anchor", "middle")
      .attr("class", "subtitle")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text("Confidence intervals and significance testing reveal statistical patterns");
    
    // Create scales
    this.xScale = d3.scaleBand()
      .domain(this.ageOrder)
      .range([0, this.width])
      .paddingInner(0.2)
      .paddingOuter(0.2);
    
    this.yScale = d3.scaleLinear()
      .range([this.height, 0]);
    
    // Create tooltip
    this.tooltip = d3.select("body")
      .append("div")
      .attr("class", "enhanced-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0,0,0,0.9)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("max-width", "300px")
      .style("box-shadow", "0 4px 20px rgba(0,0,0,0.3)")
      .style("z-index", 1000);
    
    // Add controls
    this.addControls();
  }
  
  addControls() {
    // Control panel
    const controlPanel = d3.select(`#${this.containerId}`)
      .insert("div", "svg")
      .attr("class", "control-panel")
      .style("margin-bottom", "20px")
      .style("padding", "15px")
      .style("background", "#f8f9fa")
      .style("border-radius", "8px")
      .style("display", "flex")
      .style("gap", "20px")
      .style("align-items", "center")
      .style("flex-wrap", "wrap");
    
    // Toggle for per-capita view
    const perCapitaToggle = controlPanel.append("label")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px")
      .style("cursor", "pointer");
    
    perCapitaToggle.append("input")
      .attr("type", "checkbox")
      .attr("id", "per-capita-toggle")
      .on("change", (event) => {
        this.showPerCapita = event.target.checked;
        this.updateChart();
      });
    
    perCapitaToggle.append("span")
      .text("Show per-capita rates (per 100,000 population)");
    
    // Toggle for confidence intervals
    const ciToggle = controlPanel.append("label")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px")
      .style("cursor", "pointer");
    
    ciToggle.append("input")
      .attr("type", "checkbox")
      .attr("id", "ci-toggle")
      .property("checked", true)
      .on("change", (event) => {
        this.showConfidenceIntervals = event.target.checked;
        this.updateChart();
      });
    
    ciToggle.append("span")
      .text("Show confidence intervals (95%)");
    
    // Statistical test button
    controlPanel.append("button")
      .attr("class", "stat-test-btn")
      .style("padding", "8px 16px")
      .style("background", "#3b82f6")
      .style("color", "white")
      .style("border", "none")
      .style("border-radius", "4px")
      .style("cursor", "pointer")
      .text("Run Statistical Tests")
      .on("click", () => this.runStatisticalTests());
  }
  
  getPopulationData() {
    // Approximate population data by age group (in thousands)
    // This would typically come from census data
    return {
      "0-16": 5000,
      "17-25": 3200,
      "26-39": 4500,
      "40-64": 6800,
      "65 and over": 4000
    };
  }
  
  async loadData() {
    try {
      // Try to load real data
      const csvData = await d3.csv("../data/police_enforcement_2023.csv");
      this.originalData = csvData;
      this.processData();
    } catch (error) {
      console.log("Loading sample data for age analysis");
      this.createSampleData();
    }
  }
  
  createSampleData() {
    // Enhanced sample data with multiple years for statistical analysis
    const jurisdictions = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
    const years = [2021, 2022, 2023];
    const baseData = {
      "0-16": 5000,
      "17-25": 298300,
      "26-39": 430000,
      "40-64": 604750,
      "65 and over": 145000
    };
    
    this.originalData = [];
    
    years.forEach(year => {
      jurisdictions.forEach(jurisdiction => {
        this.ageOrder.forEach(ageGroup => {
          const jurisdictionFactor = {
            "NSW": 0.25, "VIC": 0.3, "QLD": 0.15, "SA": 0.08,
            "WA": 0.12, "TAS": 0.04, "NT": 0.02, "ACT": 0.04
          }[jurisdiction];
          
          // Add some variation between years
          const yearFactor = year === 2021 ? 1.0 : year === 2022 ? 0.95 : 0.92;
          
          // Add random variation for statistical testing
          const randomFactor = 0.9 + Math.random() * 0.2;
          
          const fines = Math.round(baseData[ageGroup] * jurisdictionFactor * yearFactor * randomFactor);
          
          this.originalData.push({
            YEAR: year,
            JURISDICTION: jurisdiction,
            AGE_GROUP: ageGroup,
            FINES: fines
          });
        });
      });
    });
    
    this.processData();
  }
  
  processData() {
    // Get filter selections
    const selectedJurisdictions = this.getSelectedJurisdictions();
    
    // Filter data
    let filteredData = this.originalData;
    if (selectedJurisdictions.length > 0) {
      filteredData = filteredData.filter(d => selectedJurisdictions.includes(d.JURISDICTION));
    }
    
    // Group by age group and calculate statistics
    const grouped = d3.rollups(
      filteredData,
      values => {
        const fines = values.map(v => +v.FINES);
        const stats = StatisticsUtils.confidenceInterval(fines);
        
        return {
          mean: stats.mean,
          total: d3.sum(fines),
          count: fines.length,
          std: stats.std,
          ci_lower: stats.lower,
          ci_upper: stats.upper,
          values: fines
        };
      },
      d => d.AGE_GROUP
    );
    
    // Convert to array format
    this.data = this.ageOrder.map(ageGroup => {
      const found = grouped.find(([key]) => key === ageGroup);
      const stats = found ? found[1] : {
        mean: 0, total: 0, count: 0, std: 0,
        ci_lower: 0, ci_upper: 0, values: []
      };
      
      return {
        ageGroup: ageGroup,
        ...stats,
        population: this.populationData[ageGroup] || 1,
        perCapita: (stats.total / (this.populationData[ageGroup] || 1)) * 100000
      };
    });
    
    this.updateChart();
  }
  
  updateChart() {
    // Determine which values to use
    const getValue = d => this.showPerCapita ? d.perCapita : d.total;
    const getCI = d => this.showPerCapita ? 
      [(d.ci_lower / d.population) * 100000, (d.ci_upper / d.population) * 100000] :
      [d.ci_lower, d.ci_upper];
    
    // Update scales
    const maxValue = d3.max(this.data, d => {
      if (this.showPerCapita) {
        return (d.ci_upper / d.population) * 100000;
      }
      return d.ci_upper;
    });
    
    this.yScale.domain([0, maxValue * 1.15]);
    
    // Update axes
    this.updateAxes();
    
    // Update bars
    this.updateBars(getValue, getCI);
    
    // Update confidence intervals
    if (this.showConfidenceIntervals) {
      this.updateConfidenceIntervals(getCI);
    } else {
      this.chartGroup.selectAll(".confidence-interval").remove();
    }
    
    // Update statistical annotations
    this.updateStatisticalAnnotations();
  }
  
  updateAxes() {
    // X-axis
    const xAxis = this.chartGroup.selectAll(".x-axis")
      .data([null]);
    
    xAxis.enter()
      .append("g")
      .attr("class", "x-axis")
      .merge(xAxis)
      .attr("transform", `translate(0,${this.height})`)
      .transition()
      .duration(this.animationDuration)
      .call(d3.axisBottom(this.xScale))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-weight", d => d === "40-64" ? "bold" : "normal");
    
    // Y-axis
    const yAxis = this.chartGroup.selectAll(".y-axis")
      .data([null]);
    
    yAxis.enter()
      .append("g")
      .attr("class", "y-axis")
      .merge(yAxis)
      .transition()
      .duration(this.animationDuration)
      .call(d3.axisLeft(this.yScale)
        .tickFormat(d => d3.format(",.0f")(d))
        .ticks(8));
    
    // Axis labels
    const xLabel = this.svg.selectAll(".x-label")
      .data([null]);
    
    xLabel.enter()
      .append("text")
      .attr("class", "x-label")
      .merge(xLabel)
      .attr("text-anchor", "middle")
      .attr("x", this.margin.left + this.width/2)
      .attr("y", this.height + this.margin.top + 60)
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Age Group");
    
    const yLabel = this.svg.selectAll(".y-label")
      .data([null]);
    
    yLabel.enter()
      .append("text")
      .attr("class", "y-label")
      .merge(yLabel)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -(this.margin.top + this.height/2))
      .attr("y", 25)
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text(this.showPerCapita ? "Fines per 100,000 Population" : "Total Number of Fines");
  }
  
  updateBars(getValue, getCI) {
    const bars = this.chartGroup.selectAll(".bar")
      .data(this.data, d => d.ageGroup);
    
    // Enter selection
    const barsEnter = bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => this.xScale(d.ageGroup))
      .attr("width", this.xScale.bandwidth())
      .attr("y", this.height)
      .attr("height", 0)
      .style("cursor", "pointer");
    
    // Update selection
    bars.merge(barsEnter)
      .on("mouseover", (event, d) => this.showTooltip(event, d))
      .on("mousemove", (event) => this.moveTooltip(event))
      .on("mouseout", () => this.hideTooltip())
      .on("click", (event, d) => this.showDetailedStats(d))
      .transition()
      .duration(this.animationDuration)
      .attr("x", d => this.xScale(d.ageGroup))
      .attr("y", d => this.yScale(getValue(d)))
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => this.height - this.yScale(getValue(d)))
      .attr("fill", d => {
        // Highlight the highest value
        const maxValue = d3.max(this.data, getValue);
        return getValue(d) === maxValue ? "#e31a1c" : this.colorScale(d.ageGroup);
      })
      .attr("stroke", d => {
        const maxValue = d3.max(this.data, getValue);
        return getValue(d) === maxValue ? "#c00" : "none";
      })
      .attr("stroke-width", d => {
        const maxValue = d3.max(this.data, getValue);
        return getValue(d) === maxValue ? 2 : 0;
      });
    
    // Exit selection
    bars.exit()
      .transition()
      .duration(this.animationDuration)
      .attr("height", 0)
      .attr("y", this.height)
      .remove();
    
    // Value labels
    const labels = this.chartGroup.selectAll(".value-label")
      .data(this.data, d => d.ageGroup);
    
    const labelsEnter = labels.enter()
      .append("text")
      .attr("class", "value-label")
      .attr("text-anchor", "middle")
      .attr("y", this.height)
      .style("opacity", 0);
    
    labels.merge(labelsEnter)
      .transition()
      .duration(this.animationDuration)
      .attr("x", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2)
      .attr("y", d => this.yScale(getValue(d)) - 5)
      .style("font-size", "12px")
      .style("font-weight", d => {
        const maxValue = d3.max(this.data, getValue);
        return getValue(d) === maxValue ? "bold" : "normal";
      })
      .style("opacity", 1)
      .text(d => d3.format(",.0f")(getValue(d)));
    
    labels.exit()
      .transition()
      .duration(this.animationDuration)
      .style("opacity", 0)
      .remove();
  }
  
  updateConfidenceIntervals(getCI) {
    const ciData = this.data.filter(d => d.count > 1); // Only show CI if we have multiple observations
    
    const intervals = this.chartGroup.selectAll(".confidence-interval")
      .data(ciData, d => d.ageGroup);
    
    const intervalsEnter = intervals.enter()
      .append("g")
      .attr("class", "confidence-interval");
    
    // Error bars
    intervalsEnter.append("line")
      .attr("class", "ci-line")
      .attr("stroke", "#333")
      .attr("stroke-width", 2);
    
    // Top cap
    intervalsEnter.append("line")
      .attr("class", "ci-cap-top")
      .attr("stroke", "#333")
      .attr("stroke-width", 2);
    
    // Bottom cap
    intervalsEnter.append("line")
      .attr("class", "ci-cap-bottom")
      .attr("stroke", "#333")
      .attr("stroke-width", 2);
    
    // Update
    const intervalsUpdate = intervals.merge(intervalsEnter);
    
    intervalsUpdate.select(".ci-line")
      .transition()
      .duration(this.animationDuration)
      .attr("x1", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2)
      .attr("x2", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2)
      .attr("y1", d => this.yScale(getCI(d)[1]))
      .attr("y2", d => this.yScale(getCI(d)[0]));
    
    const capWidth = this.xScale.bandwidth() * 0.3;
    intervalsUpdate.select(".ci-cap-top")
      .transition()
      .duration(this.animationDuration)
      .attr("x1", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2 - capWidth/2)
      .attr("x2", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2 + capWidth/2)
      .attr("y1", d => this.yScale(getCI(d)[1]))
      .attr("y2", d => this.yScale(getCI(d)[1]));
    
    intervalsUpdate.select(".ci-cap-bottom")
      .transition()
      .duration(this.animationDuration)
      .attr("x1", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2 - capWidth/2)
      .attr("x2", d => this.xScale(d.ageGroup) + this.xScale.bandwidth() / 2 + capWidth/2)
      .attr("y1", d => this.yScale(getCI(d)[0]))
      .attr("y2", d => this.yScale(getCI(d)[0]));
    
    intervals.exit().remove();
  }
  
  updateStatisticalAnnotations() {
    // Find the age group with highest value
    const getValue = d => this.showPerCapita ? d.perCapita : d.total;
    const maxData = this.data.reduce((max, d) => getValue(d) > getValue(max) ? d : max);
    
    // Statistical insight box
    const insightBox = this.svg.selectAll(".insight-box")
      .data([maxData]);
    
    const insightEnter = insightBox.enter()
      .append("g")
      .attr("class", "insight-box");
    
    insightEnter.append("rect")
      .attr("class", "insight-bg")
      .attr("fill", "#f8f9fa")
      .attr("stroke", "#dee2e6")
      .attr("stroke-width", 1)
      .attr("rx", 6);
    
    insightEnter.append("text")
      .attr("class", "insight-title")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#495057")
      .text("Statistical Finding:");
    
    insightEnter.append("text")
      .attr("class", "insight-text1")
      .style("font-size", "11px")
      .style("fill", "#6c757d");
    
    insightEnter.append("text")
      .attr("class", "insight-text2")
      .style("font-size", "11px")
      .style("fill", "#6c757d");
    
    insightEnter.append("text")
      .attr("class", "insight-text3")
      .style("font-size", "11px")
      .style("fill", "#6c757d");
    
    const insightUpdate = insightBox.merge(insightEnter);
    
    insightUpdate.select(".insight-bg")
      .attr("x", this.width - 220)
      .attr("y", 10)
      .attr("width", 210)
      .attr("height", 85);
    
    insightUpdate.select(".insight-title")
      .attr("x", this.width - 210)
      .attr("y", 30);
    
    insightUpdate.select(".insight-text1")
      .attr("x", this.width - 210)
      .attr("y", 48)
      .text(`${maxData.ageGroup} has highest rate`);
    
    insightUpdate.select(".insight-text2")
      .attr("x", this.width - 210)
      .attr("y", 63)
      .text(`${d3.format(",.0f")(getValue(maxData))} ${this.showPerCapita ? 'per 100k' : 'total'}`);
    
    insightUpdate.select(".insight-text3")
      .attr("x", this.width - 210)
      .attr("y", 78)
      .text(`95% CI: ±${d3.format(",.0f")(maxData.ci_upper - maxData.mean)}`);
  }
  
  showTooltip(event, d) {
    const getValue = d => this.showPerCapita ? d.perCapita : d.total;
    const getCI = d => this.showPerCapita ? 
      [(d.ci_lower / d.population) * 100000, (d.ci_upper / d.population) * 100000] :
      [d.ci_lower, d.ci_upper];
    
    const ci = getCI(d);
    const marginOfError = ci[1] - getValue(d);
    
    const html = `
      <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
        <strong style="font-size: 14px;">${d.ageGroup} Age Group</strong>
      </div>
      <div style="margin-bottom: 6px;">
        <strong>${this.showPerCapita ? 'Per-capita rate' : 'Total fines'}:</strong> 
        ${d3.format(",.0f")(getValue(d))}${this.showPerCapita ? ' per 100k' : ''}
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Population:</strong> ${d3.format(",.0f")(d.population * 1000)}
      </div>
      <div style="margin-bottom: 6px;">
        <strong>95% Confidence Interval:</strong><br>
        ${d3.format(",.0f")(ci[0])} - ${d3.format(",.0f")(ci[1])}
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Margin of Error:</strong> ±${d3.format(",.0f")(marginOfError)}
      </div>
      <div style="color: #60a5fa; font-size: 11px; font-style: italic;">
        Based on ${d.count} observations
      </div>
    `;
    
    this.tooltip
      .style("visibility", "visible")
      .html(html);
    
    // Highlight the bar
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr("opacity", 0.7)
      .attr("stroke", "#000")
      .attr("stroke-width", 2);
  }
  
  moveTooltip(event) {
    this.tooltip
      .style("top", (event.pageY - 10) + "px")
      .style("left", (event.pageX + 15) + "px");
  }
  
  hideTooltip() {
    this.tooltip.style("visibility", "hidden");
    
    // Reset bar appearance
    this.chartGroup.selectAll(".bar")
      .transition()
      .duration(200)
      .attr("opacity", 1)
      .attr("stroke", d => {
        const getValue = d => this.showPerCapita ? d.perCapita : d.total;
        const maxValue = d3.max(this.data, getValue);
        return getValue(d) === maxValue ? "#c00" : "none";
      })
      .attr("stroke-width", d => {
        const getValue = d => this.showPerCapita ? d.perCapita : d.total;
        const maxValue = d3.max(this.data, getValue);
        return getValue(d) === maxValue ? 2 : 0;
      });
  }
  
  runStatisticalTests() {
    // Compare highest group with others
    const getValue = d => this.showPerCapita ? d.perCapita : d.total;
    const maxData = this.data.reduce((max, d) => getValue(d) > getValue(max) ? d : max);
    
    let results = [];
    
    this.data.forEach(d => {
      if (d.ageGroup !== maxData.ageGroup && d.values.length > 1 && maxData.values.length > 1) {
        const tTest = StatisticsUtils.tTest(maxData.values, d.values);
        const cohensD = StatisticsUtils.cohensD(maxData.values, d.values);
        
        results.push({
          comparison: `${maxData.ageGroup} vs ${d.ageGroup}`,
          pValue: tTest.pValue,
          significant: tTest.significant,
          effectSize: cohensD.d,
          interpretation: cohensD.interpretation
        });
      }
    });
    
    // Display results
    const resultHtml = results.map(r => 
      `<div style="margin-bottom: 10px; padding: 8px; background: ${r.significant ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
        <strong>${r.comparison}</strong><br>
        p-value: ${r.pValue.toFixed(4)} ${r.significant ? '(significant)' : '(not significant)'}<br>
        Effect size: ${r.effectSize.toFixed(2)} (${r.interpretation})
      </div>`
    ).join('');
    
    // Show in modal or alert
    const modal = d3.select("body")
      .append("div")
      .style("position", "fixed")
      .style("top", "50%")
      .style("left", "50%")
      .style("transform", "translate(-50%, -50%)")
      .style("background", "white")
      .style("padding", "20px")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 20px rgba(0,0,0,0.3)")
      .style("max-width", "500px")
      .style("max-height", "70vh")
      .style("overflow-y", "auto")
      .style("z-index", "2000");
    
    modal.append("h3")
      .text("Statistical Test Results")
      .style("margin-bottom", "15px");
    
    modal.append("div")
      .html(resultHtml);
    
    modal.append("button")
      .text("Close")
      .style("margin-top", "15px")
      .style("padding", "8px 16px")
      .style("background", "#3b82f6")
      .style("color", "white")
      .style("border", "none")
      .style("border-radius", "4px")
      .style("cursor", "pointer")
      .on("click", () => modal.remove());
  }
  
  showDetailedStats(d) {
    console.log(`Detailed statistics for ${d.ageGroup}:`, d);
    // This could open a detailed view or drill-down chart
  }
  
  getSelectedJurisdictions() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }
  
  // Public method to update based on filter changes
  updateFilters() {
    this.processData();
  }
}

// Global instance
let enhancedAgeAnalysis;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('enhanced-age-chart')) {
    enhancedAgeAnalysis = new EnhancedAgeAnalysis('enhanced-age-chart');
    
    // Hook into global update function
    window.updateCharts = function() {
      if (enhancedAgeAnalysis) {
        enhancedAgeAnalysis.updateFilters();
      }
    };
  }
});