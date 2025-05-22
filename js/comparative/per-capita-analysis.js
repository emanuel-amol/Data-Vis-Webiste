// Minimal placeholder for per-capita analysis chart
document.addEventListener('DOMContentLoaded', function() {
  // Population by jurisdiction (ABS 2021, in thousands)
  const population = {
    ACT: 431,
    NSW: 8166,
    NT: 249,
    QLD: 5260,
    SA: 1803,
    TAS: 571,
    VIC: 6680,
    WA: 2787
  };

  function getSelectedJurisdictions() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }
  function getSelectedYearRange() {
    const start = parseInt(document.getElementById('year-start').value, 10);
    const end = parseInt(document.getElementById('year-end').value, 10);
    return [start, end];
  }

  function renderPerCapitaChart() {
    const chartDiv = document.getElementById('per-capita-chart');
    chartDiv.innerHTML = '';
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Get data from dataLoader
    const data = (window.roadSafetyData && window.roadSafetyData.raw) ? window.roadSafetyData.raw : [];
    if (!data.length) {
      chartDiv.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2em;">No data available.</div>';
      return;
    }

    // Get filters
    const selectedJurisdictions = getSelectedJurisdictions();
    const [yearStart, yearEnd] = getSelectedYearRange();

    // Filter and aggregate
    const filtered = data.filter(d =>
      d.YEAR >= yearStart && d.YEAR <= yearEnd &&
      (!selectedJurisdictions.length || selectedJurisdictions.includes(d.JURISDICTION))
    );

    // Group by jurisdiction and sum fines
    const finesByJurisdiction = d3.rollups(
      filtered,
      v => d3.sum(v, d => +d.FINES),
      d => d.JURISDICTION
    );

    // Compute per-capita rates
    const perCapitaData = finesByJurisdiction
      .filter(([jur,]) => population[jur])
      .map(([jur, totalFines]) => ({
        jurisdiction: jur,
        totalFines,
        perCapita: totalFines / (population[jur] * 1000) * 100000
      }))
      .sort((a, b) => b.perCapita - a.perCapita);

    // D3 chart
    const svg = d3.select(chartDiv)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(perCapitaData.map(d => d.jurisdiction))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(perCapitaData, d => d.perCapita) * 1.1])
      .nice()
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format(",.0f")));

    // Bars
    g.selectAll('.bar')
      .data(perCapitaData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.jurisdiction))
      .attr('y', d => y(d.perCapita))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.perCapita))
      .attr('fill', '#3b82f6')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', '#1e40af');
        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${d.jurisdiction}</strong><br>
            Per-capita fines: <b>${d.perCapita.toFixed(1)}</b> per 100,000<br>
            Total fines: ${d.totalFines.toLocaleString()}<br>
            Population: ${population[d.jurisdiction].toLocaleString()}k`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 15) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill', '#3b82f6');
        tooltip.style('visibility', 'hidden');
      });

    // Value labels
    g.selectAll('.label')
      .data(perCapitaData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.jurisdiction) + x.bandwidth() / 2)
      .attr('y', d => y(d.perCapita) - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text(d => d.perCapita.toFixed(0));

    // Axis labels
    svg.append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', margin.top + height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Jurisdiction');

    svg.append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(margin.top + height / 2))
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Fines per 100,000 population');

    // Tooltip
    let tooltip = d3.select('body').select('#per-capita-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('id', 'per-capita-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(0,0,0,0.9)')
        .style('color', '#fff')
        .style('padding', '10px 14px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('max-width', '300px')
        .style('box-shadow', '0 4px 20px rgba(0,0,0,0.3)')
        .style('z-index', 1001);
    }
  }

  // Listen for data ready and filter changes
  function setupListeners() {
    document.addEventListener('roadSafetyDataReady', renderPerCapitaChart);
    document.getElementById('year-start').addEventListener('input', renderPerCapitaChart);
    document.getElementById('year-end').addEventListener('input', renderPerCapitaChart);
    document.getElementById('checkbox-list').addEventListener('change', renderPerCapitaChart);
  }

  // Initial render if data is already loaded
  if (window.roadSafetyData && window.roadSafetyData.raw) {
    renderPerCapitaChart();
  }
  setupListeners();
});
