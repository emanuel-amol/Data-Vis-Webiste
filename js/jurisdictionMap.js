// jurisdictionMap.js - Fixed to work with dataLoader.js and GitHub GeoJSON
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.getElementById('jurisdiction-map');
  if (!mapContainer) return;
  
  // Map state abbreviations to full names
  const stateAbbreviations = {
    "NSW": "New South Wales",
    "VIC": "Victoria",
    "QLD": "Queensland",
    "SA": "South Australia",
    "WA": "Western Australia",
    "TAS": "Tasmania",
    "NT": "Northern Territory",
    "ACT": "Australian Capital Territory"
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

  // Variable to store the created map elements
  let mapElements = {
    svg: null,
    map: null,
    paths: null,
    labels: null
  };

  // Function to initialize the map
  function initializeMap() {
    if (!window.roadSafetyData || !window.roadSafetyData.finesData) {
      console.error("Road safety data not available");
      return;
    }
    
    console.log("Initializing map with data:", window.roadSafetyData);
    
    // Create map dimensions
    const width = 800;
    const height = 600;
    
    try {
      // Clear previous content
      mapContainer.innerHTML = '';
      
      // Create SVG element
      const svg = d3.select('#jurisdiction-map')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background-color', '#ffffff')
        .style('border', '1px solid #ddd');
      
      // Store the SVG element
      mapElements.svg = svg;
      
      // Add loading text
      const loading = svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .text('Loading map data...');
      
      // Create a group for the map
      const map = svg.append('g');
      mapElements.map = map;
      
      // Load the GeoJSON from GitHub
      d3.json('https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json')
        .then(function(geojson) {
          // Remove loading text
          loading.remove();
          
          // Create projection
          const projection = d3.geoMercator()
            .center([134, -28])
            .scale(850)
            .translate([width / 1.8, height / 1.9]);
          
          // Create path generator
          const path = d3.geoPath().projection(projection);
          
          // Draw states (initially with all data)
          const paths = map.selectAll('.state')
            .data(geojson.features)
            .enter()
            .append('path')
            .attr('class', d => `state ${d.properties.STATE_NAME.replace(/\s+/g, '-').toLowerCase()}`)
            .attr('d', path)
            .attr('fill', d => {
              const stateName = d.properties.STATE_NAME;
              const finesData = window.roadSafetyData.finesData.totals;
              return getColor(finesData[stateName] || 0);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .on('mouseover', function(event, d) {
              // Highlight state
              d3.select(this)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.5);
              
              // Show tooltip
              const stateName = d.properties.STATE_NAME;
              // Get current fines value (will be updated when filters change)
              const currentFines = d3.select(this).attr('data-fines') || 
                                   window.roadSafetyData.finesData.totals[stateName] || 0;
              
              const tooltip = d3.select('#map-tooltip');
              tooltip.style('display', 'block')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px')
                .html(`<strong>${stateName}</strong><br>Fines: $${Number(currentFines).toLocaleString()}`);
            })
            .on('mouseout', function() {
              // Restore appearance
              d3.select(this)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5);
              
              // Hide tooltip
              d3.select('#map-tooltip').style('display', 'none');
            });
          
          // Store paths for later updates
          mapElements.paths = paths;
          
          // Add state labels
          const labels = map.selectAll('.state-label')
            .data(geojson.features)
            .enter()
            .append('text')
            .attr('class', 'state-label')
            .attr('transform', d => {
              const centroid = path.centroid(d);
              return `translate(${centroid[0]},${centroid[1]})`;
            })
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', d => {
              const stateName = d.properties.STATE_NAME;
              const finesData = window.roadSafetyData.finesData.totals;
              const backgroundColor = getColor(finesData[stateName] || 0);
              
              if (backgroundColor === '#08306b' || backgroundColor === '#2171b5') {
                return '#ffffff';
              }
              return '#000000';
            })
            .attr('stroke', d => {
              const stateName = d.properties.STATE_NAME;
              const finesData = window.roadSafetyData.finesData.totals;
              const backgroundColor = getColor(finesData[stateName] || 0);
              
              if (backgroundColor === '#08306b' || backgroundColor === '#2171b5') {
                return '#08306b';
              }
              return '#ffffff';
            })
            .attr('stroke-width', 0.5)
            .attr('paint-order', 'stroke')
            .text(d => d.properties.STATE_CODE);
          
          // Store labels for later updates
          mapElements.labels = labels;
          
          // Add legend
          const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20, 20)');
          
          // Add legend background
          legend.append('rect')
            .attr('x', -10)
            .attr('y', -10)
            .attr('width', 170)
            .attr('height', 150)
            .attr('fill', 'white')
            .attr('opacity', 0.9)
            .attr('rx', 5)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);

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
                .attr('fill', d.color)
                .attr('stroke', '#999')
                .attr('stroke-width', 0.5);
              
              d3.select(this)
                .append('text')
                .attr('x', 25)
                .attr('y', 12)
                .attr('font-size', '12px')
                .text(d.label);
            });
          
          // Add title
          svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#333')
            .text('Road Safety Fines by Jurisdiction');
          
          // Add attribution
          svg.append('text')
            .attr('x', width - 10)
            .attr('y', height - 10)
            .attr('text-anchor', 'end')
            .attr('font-size', '10px')
            .attr('fill', '#999')
            .text('© Road Safety Enforcement Data Visualization');
          
          // Initialize the map with the default data
          updateMapColors(window.roadSafetyData.finesData.totals);
          
          console.log("Map initialization complete");
        })
        .catch(function(error) {
          console.error("Error loading GeoJSON:", error);
          loading.remove();
          mapContainer.innerHTML = `<div style="color: red; padding: 20px;">Error loading map data: ${error.message}</div>`;
        });
        
    } catch (error) {
      console.error("Error initializing map:", error);
      mapContainer.innerHTML = `<div style="color: red; padding: 20px;">Error initializing map: ${error.message}</div>`;
    }
  }
  
  // Function to update map colors based on filtered data
  function updateMapColors(finesData) {
    if (!mapElements.paths) {
      console.warn("Map paths not available for updating");
      return;
    }
    
    console.log("Updating map colors with data:", finesData);
    
    mapElements.paths
      .attr('data-fines', d => finesData[d.properties.STATE_NAME] || 0)
      .transition()
      .duration(750)
      .attr('fill', d => getColor(finesData[d.properties.STATE_NAME] || 0));
    
    // Update label colors based on new background colors
    if (mapElements.labels) {
      mapElements.labels
        .transition()
        .duration(750)
        .attr('fill', d => {
          const stateName = d.properties.STATE_NAME;
          const backgroundColor = getColor(finesData[stateName] || 0);
          
          if (backgroundColor === '#08306b' || backgroundColor === '#2171b5') {
            return '#ffffff';
          }
          return '#000000';
        })
        .attr('stroke', d => {
          const stateName = d.properties.STATE_NAME;
          const backgroundColor = getColor(finesData[stateName] || 0);
          
          if (backgroundColor === '#08306b' || backgroundColor === '#2171b5') {
            return '#08306b';
          }
          return '#ffffff';
        });
    }
  }

  // Function to filter data based on selected years and detection methods
  function getFilteredData() {
    if (!window.roadSafetyData || !window.roadSafetyData.finesData) {
      console.warn("Road safety data not available for filtering");
      return null;
    }
    
    const finesData = window.roadSafetyData.finesData;
    
    // Get selected years
    const yearCheckboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    const selectedYears = Array.from(yearCheckboxes).map(cb => cb.value);
    
    // Get selected detection methods
    const methodCheckboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    const selectedMethods = Array.from(methodCheckboxes).map(cb => cb.value);
    
    console.log("Filter selection - Years:", selectedYears, "Methods:", selectedMethods);
    
    // If no specific selections, return total data
    if (selectedYears.length === 0 && selectedMethods.length === 0) {
      return finesData.totals;
    }
    
    // Initialize result with zeros for all states
    const result = {};
    Object.keys(finesData.totals).forEach(state => {
      result[state] = 0;
    });
    
    // Apply filters
    const yearsToUse = selectedYears.length > 0 ? selectedYears : finesData.years;
    const methodsToUse = selectedMethods.length > 0 ? selectedMethods : finesData.methods;
    
    // Sum up data based on filters
    yearsToUse.forEach(year => {
      if (finesData.byYearAndMethod[year]) {
        methodsToUse.forEach(method => {
          if (finesData.byYearAndMethod[year][method]) {
            Object.keys(finesData.byYearAndMethod[year][method]).forEach(state => {
              result[state] += finesData.byYearAndMethod[year][method][state];
            });
          }
        });
      }
    });
    
    console.log("Filtered data result:", result);
    return result;
  }
  
  // Function to update the map based on filtered data
  function updateMapWithFilteredData() {
    const filteredData = getFilteredData();
    if (filteredData) {
      updateMapColors(filteredData);
    }
  }
  
  // Expose the update function to the global scope
  window.updateJurisdictionMap = function() {
    console.log("updateJurisdictionMap called");
    if (!mapElements.svg) {
      if (window.roadSafetyData) {
        initializeMap();
      } else {
        console.log("Data not loaded yet, waiting for data ready event");
        document.addEventListener('roadSafetyDataReady', initializeMap);
      }
    } else {
      updateMapWithFilteredData();
    }
  };
  
  // Add tooltip div if it doesn't exist
  if (!document.getElementById('map-tooltip')) {
    const tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px';
    tooltip.style.background = 'rgba(0,0,0,0.7)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.fontSize = '14px';
    document.body.appendChild(tooltip);
  }
  
  // Listen for data ready event
  document.addEventListener('roadSafetyDataReady', initializeMap);
  
  // If data is already loaded, initialize the map
  if (window.roadSafetyData) {
    initializeMap();
  }
});