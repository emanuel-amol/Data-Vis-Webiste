// Australian choropleth map with filter compatibility
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.getElementById('jurisdiction-map');
  if (!mapContainer) return;
  
  // Sample fine data by jurisdiction - will be filtered based on user selections
  const allFinesByJurisdiction = {
    "New South Wales": 850000,
    "Victoria": 920000,
    "Queensland": 620000,
    "South Australia": 380000,
    "Western Australia": 450000,
    "Tasmania": 150000,
    "Northern Territory": 110000,
    "Australian Capital Territory": 95000
  };

  // Sample data by years and detection methods (you'll replace with real data)
  const dataByYearAndMethod = {
    "2023": {
      "Camera": {
        "New South Wales": 500000,
        "Victoria": 550000,
        "Queensland": 350000,
        "South Australia": 200000,
        "Western Australia": 250000,
        "Tasmania": 80000,
        "Northern Territory": 60000,
        "Australian Capital Territory": 50000
      },
      "Police": {
        "New South Wales": 350000,
        "Victoria": 370000,
        "Queensland": 270000,
        "South Australia": 180000,
        "Western Australia": 200000,
        "Tasmania": 70000,
        "Northern Territory": 50000,
        "Australian Capital Territory": 45000
      }
    },
    "2022": {
      "Camera": {
        "New South Wales": 480000,
        "Victoria": 530000,
        "Queensland": 330000,
        "South Australia": 190000,
        "Western Australia": 240000,
        "Tasmania": 75000,
        "Northern Territory": 55000,
        "Australian Capital Territory": 48000
      },
      "Police": {
        "New South Wales": 340000,
        "Victoria": 360000,
        "Queensland": 260000,
        "South Australia": 170000,
        "Western Australia": 190000,
        "Tasmania": 65000,
        "Northern Territory": 48000,
        "Australian Capital Territory": 43000
      }
    }
    // Add other years as needed
  };
  
  // Map short codes to full names
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

  // Function to initialize the map (called once)
  function initializeMap() {
    // Create map dimensions
    const width = 800;
    const height = 600;
    
    try {
      // Clear previous content
      mapContainer.innerHTML = '';
      
      // Create SVG element
      const svg = d3.select('#jurisdiction-map')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
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
      
      // Direct URL to the GeoJSON file
      const geoJsonUrl = 'https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json';

      // Load the GeoJSON file
      d3.json(geoJsonUrl).then(function(geojson) {
        // Remove loading text
        loading.remove();
        
        // Create projection
        const projection = d3.geoMercator()
          .center([134, -28])
          .scale(850)
          .translate([width / 2, height / 2.4]);
        
        // Create path generator
        const path = d3.geoPath().projection(projection);

        // Custom function to transform Tasmania
        function transformState(d) {
          if (d.properties.STATE_NAME === "Tasmania") {
            return "translate(0, -40)";
          }
          return "";
        }
        
        // Draw states (initially with all data)
        const paths = map.selectAll('.state')
          .data(geojson.features)
          .enter()
          .append('path')
          .attr('class', d => `state ${d.properties.STATE_NAME.replace(/\s+/g, '-').toLowerCase()}`)
          .attr('d', path)
          .attr('transform', transformState)
          .attr('fill', d => {
            const stateName = d.properties.STATE_NAME;
            return getColor(allFinesByJurisdiction[stateName] || 0);
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
                                 allFinesByJurisdiction[stateName] || 0;
            
            const tooltip = d3.select('#map-tooltip');
            tooltip.style('display', 'block')
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 30) + 'px')
              .html(`<strong>${stateName}</strong><br>Fines: ${Number(currentFines).toLocaleString()}`);
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
            let transform = `translate(${centroid[0]},${centroid[1]})`;
            
            if (d.properties.STATE_NAME === "Tasmania") {
              transform += " translate(0, -40)";
            }
            
            return transform;
          })
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', d => {
            const stateName = d.properties.STATE_NAME;
            const backgroundColor = getColor(allFinesByJurisdiction[stateName] || 0);
            
            if (backgroundColor === '#08306b' || backgroundColor === '#2171b5') {
              return '#ffffff';
            }
            return '#000000';
          })
          .attr('stroke', d => {
            const stateName = d.properties.STATE_NAME;
            const backgroundColor = getColor(allFinesByJurisdiction[stateName] || 0);
            
            if (backgroundColor === '#08306b' || backgroundColor === '#2171b5') {
              return '#08306b';
            }
            return '#ffffff';
          })
          .attr('stroke-width', 0.5)
          .attr('paint-order', 'stroke')
          .text(d => {
            const fullName = d.properties.STATE_NAME;
            for (const [abbr, name] of Object.entries(stateAbbreviations)) {
              if (name === fullName) return abbr;
            }
            return '';
          });
        
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
        updateMapColors(allFinesByJurisdiction);
      })
      .catch(function(error) {
        console.error("Error loading GeoJSON:", error);
        mapContainer.innerHTML = `<div style="color: red; padding: 20px;">Error loading map data: ${error.message}</div>`;
      });

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
    } catch (error) {
      console.error("Error initializing map:", error);
      mapContainer.innerHTML = `<div style="color: red; padding: 20px;">Error initializing map: ${error.message}</div>`;
    }
  }
  
  // Function to update map colors based on filtered data
  function updateMapColors(finesData) {
    if (!mapElements.paths) return;
    
    mapElements.paths
      .attr('data-fines', d => finesData[d.properties.STATE_NAME] || 0)
      .transition()
      .duration(750)
      .attr('fill', d => getColor(finesData[d.properties.STATE_NAME] || 0));
    
    // Update label colors based on new background colors
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

  // Function to filter data based on selected years and detection methods
  function getFilteredData() {
    // Get selected years
    const yearCheckboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    const selectedYears = Array.from(yearCheckboxes).map(cb => cb.value);
    
    // Get selected detection methods
    const methodCheckboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"]):checked');
    const selectedMethods = Array.from(methodCheckboxes).map(cb => cb.value);
    
    // If no specific selections, return all data
    if (selectedYears.length === 0 && selectedMethods.length === 0) {
      return allFinesByJurisdiction;
    }
    
    // Initialize result with zeros
    const result = {};
    Object.keys(allFinesByJurisdiction).forEach(state => {
      result[state] = 0;
    });
    
    // Apply filters
    const yearsToUse = selectedYears.length > 0 ? selectedYears : Object.keys(dataByYearAndMethod);
    const methodsToUse = selectedMethods.length > 0 ? selectedMethods : ["Camera", "Police"];
    
    // Sum up data based on filters
    yearsToUse.forEach(year => {
      if (dataByYearAndMethod[year]) {
        methodsToUse.forEach(method => {
          if (dataByYearAndMethod[year][method]) {
            Object.keys(dataByYearAndMethod[year][method]).forEach(state => {
              result[state] += dataByYearAndMethod[year][method][state];
            });
          }
        });
      }
    });
    
    return result;
  }
  
  // Initialize map on first load
  initializeMap();
  
  // Connect to your existing filter UI
  // These should match the functions you already have in script.js
  
  // Add to your existing updateCharts function
  window.updateCharts = function() {
    // Get filtered data based on selections
    const filteredData = getFilteredData();
    // Update map with filtered data
    updateMapColors(filteredData);
  };
  
  // Modify your reset button handler
  const resetButton = document.getElementById('reset');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      // Your existing reset code here
      
      // Additionally, reset the map
      updateMapColors(allFinesByJurisdiction);
    });
  }
  
  // Add tab switching functionality
  document.querySelectorAll('.viz-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // If the Map View tab is clicked
      if (this.textContent.trim() === 'Map View') {
        // Make sure the map is properly initialized
        if (!mapElements.svg) {
          initializeMap();
        }
      }
    });
  });
});