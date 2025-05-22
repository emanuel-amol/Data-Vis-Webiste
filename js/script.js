// Fixed main script.js - Enhanced with real data integration and error handling
// Replace existing js/script.js with this file

document.addEventListener("DOMContentLoaded", () => {
  console.log("Main script initialized");
  
  // Initialize global state
  window.currentFilters = {
    jurisdictions: [],
    years: [],
    detectionMethods: []
  };

  // Enhanced dropdown toggle functions
  window.toggleDropdown = function() {
    const dropdownList = document.getElementById('checkbox-list');
    if (dropdownList) {
      const isVisible = dropdownList.style.display === 'block';
      hideAllDropdowns();
      if (!isVisible) {
        dropdownList.style.display = 'block';
      }
    }
  };

  window.toggleYearDropdown = function() {
    const dropdownList = document.getElementById('year-checkbox-list');
    if (dropdownList) {
      const isVisible = dropdownList.style.display === 'block';
      hideAllDropdowns();
      if (!isVisible) {
        dropdownList.style.display = 'block';
      }      
    }
  };

  window.toggleDetectionDropdown = function() {
    const dropdownList = document.getElementById('detection-checkbox-list');
    if (dropdownList) {
      const isVisible = dropdownList.style.display === 'block';
      hideAllDropdowns();
      if (!isVisible) {
        dropdownList.style.display = 'block';
      }
    }
  };

  function hideAllDropdowns() {
    const dropdowns = [
      'checkbox-list',
      'year-checkbox-list', 
      'detection-checkbox-list'
    ];
    
    dropdowns.forEach(id => {
      const dropdown = document.getElementById(id);
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    });
  }

  // Enhanced toggle all functions with validation
  window.toggleAll = function(checkbox) {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateSelection();
  };

  window.toggleAllYears = function(checkbox) {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateYearSelection();
  };

  window.toggleAllDetection = function(checkbox) {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateDetectionSelection();
  };

  // Enhanced selection update functions with state management
  window.updateSelection = function() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#checkbox-list input[value="All"]');
    const output = document.getElementById('selected-output');

    if (!output) return;

    const selected = [];
    let allSelected = true;

    checkboxes.forEach(cb => {
      if (cb.checked) {
        selected.push(cb.value);
      } else {
        allSelected = false;
      }
    });

    // Update the "All" checkbox state
    if (allCheckbox) {
      allCheckbox.checked = allSelected;
    }

    // Update display text
    if (selected.length === 0) {
      output.textContent = 'Selected: None';
    } else if (allSelected) {
      output.textContent = 'Selected: All';
    } else {
      const displayText = selected.length > 3 
        ? `Selected: ${selected.slice(0, 3).join(', ')} +${selected.length - 3} more`
        : `Selected: ${selected.join(', ')}`;
      output.textContent = displayText;
    }

    // Update global state
    window.currentFilters.jurisdictions = selected;
    
    // Trigger chart updates with debouncing
    debounceUpdate();
  };

  window.updateYearSelection = function() {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#year-checkbox-list input[value="All"]');
    const output = document.getElementById('year-selected-output');
    
    if (!output) return;

    const selected = [];
    let allSelected = true;

    checkboxes.forEach(cb => {
      if (cb.checked) {
        selected.push(cb.value);
      } else {
        allSelected = false;
      }
    });

    if (allCheckbox) {
      allCheckbox.checked = allSelected;
    }

    if (selected.length === 0) {
      output.textContent = 'Selected: None';
    } else if (allSelected) {
      output.textContent = 'Selected: All';
    } else {
      const displayText = selected.length > 4 
        ? `Selected: ${selected.slice(0, 4).join(', ')} +${selected.length - 4} more`
        : `Selected: ${selected.join(', ')}`;
      output.textContent = displayText;
    }

    window.currentFilters.years = selected;
    debounceUpdate();
  };

  window.updateDetectionSelection = function() {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#detection-checkbox-list input[value="All"]');
    const output = document.getElementById('detection-selected-output');
    
    if (!output) return;

    const selected = [];
    let allSelected = true;

    checkboxes.forEach(cb => {
      if (cb.checked) {
        selected.push(cb.value);
      } else {
        allSelected = false;
      }
    });

    if (allCheckbox) {
      allCheckbox.checked = allSelected;
    }

    if (selected.length === 0) {
      output.textContent = 'Selected: None';
    } else if (allSelected) {
      output.textContent = 'Selected: All';
    } else {
      output.textContent = `Selected: ${selected.join(', ')}`;
    }

    window.currentFilters.detectionMethods = selected;
    debounceUpdate();
  };

  // Debounced update function to prevent excessive chart refreshes
  let updateTimeout;
  function debounceUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      console.log("Debounced update triggered with filters:", window.currentFilters);
      updateCharts();
    }, 300);
  }

  // Enhanced reset function
  function resetAllFilters() {
    console.log("Resetting all filters");

    // Reset year checkboxes
    const yearCheckboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]');
    yearCheckboxes.forEach(cb => cb.checked = cb.value === 'All');
    const yearOutput = document.getElementById('year-selected-output');
    if (yearOutput) yearOutput.textContent = 'Selected: All';

    // Reset detection checkboxes
    const detectionCheckboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]');
    detectionCheckboxes.forEach(cb => cb.checked = cb.value === 'All');
    const detectionOutput = document.getElementById('detection-selected-output');
    if (detectionOutput) detectionOutput.textContent = 'Selected: All';

    // Reset jurisdiction checkboxes
    const jurisdictionCheckboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]');
    jurisdictionCheckboxes.forEach(cb => cb.checked = cb.value === 'All');
    const jurisdictionOutput = document.getElementById('selected-output');
    if (jurisdictionOutput) jurisdictionOutput.textContent = 'Selected: All';

    // Reset global state
    window.currentFilters = {
      jurisdictions: [],
      years: [],
      detectionMethods: []
    };

    // Hide all dropdowns
    hideAllDropdowns();

    // Trigger update
    updateCharts();
  }

  // Attach reset button event
  const resetButton = document.getElementById('reset');
  if (resetButton) {
    resetButton.addEventListener('click', resetAllFilters);
  }

  // Enhanced chart update system with error handling
  window.updateCharts = function() {
    console.log("Global chart update requested");
    
    const updates = [];

    // Age analysis chart
    if (typeof window.updateChart === 'function') {
      updates.push({ name: 'Age Analysis', fn: window.updateChart });
    }

    // Time trends chart
    if (window.timeTrends && typeof window.timeTrends.updateChart === 'function') {
      updates.push({ name: 'Time Trends', fn: window.timeTrends.updateChart });
    }

    // Jurisdiction map
    if (typeof window.updateJurisdictionMap === 'function') {
      updates.push({ name: 'Jurisdiction Map', fn: window.updateJurisdictionMap });
    }

    // Jurisdiction line chart
    if (typeof window.updateJurisdictionLineChart === 'function') {
      updates.push({ name: 'Jurisdiction Line', fn: window.updateJurisdictionLineChart });
    }

    // Jurisdiction area chart
    if (typeof window.updateJurisdictionAreaChart === 'function') {
      updates.push({ name: 'Jurisdiction Area', fn: window.updateJurisdictionAreaChart });
    }

    // Enhanced age analysis
    if (window.enhancedAgeAnalysis && typeof window.enhancedAgeAnalysis.updateFilters === 'function') {
      updates.push({ name: 'Enhanced Age Analysis', fn: window.enhancedAgeAnalysis.updateFilters });
    }

    // Enhanced time trends
    if (window.enhancedTimeTrends && typeof window.enhancedTimeTrends.updateFilters === 'function') {
      updates.push({ name: 'Enhanced Time Trends', fn: window.enhancedTimeTrends.updateFilters });
    }

    // Execute all updates with error handling
    updates.forEach(update => {
      try {
        console.log(`Updating ${update.name}...`);
        update.fn();
      } catch (error) {
        console.error(`Error updating ${update.name}:`, error);
      }
    });

    if (updates.length === 0) {
      console.log("No chart update functions found");
    } else {
      console.log(`Updated ${updates.length} visualizations`);
    }
  };

  // Enhanced tabbed interface with loading states
  const tabs = document.querySelectorAll('.viz-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = tab.getAttribute('data-tab');
        
        console.log("Tab clicked:", targetTab);
        
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const contentElement = document.getElementById(targetTab);
        if (contentElement) {
          contentElement.style.display = 'block';
          
          // Initialize visualization based on tab with delay for DOM rendering
          setTimeout(() => {
            try {
              switch(targetTab) {
                case 'map-tab':
                  if (window.updateJurisdictionMap) {
                    window.updateJurisdictionMap();
                  }
                  break;
                case 'line-chart-tab':
                  if (window.updateJurisdictionLineChart) {
                    window.updateJurisdictionLineChart();
                  }
                  break;
                case 'stacked-area-tab':
                  if (window.updateJurisdictionAreaChart) {
                    window.updateJurisdictionAreaChart();
                  }
                  break;
                case 'per-capita-tab':
                case 'correlation-tab':
                case 'regression-tab':
                case 'statistical-tab':
                  // Advanced analysis tabs - trigger specific updates if available
                  if (window.updateAdvancedAnalysis) {
                    window.updateAdvancedAnalysis(targetTab);
                  }
                  break;
                case 'enhanced-time-trends':
                  if (window.enhancedTimeTrends) {
                    window.enhancedTimeTrends.updateFilters();
                  }
                  break;
                case 'enhanced-age-chart':
                  if (window.enhancedAgeAnalysis) {
                    window.enhancedAgeAnalysis.updateFilters();
                  }
                  break;
              }
            } catch (error) {
              console.error(`Error initializing ${targetTab}:`, error);
            }
          }, 100);
        }
      });
    });
    
    // Activate the first tab or the one marked active
    const activeTab = document.querySelector('.viz-tab.active') || tabs[0];
    if (activeTab) {
      setTimeout(() => {
        activeTab.click();
      }, 500); // Delay to ensure data is loaded
    }
  }

  // Enhanced click outside handler
  document.addEventListener('click', (e) => {
    const dropdownSelectors = [
      '.multi-select-wrapper',
      '#checkbox-list',
      '#year-checkbox-list',
      '#detection-checkbox-list'
    ];

    const clickedInsideDropdown = dropdownSelectors.some(selector => 
      e.target.closest(selector)
    );

    if (!clickedInsideDropdown) {
      hideAllDropdowns();
    }
  });

  // Data validation and error reporting
  window.validateDataIntegrity = function() {
    if (!window.roadSafetyData) {
      console.warn("Road safety data not loaded");
      return false;
    }

    const data = window.roadSafetyData;
    
    // Basic validation
    const checks = [
      { name: 'Raw data exists', test: () => data.raw && data.raw.length > 0 },
      { name: 'Processed data exists', test: () => data.processed },
      { name: 'Statistics available', test: () => data.stats },
      { name: 'Year data exists', test: () => data.processed.byYear && data.processed.byYear.length > 0 },
      { name: 'Age data exists', test: () => data.processed.byAgeGroup && data.processed.byAgeGroup.length > 0 },
      { name: 'Jurisdiction data exists', test: () => data.processed.byJurisdiction && data.processed.byJurisdiction.length > 0 }
    ];

    let allPassed = true;
    checks.forEach(check => {
      try {
        const passed = check.test();
        console.log(`✓ ${check.name}: ${passed ? 'PASS' : 'FAIL'}`);
        if (!passed) allPassed = false;
      } catch (error) {
        console.error(`✗ ${check.name}: ERROR`, error);
        allPassed = false;
      }
    });

    return allPassed;
  };

  // Initialize data validation when data loads
  document.addEventListener('roadSafetyDataReady', function(event) {
    console.log("Main script: Data ready event received");
    
    setTimeout(() => {
      const isValid = window.validateDataIntegrity();
      if (isValid) {
        console.log("✓ Data integrity validation passed");
        
        // Initialize default filter states
        updateSelection();
        updateYearSelection();
        updateDetectionSelection();
        
        // Trigger initial chart updates
        setTimeout(() => {
          updateCharts();
        }, 1000);
        
      } else {
        console.error("✗ Data integrity validation failed");
      }
    }, 500);
  });

  // Performance monitoring
  window.measurePerformance = function(name, fn) {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      console.log(`⏱️ ${name}: ${(endTime - startTime).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ ${name}: ${(endTime - startTime).toFixed(2)}ms (ERROR)`, error);
      throw error;
    }
  };

  // Accessibility improvements
  function enhanceAccessibility() {
    // Add keyboard navigation for dropdowns
    document.querySelectorAll('.select-box').forEach(selectBox => {
      selectBox.setAttribute('tabindex', '0');
      selectBox.setAttribute('role', 'button');
      selectBox.setAttribute('aria-haspopup', 'listbox');
      
      selectBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectBox.click();
        }
      });
    });

    // Add ARIA labels to checkboxes
    document.querySelectorAll('.checkbox-list input[type="checkbox"]').forEach(checkbox => {
      const label = checkbox.closest('label');
      if (label) {
        const labelText = label.textContent.trim();
        checkbox.setAttribute('aria-label', `Filter by ${labelText}`);
      }
    });

    // Add keyboard navigation for tabs
    document.querySelectorAll('.viz-tab').forEach(tab => {
      tab.setAttribute('tabindex', '0');
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tab.click();
        }
      });
    });
  }

  // Initialize accessibility enhancements
  enhanceAccessibility();

  // Add responsive behavior
  function handleResize() {
    // Trigger chart resize/redraw if needed
    if (window.innerWidth !== window.lastWidth) {
      window.lastWidth = window.innerWidth;
      
      // Debounce resize updates
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        console.log("Window resized, updating charts");
        updateCharts();
      }, 500);
    }
  }

  window.addEventListener('resize', handleResize);
  window.lastWidth = window.innerWidth;

  console.log("Main script initialization complete");
});