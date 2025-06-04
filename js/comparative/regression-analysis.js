// js/comparative/regression-analysis.js
// Enhanced regression analysis visualization for road safety enforcement data

document.addEventListener('DOMContentLoaded', function() {
  // Population data for per-capita calculations
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

  function getConfidenceLevel() {
    const select = document.getElementById('confidence-level');
    return select ? parseFloat(select.value) : 0.95;
  }

  function renderRegressionAnalysis() {
    const chartDiv = document.getElementById('regression-chart');
    chartDiv.innerHTML = '';
    
    const margin = { top: 80, right: 250, bottom: 80, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Get data from dataLoader
    const data = (window.roadSafetyData && window.roadSafetyData.raw) ? window.roadSafetyData.raw : [];
    if (!data.length) {
      chartDiv.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2em;">No data available for regression analysis.</div>';
      return;
    }

    // Get filters
    const selectedJurisdictions = getSelectedJurisdictions();
    const [yearStart, yearEnd] = getSelectedYearRange();
    const confidenceLevel = getConfidenceLevel();

    // Filter data
    const filtered = data.filter(d =>
      d.YEAR >= yearStart && d.YEAR <= yearEnd &&
      (!selectedJurisdictions.length || selectedJurisdictions.includes(d.JURISDICTION))
    );

    // Aggregate data by year for time series regression
    const yearlyData = d3.rollups(
      filtered,
      v => ({
        totalFines: d3.sum(v, d => +d.FINES),
        totalArrests: d3.sum(v, d => +d.ARRESTS || 0),
        totalCharges: d3.sum(v, d => +d.CHARGES || 0),
        records: v.length
      }),
      d => d.YEAR
    ).map(([year, data]) => ({ 
      year, 
      ...data,
      yearIndex: year - yearStart // for regression calculation
    })).sort((a, b) => a.year - b.year);

    if (yearlyData.length < 3) {
      chartDiv.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2em;">Insufficient data points for regression analysis. Need at least 3 years of data.</div>';
      return;
    }

    // Perform linear regression
    const regressionResults = performLinearRegression(yearlyData);

    // Create SVG
    const svg = d3.select(chartDiv)
      .append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('width', '100%')
      .attr('height', 'auto');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    svg.append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text('Time Series Regression Analysis: Road Safety Fines');

    // Subtitle
    svg.append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#6b7280')
      .text(`Linear trend analysis with ${(confidenceLevel * 100).toFixed(0)}% confidence intervals`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(yearlyData, d => d.year))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearlyData, d => d.totalFines) * 1.2])
      .nice()
      .range([height, 0]);

    // Add gridlines
    g.append('g')
      .attr('class', 'grid')
      .style('stroke-dasharray', '2,2')
      .style('stroke', '#e5e7eb')
      .style('opacity', 0.7)
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
      );

    // Axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d3.format(',.0f')));

    // Style axes
    xAxis.selectAll('text').style('font-size', '12px').style('fill', '#6b7280');
    yAxis.selectAll('text').style('font-size', '12px').style('fill', '#6b7280');

    // Axis labels
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text('Year');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text('Total Fines');

    // Draw confidence band
    if (regressionResults.confidence) {
      const confidenceArea = d3.area()
        .x(d => xScale(d.year))
        .y0(d => yScale(d.lower))
        .y1(d => yScale(d.upper))
        .curve(d3.curveLinear);

      g.append('path')
        .datum(regressionResults.confidence)
        .attr('fill', '#3b82f6')
        .attr('opacity', 0.2)
        .attr('d', confidenceArea);
    }

    // Draw regression line
    const regressionLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.predicted))
      .curve(d3.curveLinear);

    g.append('path')
      .datum(regressionResults.predictions)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', regressionLine);

    // Draw actual data points
    g.selectAll('.data-point')
      .data(yearlyData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.totalFines))
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 8);
        showTooltip(event, d, regressionResults);
      })
      .on('mousemove', function(event) {
        moveTooltip(event);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 6);
        hideTooltip();
      });

    // Add prediction points
    g.selectAll('.prediction-point')
      .data(regressionResults.predictions)
      .enter()
      .append('circle')
      .attr('class', 'prediction-point')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.predicted))
      .attr('r', 4)
      .attr('fill', '#ef4444')
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('opacity', 0.8);

    // Add residual lines
    yearlyData.forEach(d => {
      const predicted = regressionResults.slope * d.yearIndex + regressionResults.intercept;
      g.append('line')
        .attr('x1', xScale(d.year))
        .attr('x2', xScale(d.year))
        .attr('y1', yScale(d.totalFines))
        .attr('y2', yScale(predicted))
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2')
        .style('opacity', 0.5);
    });

    // Add statistics panel
    addStatisticsPanel(svg, regressionResults, margin, width, height);

    // Add legend
    addRegressionLegend(g, width);

    // Add predictions and trend analysis
    addTrendAnalysis(g, regressionResults, xScale, yScale, width);
  }

  function performLinearRegression(data) {
    const n = data.length;
    const x = data.map(d => d.yearIndex);
    const y = data.map(d => d.totalFines);

    // Calculate means
    const xMean = d3.mean(x);
    const yMean = d3.mean(y);

    // Calculate slope and intercept
    const numerator = d3.sum(x.map((xi, i) => (xi - xMean) * (y[i] - yMean)));
    const denominator = d3.sum(x.map(xi => (xi - xMean) ** 2));
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared
    const predictions = x.map(xi => slope * xi + intercept);
    const ssRes = d3.sum(y.map((yi, i) => (yi - predictions[i]) ** 2));
    const ssTot = d3.sum(y.map(yi => (yi - yMean) ** 2));
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    // Calculate standard error
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const mse = ssRes / (n - 2);
    const standardError = Math.sqrt(mse);

    // Calculate confidence intervals (simplified)
    const tValue = 2.228; // Approximate t-value for 95% confidence, df = n-2
    const seSlope = standardError / Math.sqrt(d3.sum(x.map(xi => (xi - xMean) ** 2)));
    
    // Create prediction data
    const predictionData = data.map((d, i) => ({
      year: d.year,
      actual: d.totalFines,
      predicted: predictions[i],
      residual: residuals[i]
    }));

    // Create confidence band
    const confidenceData = data.map((d, i) => {
      const se = standardError * Math.sqrt(1/n + ((d.yearIndex - xMean) ** 2) / d3.sum(x.map(xi => (xi - xMean) ** 2)));
      const margin = tValue * se;
      return {
        year: d.year,
        predicted: predictions[i],
        upper: predictions[i] + margin,
        lower: Math.max(0, predictions[i] - margin)
      };
    });

    // Calculate trend information
    const yearlyChange = slope;
    const percentChange = yMean > 0 ? (slope / yMean) * 100 : 0;
    const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

    return {
      slope,
      intercept,
      rSquared,
      standardError,
      predictions: predictionData,
      confidence: confidenceData,
      yearlyChange,
      percentChange,
      direction,
      significance: rSquared > 0.5 ? 'strong' : rSquared > 0.3 ? 'moderate' : 'weak'
    };
  }

  function addStatisticsPanel(svg, results, margin, width, height) {
    const panel = svg.append('g')
      .attr('class', 'statistics-panel')
      .attr('transform', `translate(${margin.left + width + 20}, ${margin.top})`);

    // Panel background
    panel.append('rect')
      .attr('width', 200)
      .attr('height', 280)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 8)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');

    // Title
    panel.append('text')
      .attr('x', 15)
      .attr('y', 25)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text('Regression Statistics');

    // R-squared
    panel.append('text')
      .attr('x', 15)
      .attr('y', 50)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('R-squared:');

    panel.append('text')
      .attr('x', 160)
      .attr('y', 50)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', results.rSquared > 0.7 ? '#16a34a' : results.rSquared > 0.3 ? '#eab308' : '#dc2626')
      .style('font-weight', 'bold')
      .text(results.rSquared.toFixed(4));

    // Slope (yearly change)
    panel.append('text')
      .attr('x', 15)
      .attr('y', 75)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('Yearly Change:');

    panel.append('text')
      .attr('x', 160)
      .attr('y', 75)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', results.slope > 0 ? '#16a34a' : '#dc2626')
      .style('font-weight', 'bold')
      .text(`${results.yearlyChange > 0 ? '+' : ''}${results.yearlyChange.toFixed(0)}`);

    // Percentage change
    panel.append('text')
      .attr('x', 15)
      .attr('y', 100)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('% Change/Year:');

    panel.append('text')
      .attr('x', 160)
      .attr('y', 100)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', results.percentChange > 0 ? '#16a34a' : '#dc2626')
      .style('font-weight', 'bold')
      .text(`${results.percentChange > 0 ? '+' : ''}${results.percentChange.toFixed(1)}%`);

    // Standard error
    panel.append('text')
      .attr('x', 15)
      .attr('y', 125)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('Std Error:');

    panel.append('text')
      .attr('x', 160)
      .attr('y', 125)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text(results.standardError.toFixed(0));

    // Trend direction
    panel.append('text')
      .attr('x', 15)
      .attr('y', 150)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('Trend:');

    panel.append('text')
      .attr('x', 160)
      .attr('y', 150)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', results.direction === 'increasing' ? '#16a34a' : results.direction === 'decreasing' ? '#dc2626' : '#6b7280')
      .style('font-weight', 'bold')
      .style('text-transform', 'capitalize')
      .text(results.direction);

    // Significance
    panel.append('text')
      .attr('x', 15)
      .attr('y', 175)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('Fit Quality:');

    panel.append('text')
      .attr('x', 160)
      .attr('y', 175)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', results.significance === 'strong' ? '#16a34a' : results.significance === 'moderate' ? '#eab308' : '#dc2626')
      .style('font-weight', 'bold')
      .style('text-transform', 'capitalize')
      .text(results.significance);

    // Model equation
    panel.append('text')
      .attr('x', 15)
      .attr('y', 205)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('Equation:');

    panel.append('text')
      .attr('x', 15)
      .attr('y', 220)
      .style('font-size', '11px')
      .style('fill', '#6b7280')
      .style('font-family', 'monospace')
      .text(`y = ${results.slope.toFixed(0)}x`);

    panel.append('text')
      .attr('x', 15)
      .attr('y', 235)
      .style('font-size', '11px')
      .style('fill', '#6b7280')
      .style('font-family', 'monospace')
      .text(`${results.intercept >= 0 ? '+' : ''}${results.intercept.toFixed(0)}`);

    // Interpretation
    panel.append('text')
      .attr('x', 15)
      .attr('y', 260)
      .style('font-size', '10px')
      .style('fill', '#6b7280')
      .style('font-style', 'italic')
      .text(`${results.rSquared > 0.7 ? 'Strong' : results.rSquared > 0.3 ? 'Moderate' : 'Weak'} trend`);

    panel.append('text')
      .attr('x', 15)
      .attr('y', 275)
      .style('font-size', '10px')
      .style('fill', '#6b7280')
      .style('font-style', 'italic')
      .text(`explains ${(results.rSquared * 100).toFixed(0)}% of variance`);
  }

  function addRegressionLegend(g, width) {
    const legend = g.append('g')
      .attr('class', 'regression-legend')
      .attr('transform', `translate(${width - 200}, 20)`);

    // Background
    legend.append('rect')
      .attr('width', 180)
      .attr('height', 90)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 6)
      .style('opacity', 0.95);

    // Actual data
    legend.append('circle')
      .attr('cx', 15)
      .attr('cy', 20)
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 25)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text('Actual Data');

    // Regression line
    legend.append('line')
      .attr('x1', 10)
      .attr('x2', 25)
      .attr('y1', 40)
      .attr('y2', 40)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 45)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text('Regression Line');

    // Confidence band
    legend.append('rect')
      .attr('x', 10)
      .attr('y', 55)
      .attr('width', 15)
      .attr('height', 10)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.2);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 65)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text('95% Confidence');
  }

  function addTrendAnalysis(g, results, xScale, yScale, width) {
    // Add trend direction arrow
    const arrowX = width - 100;
    const arrowY = 60;
    
    if (results.direction !== 'stable') {
      const arrow = g.append('g')
        .attr('transform', `translate(${arrowX}, ${arrowY})`);

      if (results.direction === 'increasing') {
        arrow.append('polygon')
          .attr('points', '0,0 10,10 -10,10')
          .attr('fill', '#16a34a')
          .attr('transform', 'rotate(180)');
      } else {
        arrow.append('polygon')
          .attr('points', '0,0 10,10 -10,10')
          .attr('fill', '#dc2626');
      }

      arrow.append('text')
        .attr('x', 0)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', results.direction === 'increasing' ? '#16a34a' : '#dc2626')
        .text(results.direction === 'increasing' ? 'TREND UP' : 'TREND DOWN');
    }
  }

  // Tooltip functions
  function showTooltip(event, d, results) {
    const predicted = results.predictions.find(p => p.year === d.year);
    const residual = predicted ? predicted.residual : 0;
    const residualPercent = d.totalFines > 0 ? (residual / d.totalFines * 100).toFixed(1) : 0;

    if (!window.regressionTooltip) {
      window.regressionTooltip = d3.select('body')
        .append('div')
        .attr('id', 'regression-tooltip')
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
        .style('z-index', 1001);
    }

    window.regressionTooltip
      .style('visibility', 'visible')
      .html(`
        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
          <strong>${d.year}</strong>
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Actual Fines:</strong> ${d.totalFines.toLocaleString()}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Predicted:</strong> ${predicted ? predicted.predicted.toFixed(0) : 'N/A'}
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Residual:</strong> <span style="color: ${residual > 0 ? '#16a34a' : '#dc2626'};">${residual > 0 ? '+' : ''}${residual.toFixed(0)} (${residualPercent}%)</span>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px;">
          Records: ${d.records.toLocaleString()}<br>
          ${residual > 0 ? 'Above' : 'Below'} trend line
        </div>
      `);
  }

  function moveTooltip(event) {
    if (window.regressionTooltip) {
      window.regressionTooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 15) + 'px');
    }
  }

  function hideTooltip() {
    if (window.regressionTooltip) {
      window.regressionTooltip.style('visibility', 'hidden');
    }
  }

  // Listen for data ready and filter changes
  function setupListeners() {
    document.addEventListener('roadSafetyDataReady', renderRegressionAnalysis);
    
    const yearStart = document.getElementById('year-start');
    const yearEnd = document.getElementById('year-end');
    const jurisdictionList = document.getElementById('checkbox-list');
    const confidenceSelect = document.getElementById('confidence-level');
    const runAnalysisBtn = document.getElementById('run-analysis');

    if (yearStart) yearStart.addEventListener('input', renderRegressionAnalysis);
    if (yearEnd) yearEnd.addEventListener('input', renderRegressionAnalysis);
    if (jurisdictionList) jurisdictionList.addEventListener('change', renderRegressionAnalysis);
    if (confidenceSelect) confidenceSelect.addEventListener('change', renderRegressionAnalysis);
    if (runAnalysisBtn) runAnalysisBtn.addEventListener('click', renderRegressionAnalysis);
  }

  // Initial render if data is already loaded
  if (window.roadSafetyData && window.roadSafetyData.raw) {
    renderRegressionAnalysis();
  }
  setupListeners();
});