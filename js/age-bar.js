// Enhanced jurisdictionMap.js with storytelling elements
// Replace your existing file in the js folder

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

  // Add context for storytelling
  const stateContext = {
    "New South Wales": "Implemented mobile phone detection cameras in 2019",
    "Victoria": "Leads in camera-based enforcement technology",
    "Queensland": "Increased fine rates by 27% since 2019",
    "Western Australia": "Camera enforcement doubled between 2018-2021",
    "South Australia": "Mixed enforcement approach with moderate fine rates",
    "Tasmania": "Lower fine rates despite high per capita car ownership",
    "Northern Territory": "Lowest fine rates but highest road fatality rate",
    "Australian Capital Territory": "High urban density but relatively low fine rates"
  };

  // Create enhanced color scale function with storytelling colors
  // Use colors that communicate meaning - darker = more concerning
  function getColor(fines) {
    return fines > 800000 ? '#7f0000' : // Very high - deep red
           fines > 600000 ? '#b30000' : // High - red
           fines > 400000 ? '#d7301f' : // Above average - orange-red
           fines > 200000 ? '#ef6548' : // Moderate - orange
           fines > 100000 ? '#fc8d59' : // Below average - light orange
                            '#fdcc8a';  // Low - pale orange
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
      
      // Add title with storytelling focus
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text('Road Safety Fines by Jurisdiction');
      
      // Add subtitle with key story insight
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .text('Victoria and NSW account for over 60% of all fines');
      
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
      
      // Create a storytelling panel for key insights
      const panel = svg.append('g')
        .attr('class', 'story-panel')
        .attr('transform', `translate(20, 80)`);
      
      panel.append('rect')
        .attr('width', 220)
        .attr('height', 120)
        .attr('fill', 'white')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1)
        .attr('rx', 6)
        .attr('opacity', 0.9);
      
      panel.append('text')
        .attr('x', 15)
        .attr('y', 25)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('Key Geographic Insights:');
      
      panel.append('text')
        .attr('x', 15)
        .attr('y', 50)
        .attr('font-size', '12px')
        .text('• NSW & VIC have highest enforcement');
      
      panel.append('text')
        .attr('x', 15)
        .attr('y', 70)
        .attr('font-size', '12px')
        .text('• NT has lowest fines but highest fatality rate');
      
      panel.append('text')
        .attr('x', 15)
        .attr('y', 90)
        .attr('font-size', '12px')
        .text('• Camera usage varies significantly by state');
      
      panel.append('text')
        .attr('x', 15)
        .attr('y', 110)
        .attr('font-size', '12px')
        .style('font-style', 'italic')
        .text('Hover states for more details →');
      
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
              
              // Show enhanced tooltip with storytelling context
              const stateName = d.properties.STATE_NAME;
              // Get current fines value (will be updated when filters change)
              const currentFines = d3.select(this).attr('data-fines') || 
                                   window.roadSafetyData.finesData.totals[stateName] || 0;
              
              // Calculate percentage of total for context
              const totalFines = Object.values(window.roadSafetyData.finesData.totals).reduce((a, b) => a + b, 0);
              const percentage = ((currentFines / totalFines) * 100).toFixed(1);
              
              const tooltip = d3.select('#map-tooltip');
              tooltip.style('display', 'block')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 30) + 'px')
                .html(`
                  <strong>${stateName}</strong><br>
                  Fines: $${Number(currentFines).toLocaleString()}<br>
                  <span style="font-size: 11px;">${percentage}% of national total</span>
                  <hr style="margin: 5px 0; border-color: #555;">
                  <span style="font-size: 11px; font-style: italic;">${stateContext[stateName] || ''}</span>
                `);
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
              
              // Make text white on darker backgrounds for readability
              if (['#7f0000', '#b30000', '#d7301f'].includes(backgroundColor)) {
                return '#ffffff';
              }
              return '#000000';
            })
            .attr('stroke', d => {
              const stateName = d.properties.STATE_NAME;
              const finesData = window.roadSafetyData.finesData.totals;
              const backgroundColor = getColor(finesData[stateName] || 0);
              
              if (['#7f0000', '#b30000', '#d7301f'].includes(backgroundColor)) {
                return '#650000';
              }
              return '#ffffff';
            })
            .attr('stroke-width', 0.5)
            .attr('paint-order', 'stroke')
            .text(d => d.properties.STATE_CODE);
          
          // Store labels for later updates
          mapElements.labels = labels;
          
          // Add improved legend with clearer description
          const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(width - 220, 80)');
          
          // Add legend background
          legend.append('rect')
            .attr('x', width - 220)
            .attr('y', 80)
            .attr('width', 200)
            .attr('height', 180)
            .attr('fill', 'white')
            .attr('opacity', 0.9)
            .attr('rx', 5)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);

          // Add legend title
          legend.append('text')
            .attr('x', width - 210)
            .attr('y', 100)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text('Enforcement Intensity');

          const legendData = [
            {color: '#7f0000', label: '> 800,000 fines', description: 'Very High'},
            {color: '#b30000', label: '600,000 - 800,000', description: 'High'},
            {color: '#d7301f', label: '400,000 - 600,000', description: 'Above Average'},
            {color: '#ef6548', label: '200,000 - 400,000', description: 'Moderate'},
            {color: '#fc8d59', label: '100,000 - 200,000', description: 'Below Average'},
            {color: '#fdcc8a', label: '< 100,000', description: 'Low'}
          ];

          legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(${width - 210}, ${120 + i * 22})`)
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
                .attr('font-size', '11px')
                .text(`${d.label} (${d.description})`);
            });
          
          // Add attribution with data citation
          svg.append('text')
            .attr('x', width - 10)
            .attr('y', height - 10)
            .attr('text-anchor', 'end')
            .attr('font-size', '10px')
            .attr('fill', '#999')
            .text('Data: BITRE Road Safety Enforcement Database 2008-2023');
          
          // Initialize the map with the default data
          updateMapColors(window.roadSafetyData.finesData.totals);
          
          // Add a call-to-action for interaction
          svg.append('text')
            .attr('x', width/2)
            .attr('y', height - 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('font-style', 'italic')
            .attr('fill', '#666')
            .text('Try filtering by year and detection method to see patterns change');
          
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
          
          if (['#7f0000', '#b30000', '#d7301f'].includes(backgroundColor)) {
            return '#ffffff';
          }
          return '#000000';
        })
        .attr('stroke', d => {
          const stateName = d.properties.STATE_NAME;
          const backgroundColor = getColor(finesData[stateName] || 0);
          
          if (['#7f0000', '#b30000', '#d7301f'].includes(backgroundColor)) {
            return '#650000';
          }
          return '#ffffff';
        });
    }
    
    // Get the top state for storytelling
    const states = Object.keys(finesData);
    let topState = "";
    let maxFines = 0;
    
    states.forEach(state => {
      if (finesData[state] > maxFines) {
        maxFines = finesData[state];
        topState = state;
      }
    });
    
    // Update storytelling panel with dynamic insight
    const storyPanel = d3.select('.story-panel');
    if (!storyPanel.empty()) {
      storyPanel.selectAll('text').filter((d, i) => i === 3) // Update the 4th text element
        .text(`• ${topState} has highest enforcement rate`);
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
  
  // Add tooltip div if it doesn't exist, with enhanced styling
  if (!document.getElementById('map-tooltip')) {
    const tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '10px 12px';
    tooltip.style.background = 'rgba(0,0,0,0.85)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.fontSize = '14px';
    tooltip.style.maxWidth = '250px';
    tooltip.style.boxShadow = '0 3px 14px rgba(0,0,0,0.4)';
    document.body.appendChild(tooltip);
  }
  
  // Listen for data ready event
  document.addEventListener('roadSafetyDataReady', initializeMap);
  
  // If data is already loaded, initialize the map
  if (window.roadSafetyData) {
    initializeMap();
  }
});