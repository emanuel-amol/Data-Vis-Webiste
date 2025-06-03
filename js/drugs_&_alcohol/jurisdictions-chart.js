// js/drugs_&_alcohol/jurisdictions-chart.js
// Jurisdictional analysis visualization for drugs and alcohol enforcement data

class DrugsAlcoholJurisdictionsChart {
  constructor() {
    this.data = null;
    this.svg = null;
    this.chart = null;
    this.tooltip = null;
    this.dimensions = {
      width: 800,
      height: 500,
      margin: { top: 60, right: 100, bottom: 100, left: 120 }
    };
    
    this.colors = {
      primary: '#3498db',
      secondary: '#e74c3c',
      tertiary: '#f39c12',
      quaternary: '#9b59b6',
      success: '#2ecc71',
      warning: '#e67e22',
      danger: '#e74c3c',
      info: '#17a2b8'
    };

    // Population data for per-capita calculations
    this.populationData = {
      ACT: 431000,
      NSW: 8166000,
      NT: 249000,
      QLD: 5260000,
      SA: 1803000,
      TAS: 571000,
      VIC: 6680000,
      WA: 2787000
    };
  }

  init() {
    this.createSVG();
    this.createTooltip();
    this.loadData();
  }

  createSVG() {
    const container = d3.select('#jurisdictions-chart');
    container.selectAll('*').remove();

    this.svg = container
      .append('svg')
      .attr('width', this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right)
      .attr('height', this.dimensions.height + this.dimensions.margin.top + this.dimensions.margin.bottom)
      .attr('viewBox', `0 0 ${this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right} ${this.dimensions.height + this.dimensions.margin.top + this.dimensions.margin.bottom}`)
      .style('background', '#fafafa');

    this.chart = this.svg.append('g')
      .attr('transform', `translate(${this.dimensions.margin.left},${this.dimensions.margin.top})`);

    // Add title
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Drugs & Alcohol Enforcement by Jurisdiction');

    // Add subtitle
    this.svg.append('text')
      .attr('x', (this.dimensions.width + this.dimensions.margin.left + this.dimensions.margin.right) / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#7f8c8d')
      .text('Comparing enforcement outcomes across Australian states and territories');
  }

  createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'drugs-alcohol-jurisdictions-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('color', '#fff')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('max-width', '350px')
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.3)')
      .style('z-index', 1002);
  }

  loadData() {
    if (window.drugsAlcoholData && window.drugsAlcoholData.processed) {
      this.data = window.drugsAlcoholData.processed;
      this.render();
    } else {
      document.addEventListener('drugsAlcoholDataReady', (event) => {
        this.data = event.detail.data.processed;
        this.render();
      });
    }
  }

  render() {
    if (!this.data) return;

    // Clear previous content
    this.chart.selectAll('*').remove();

    const jurisdictionData = this.data.byJurisdiction;
    
    if (!jurisdictionData || jurisdictionData.length === 0) {
      this.chart.append('text')
        .attr('x', this.dimensions.width / 2)
        .attr('y', this.dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#7f8c8d')
        .text('No jurisdictional data available');
      return;
    }

    // Add per-capita calculations
    const enrichedData = jurisdictionData.map(d => {
      const population = this.populationData[d.jurisdiction] || 1;
      const total = d.totalFines + d.totalArrests + d.totalCharges;
      return {
        ...d,
        population,
        total,
        perCapita: (total / population) * 100000, // per 100,000 population
        finesPerCapita: (d.totalFines / population) * 100000,
        arrestsPerCapita: (d.totalArrests / population) * 100000,
        chargesPerCapita: (d.totalCharges / population) * 100000
      };
    }).sort((a, b) => b.total - a.total);

    this.renderGroupedBarChart(enrichedData);
  }

  renderGroupedBarChart(data) {
    // Prepare grouped data
    const metrics = [
      { key: 'totalFines', label: 'Fines', color: this.colors.primary },
      { key: 'totalArrests', label: 'Arrests', color: this.colors.secondary },
      { key: 'totalCharges', label: 'Charges', color: this.colors.tertiary }
    ];

    const jurisdictions = data.map(d => d.jurisdiction);

    // Scales
    const x0 = d3.scaleBand()
      .domain(jurisdictions)
      .range([0, this.dimensions.width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(metrics.map(m => m.key))
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.totalFines, d.totalArrests, d.totalCharges)) * 1.1])
      .nice()
      .range([this.dimensions.height, 0]);

    // Add gridlines
    this.chart.append('g')
      .attr('class', 'grid')
      .style('stroke-dasharray', '2,2')
      .style('stroke', '#e0e0e0')
      .style('opacity', 0.7)
      .call(d3.axisLeft(y)
        .tickSize(-this.dimensions.width)
        .tickFormat('')
      );

    // Add axes
    const xAxis = this.chart.append('g')
      .attr('transform', `translate(0,${this.dimensions.height})`)
      .call(d3.axisBottom(x0));

    const yAxis = this.chart.append('g')
      .call(d3.axisLeft(y)
        .tickFormat(d => d >= 1000 ? d3.format('.1s')(d) : d3.format(',.0f')(d)));

    // Style axes
    xAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#7f8c8d')
      .style('font-weight', '600');
      
    yAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#7f8c8d');

    // Add axis labels
    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', this.dimensions.width / 2)
      .attr('y', this.dimensions.height + 60)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text('Jurisdiction');

    this.chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.dimensions.height / 2)
      .attr('y', -80)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text('Number of Enforcement Actions');

    // Create jurisdiction groups
    const jurisdictionGroups = this.chart.selectAll('.jurisdiction-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'jurisdiction-group')
      .attr('transform', d => `translate(${x0(d.jurisdiction)},0)`);

    // Add bars for each metric
    metrics.forEach(metric => {
      jurisdictionGroups.selectAll(`.bar-${metric.key}`)
        .data(d => [d])
        .enter()
        .append('rect')
        .attr('class', `bar-${metric.key}`)
        .attr('x', x1(metric.key))
        .attr('y', d => y(d[metric.key]))
        .attr('width', x1.bandwidth())
        .attr('height', d => this.dimensions.height - y(d[metric.key]))
        .attr('fill', metric.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.target)
            .transition()
            .duration(200)
            .attr('opacity', 0.8);

          const percentage = d.total > 0 ? ((d[metric.key] / d.total) * 100).toFixed(1) : 0;
          const perCapitaValue = d[metric.key.replace('total', '').toLowerCase() + 'PerCapita'].toFixed(1);

          this.tooltip
            .style('visibility', 'visible')
            .html(`
              <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
                <strong>${d.jurisdiction} - ${metric.label}</strong>
              </div>
              <div style="margin-bottom: 6px;">
                <strong>Count:</strong> ${d[metric.key].toLocaleString()}
              </div>
              <div style="margin-bottom: 6px;">
                <strong>% of Total:</strong> ${percentage}%
              </div>
              <div style="margin-bottom: 6px;">
                <strong>Per 100k:</strong> ${perCapitaValue}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
                Population: ${d.population.toLocaleString()}<br>
                Total Actions: ${d.total.toLocaleString()}
              </div>
            `);
        })
        .on('mousemove', (event) => {
          this.tooltip
            .style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 15) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.target)
            .transition()
            .duration(200)
            .attr('opacity', 1);
          
          this.tooltip.style('visibility', 'hidden');
        });

      // Add value labels on bars
      jurisdictionGroups.selectAll(`.label-${metric.key}`)
        .data(d => [d])
        .enter()
        .append('text')
        .attr('class', `label-${metric.key}`)
        .attr('x', x1(metric.key) + x1.bandwidth() / 2)
        .attr('y', d => y(d[metric.key]) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', '#2c3e50')
        .text(d => d[metric.key] > 0 ? d[metric.key].toLocaleString() : '');
    });

    // Add legend
    this.addLegend(metrics);

    // Add per-capita comparison
    this.addPerCapitaComparison(data);

    // Add jurisdiction ranking
    this.addJurisdictionRanking(data);
  }

  addLegend(metrics) {
    const legend = this.chart.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.dimensions.width + 20}, 50)`);

    metrics.forEach((metric, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${index * 25})`);

      legendItem.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', metric.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('fill', '#2c3e50')
        .text(metric.label);
    });
  }

  addPerCapitaComparison(data) {
    // Mini chart showing per-capita rates
    const miniChartY = 150;
    const miniChartHeight = 100;
    const miniChartWidth = 60;

    const perCapitaGroup = this.chart.append('g')
      .attr('class', 'per-capita-comparison')
      .attr('transform', `translate(${this.dimensions.width + 20}, ${miniChartY})`);

    // Background
    perCapitaGroup.append('rect')
      .attr('width', 80)
      .attr('height', miniChartHeight + 40)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#bdc3c7')
      .attr('stroke-width', 1)
      .attr('rx', 8);

    // Title
    perCapitaGroup.append('text')
      .attr('x', 40)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Per Capita');

    // Scale for mini bars
    const maxPerCapita = d3.max(data, d => d.perCapita);
    const perCapitaScale = d3.scaleLinear()
      .domain([0, maxPerCapita])
      .range([0, miniChartWidth]);

    // Mini bars
    data.slice(0, 4).forEach((d, i) => {
      const barGroup = perCapitaGroup.append('g')
        .attr('transform', `translate(10, ${25 + i * 18})`);

      barGroup.append('rect')
        .attr('width', perCapitaScale(d.perCapita))
        .attr('height', 12)
        .attr('fill', this.colors.info)
        .attr('opacity', 0.7);

      barGroup.append('text')
        .attr('x', -5)
        .attr('y', 6)
        .attr('text-anchor', 'end')
        .style('font-size', '8px')
        .style('fill', '#2c3e50')
        .text(d.jurisdiction);

      barGroup.append('text')
        .attr('x', perCapitaScale(d.perCapita) + 2)
        .attr('y', 6)
        .attr('dy', '0.35em')
        .style('font-size', '8px')
        .style('fill', '#2c3e50')
        .text(d.perCapita.toFixed(0));
    });
  }

  addJurisdictionRanking(data) {
    // Ranking box
    const rankingGroup = this.chart.append('g')
      .attr('class', 'jurisdiction-ranking')
      .attr('transform', `translate(${this.dimensions.width + 20}, 280)`);

    rankingGroup.append('rect')
      .attr('width', 80)
      .attr('height', 120)
      .attr('fill', '#ecf0f1')
      .attr('stroke', '#bdc3c7')
      .attr('stroke-width', 1)
      .attr('rx', 8);

    rankingGroup.append('text')
      .attr('x', 40)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#2c3e50')
      .text('Top Rankings');

    // Top jurisdiction by total
    const topTotal = data[0];
    rankingGroup.append('text')
      .attr('x', 10)
      .attr('y', 35)
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#27ae60')
      .text('Most Total:');

    rankingGroup.append('text')
      .attr('x', 10)
      .attr('y', 48)
      .style('font-size', '8px')
      .style('fill', '#2c3e50')
      .text(`${topTotal.jurisdiction}: ${topTotal.total.toLocaleString()}`);

    // Top by per-capita
    const topPerCapita = data.reduce((max, d) => d.perCapita > max.perCapita ? d : max);
    rankingGroup.append('text')
      .attr('x', 10)
      .attr('y', 68)
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#3498db')
      .text('Highest Per Capita:');

    rankingGroup.append('text')
      .attr('x', 10)
      .attr('y', 81)
      .style('font-size', '8px')
      .style('fill', '#2c3e50')
      .text(`${topPerCapita.jurisdiction}: ${topPerCapita.perCapita.toFixed(0)}`);

    // Enforcement efficiency (arrests + charges / total)
    const efficiency = data.map(d => ({
      jurisdiction: d.jurisdiction,
      efficiency: d.total > 0 ? ((d.totalArrests + d.totalCharges) / d.total) * 100 : 0
    })).sort((a, b) => b.efficiency - a.efficiency)[0];

    rankingGroup.append('text')
      .attr('x', 10)
      .attr('y', 101)
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#e67e22')
      .text('Most Effective:');

    rankingGroup.append('text')
      .attr('x', 10)
      .attr('y', 114)
      .style('font-size', '8px')
      .style('fill', '#2c3e50')
      .text(`${efficiency.jurisdiction}: ${efficiency.efficiency.toFixed(1)}%`);
  }

  update() {
    // Check if we have filtered data
    if (window.drugsAlcoholData && window.drugsAlcoholData.filtered) {
      this.data = window.drugsAlcoholData.filtered.processed;
    }
    this.render();
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
    }
  }
}

// Initialize the jurisdictions chart
let drugsAlcoholJurisdictionsChart;

document.addEventListener('DOMContentLoaded', function() {
  const jurisdictionsContainer = document.getElementById('jurisdictions-chart');
  if (jurisdictionsContainer) {
    drugsAlcoholJurisdictionsChart = new DrugsAlcoholJurisdictionsChart();
    drugsAlcoholJurisdictionsChart.init();
  }
});

// Export for use in other modules
window.DrugsAlcoholJurisdictionsChart = DrugsAlcoholJurisdictionsChart;
window.drugsAlcoholJurisdictionsChart = drugsAlcoholJurisdictionsChart;