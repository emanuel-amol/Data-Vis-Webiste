document.addEventListener("DOMContentLoaded", () => {
  console.log("Script.js loaded and running");
  
  // Toggle dropdown for Jurisdiction
  window.toggleDropdown = function() {
    const dropdownList = document.getElementById('checkbox-list');
    if (dropdownList) {
      dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    }
  };

  // Toggle Year dropdown
  window.toggleYearDropdown = function() {
    const dropdownList = document.getElementById('year-checkbox-list');
    if (dropdownList) {
      dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    }
  };

  // Toggle Detection Method dropdown
  window.toggleDetectionDropdown = function() {
    const dropdownList = document.getElementById('detection-checkbox-list');
    if (dropdownList) {
      dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    }
  };

  // Toggle all Jurisdictions
  window.toggleAll = function(checkbox) {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateSelection();
  };

  // Toggle all Years
  window.toggleAllYears = function(checkbox) {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateYearSelection();
  };

  // Toggle all Detection Methods
  window.toggleAllDetection = function(checkbox) {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateDetectionSelection();
  };

  // Update jurisdiction selection text and trigger chart update
  window.updateSelection = function() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#checkbox-list input[value="All"]');
    const output = document.getElementById('selected-output');

    if (!output) return; // Guard clause if element doesn't exist

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

    updateCharts(); // 🔁 Triggers update in chart
  };

  // Update year selection text and trigger chart update
  window.updateYearSelection = function() {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#year-checkbox-list input[value="All"]');
    const output = document.getElementById('year-selected-output');
    
    if (!output) return; // Guard clause if element doesn't exist

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

    updateCharts(); // 🔁 Triggers update in chart
  };

  // Update detection method selection text and trigger chart update
  window.updateDetectionSelection = function() {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#detection-checkbox-list input[value="All"]');
    const output = document.getElementById('detection-selected-output');
    
    if (!output) return; // Guard clause if element doesn't exist

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

    updateCharts(); // 🔁 Triggers update in chart
  };

  // RESET logic now supports all filter types
  function resetAllFilters() {
    console.log("Resetting all filters");

    // Reset year checkboxes
    const yearCheckboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]');
    yearCheckboxes.forEach(cb => cb.checked = cb.value === 'All');
    if (document.getElementById('year-selected-output')) {
      document.getElementById('year-selected-output').textContent = 'Selected: All';
    }

    // Reset detection checkboxes
    const detectionCheckboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]');
    detectionCheckboxes.forEach(cb => cb.checked = cb.value === 'All');
    if (document.getElementById('detection-selected-output')) {
      document.getElementById('detection-selected-output').textContent = 'Selected: All';
    }

    // Reset jurisdiction checkboxes
    const jurisdictionCheckboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]');
    jurisdictionCheckboxes.forEach(cb => cb.checked = cb.value === 'All');
    if (document.getElementById('selected-output')) {
      document.getElementById('selected-output').textContent = 'Selected: All';
    }

    updateCharts(); // refresh charts
  }

  const resetButton = document.getElementById('reset');
  if (resetButton) {
    resetButton.addEventListener('click', resetAllFilters);
  }

  // Global chart update hook - Updated to handle all jurisdiction charts
  window.updateCharts = function() {
    console.log("updateCharts called");
    
    // Update jurisdiction map
    if (window.updateJurisdictionMap) {
      console.log("Updating jurisdiction map");
      window.updateJurisdictionMap();
    }
    
    // Update jurisdiction line chart
    if (window.updateJurisdictionLineChart) {
      console.log("Updating jurisdiction line chart");
      window.updateJurisdictionLineChart();
    }
    
    // Update jurisdiction area chart
    if (window.updateJurisdictionAreaChart) {
      console.log("Updating jurisdiction area chart");
      window.updateJurisdictionAreaChart();
    }
    
    // Update age analysis chart (if present)
    if (window.updateChart) {
      console.log("Updating age analysis chart");
      window.updateChart();
    }
  };

  // Tabbed interface
  const tabs = document.querySelectorAll('.viz-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        console.log("Tab clicked:", tab.getAttribute('data-tab'));
        
        // Remove active class from all tabs and hide all content
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const contentId = tab.getAttribute('data-tab');
        const contentElement = document.getElementById(contentId);
        if (contentElement) {
          contentElement.style.display = 'block';
          
          // Initialize or update the visualization based on the active tab
          if (contentId === 'map-tab' && window.updateJurisdictionMap) {
            console.log("Initializing map tab");
            window.updateJurisdictionMap();
          } else if (contentId === 'line-chart-tab' && window.updateJurisdictionLineChart) {
            console.log("Initializing line chart tab");
            window.updateJurisdictionLineChart();
          } else if (contentId === 'stacked-area-tab' && window.updateJurisdictionAreaChart) {
            console.log("Initializing area chart tab");
            window.updateJurisdictionAreaChart();
          }
        }
      });
    });
    
    // Activate the first tab or the one that's marked active
    const activeTab = document.querySelector('.viz-tab.active') || tabs[0];
    if (activeTab) {
      console.log("Activating initial tab:", activeTab.getAttribute('data-tab'));
      activeTab.click();
    }
  }

  // Close dropdowns if clicked outside
  document.addEventListener('click', (e) => {
    const dropdowns = [
      { id: 'year-checkbox-list', selector: '.multi-select-wrapper' },
      { id: 'detection-checkbox-list', selector: '.multi-select-wrapper' },
      { id: 'checkbox-list', selector: '.multi-select-wrapper' }
    ];

    dropdowns.forEach(item => {
      const dropdown = document.getElementById(item.id);
      if (dropdown &&
          !e.target.closest(item.selector) &&
          dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
      }
    });
  });

  // Responsive styles
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-group {
        width: 100%;
        margin-bottom: 15px;
      }
      
      .multi-select-wrapper {
        width: 100%;
      }
      
      .checkbox-list {
        width: 100%;
      }
      
      #reset {
        width: 100%;
      }
      
      .viz-tabs {
        flex-wrap: wrap;
      }
      
      .viz-tab {
        flex: 1 0 calc(50% - 10px);
        margin-bottom: 10px;
      }
    }
    
    .checkbox-list {
      display: none;
      position: absolute;
      z-index: 100;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      max-height: 300px;
      overflow-y: auto;
      width: 100%;
    }

    #map-tooltip {
      position: absolute;
      padding: 8px 12px;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      pointer-events: none;
      z-index: 1000;
      max-width: 250px;
    }
    
    .jurisdiction-line-tooltip, .jurisdiction-area-tooltip {
      position: absolute;
      padding: 8px 12px;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      max-width: 250px;
    }
  `;
  document.head.appendChild(style);
  
  // Initialize any charts that might be on the page
  if (typeof updateCharts === 'function') {
    console.log("Initial chart update");
    updateCharts();
  }
});