// jurisdictionMap.js - Map visualization for Australian road safety enforcement data
// Place this file in the js folder of your project

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the jurisdiction map page
  const mapContainer = document.getElementById('jurisdiction-map');
  if (!mapContainer) return;

  // Australia GeoJSON data with proper coordinates for each jurisdiction
  const australiaGeoJSON = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "name": "NSW", "fullName": "New South Wales" },
        "geometry": { "type": "Polygon", "coordinates": [[[149.0, -35.0], [153.0, -35.0], [153.0, -28.0], [149.0, -28.0], [149.0, -35.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "VIC", "fullName": "Victoria" },
        "geometry": { "type": "Polygon", "coordinates": [[[141.0, -39.0], [150.0, -39.0], [150.0, -34.0], [141.0, -34.0], [141.0, -39.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "QLD", "fullName": "Queensland" },
        "geometry": { "type": "Polygon", "coordinates": [[[138.0, -29.0], [154.0, -29.0], [154.0, -10.0], [138.0, -10.0], [138.0, -29.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "SA", "fullName": "South Australia" },
        "geometry": { "type": "Polygon", "coordinates": [[[129.0, -38.0], [141.0, -38.0], [141.0, -26.0], [129.0, -26.0], [129.0, -38.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "WA", "fullName": "Western Australia" },
        "geometry": { "type": "Polygon", "coordinates": [[[113.0, -35.0], [129.0, -35.0], [129.0, -14.0], [113.0, -14.0], [113.0, -35.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "TAS", "fullName": "Tasmania" },
        "geometry": { "type": "Polygon", "coordinates": [[[144.0, -43.0], [148.5, -43.0], [148.5, -40.0], [144.0, -40.0], [144.0, -43.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "NT", "fullName": "Northern Territory" },
        "geometry": { "type": "Polygon", "coordinates": [[[129.0, -26.0], [138.0, -26.0], [138.0, -11.0], [129.0, -11.0], [129.0, -26.0]]] }
      },
      {
        "type": "Feature",
        "properties": { "name": "ACT", "fullName": "Australian Capital Territory" },
        "geometry": { "type": "Polygon", "coordinates": [[[148.8, -35.8], [149.4, -35.8], [149.4, -35.1], [148.8, -35.1], [148.8, -35.8]]] }
      }
    ]
  };

  // Sample fine data by jurisdiction
  const finesByJurisdiction = {
    "NSW": 850000,
    "VIC": 920000,
    "QLD": 620000,
    "SA": 380000,
    "WA": 450000,
    "TAS": 150000,
    "NT": 110000,
    "ACT": 95000
  };

  // Create color scale function
  function getColor(fines) {
    return fines > 800000 ? '#08306b' :
           fines > 600000 ? '#2171b5' :
           fines > 400000 ? '#4292c6' :
           fines > 200000 ? '#6baed6' :
           fines > 100000 ? '#9ecae1' :
                            '#deebf7';
  }

  // Map configuration
  const width = 800;
  const height = 600;
  const projection = d3.geoMercator()
    .center([133, -27])
    .scale(1000)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Create SVG element
  const svg = d3.select('#jurisdiction-map')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'max-width: 100%; height: auto;');

  // Create a group for the map
  const map = svg.append('g');

  // Add jurisdictions
  map.selectAll('.jurisdiction')
    .data(australiaGeoJSON.features)
    .enter()
    .append('path')
    .attr('class', 'jurisdiction')
    .attr('d', path)
    .attr('fill', d => getColor(finesByJurisdiction[d.properties.name]))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .on('mouseover', function(event, d) {
      // Show tooltip on hover
      const fines = finesByJurisdiction[d.properties.name].toLocaleString();
      d3.select('#map-tooltip')
        .style('display', 'block')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 30) + 'px')
        .html(`<strong>${d.properties.fullName}</strong><br>Fines: ${fines}`);
      
      // Highlight the current jurisdiction
      d3.select(this)
        .attr('stroke', '#000')
        .attr('stroke-width', 2);
    })
    .on('mouseout', function() {
      // Hide tooltip
      d3.select('#map-tooltip').style('display', 'none');
      
      // Remove highlight
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    });

  // Add jurisdiction labels
  map.selectAll('.jurisdiction-label')
    .data(australiaGeoJSON.features)
    .enter()
    .append('text')
    .attr('class', 'jurisdiction-label')
    .attr('transform', d => `translate(${path.centroid(d)})`)
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#000')
    .text(d => d.properties.name);

  // Add legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(20, 20)');

  const legendData = [
    {color: '#08306b', label: '> 800,000'},
    {color: '#2171b5', label: '600,000 - 800,000'},
    {color: '#4292c6', label: '400,000 - 600,000'},
    {color: '#6baed6', label: '200,000 - 400,000'},
    {color: '#9ecae1', label: '100,000 - 200,000'},
    {color: '#deebf7', label: '< 100,000'}
  ];

  legend.selectAll('.legend-item')
    .data(legendData)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
    .each(function(d) {
      d3.select(this)
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d.color);
      
      d3.select(this)
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('font-size', '12px')
        .text(d.label);
    });

  // Add tooltip div if it doesn't exist
  if (!document.getElementById('map-tooltip')) {
    const tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    tooltip.className = 'tooltip';
    tooltip.style.display = 'none';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px';
    tooltip.style.background = 'rgba(0, 0, 0, 0.7)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    document.body.appendChild(tooltip);
  }

  // Function to update map with filtered data
  window.updateJurisdictionMap = function(year = 'All', detectionMethod = 'All') {
    console.log(`Updating map for year: ${year}, method: ${detectionMethod}`);
    
    // This is where you would filter your data based on selected criteria
    // For a real implementation using actual CSV data, you would:
    // 1. Filter the data by year and detection method
    // 2. Aggregate total fines by jurisdiction
    // 3. Update the map colors with the new data
    
    // Here's a placeholder that just applies random adjustments
    const filteredData = {};
    Object.keys(finesByJurisdiction).forEach(jurisdiction => {
      const randomFactor = 0.7 + Math.random() * 0.6; // Factor between 0.7 and 1.3
      filteredData[jurisdiction] = Math.round(finesByJurisdiction[jurisdiction] * randomFactor);
    });
    
    // Update the map colors with transition
    map.selectAll('.jurisdiction')
      .transition()
      .duration(750)
      .attr('fill', d => getColor(filteredData[d.properties.name]));
  };
});