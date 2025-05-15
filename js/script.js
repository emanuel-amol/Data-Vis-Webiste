// script.js - Fixed to make selection buttons work
document.addEventListener("DOMContentLoaded", () => {
  // Dropdown functionality for year filter  
  window.toggleYearDropdown = function() {
    const dropdownList = document.getElementById('year-checkbox-list');
    if (dropdownList) {
      dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    }
  };

  // Dropdown functionality for detection method filter
  window.toggleDetectionDropdown = function() {
    const dropdownList = document.getElementById('detection-checkbox-list');
    if (dropdownList) {
      dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    }
  };

  // Toggle all years
  window.toggleAllYears = function(checkbox) {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(item => {
      item.checked = checkbox.checked;
    });
    updateYearSelection();
  };

  // Toggle all detection methods
  window.toggleAllDetection = function(checkbox) {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(item => {
      item.checked = checkbox.checked;
    });
    updateDetectionSelection();
  };

  // Update year selection display
  window.updateYearSelection = function() {
    const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#year-checkbox-list input[value="All"]');
    const selectedOutput = document.getElementById('year-selected-output');
    
    const selectedValues = [];
    let allSelected = true;
    
    checkboxes.forEach(item => {
      if (item.checked) {
        selectedValues.push(item.value);
      } else {
        allSelected = false;
      }
    });
    
    if (allCheckbox) {
      allCheckbox.checked = allSelected;
    }
    
    if (selectedValues.length === 0) {
      selectedOutput.textContent = 'Selected: None';
    } else if (allSelected) {
      selectedOutput.textContent = 'Selected: All';
    } else {
      selectedOutput.textContent = `Selected: ${selectedValues.join(', ')}`;
    }
    
    // Update charts based on selection
    updateCharts();
  };

  // Update detection method selection display
  window.updateDetectionSelection = function() {
    const checkboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#detection-checkbox-list input[value="All"]');
    const selectedOutput = document.getElementById('detection-selected-output');
    
    const selectedValues = [];
    let allSelected = true;
    
    checkboxes.forEach(item => {
      if (item.checked) {
        selectedValues.push(item.value);
      } else {
        allSelected = false;
      }
    });
    
    if (allCheckbox) {
      allCheckbox.checked = allSelected;
    }
    
    if (selectedValues.length === 0) {
      selectedOutput.textContent = 'Selected: None';
    } else if (allSelected) {
      selectedOutput.textContent = 'Selected: All';
    } else {
      selectedOutput.textContent = `Selected: ${selectedValues.join(', ')}`;
    }
    
    // Update charts based on selection
    updateCharts();
  };

  // Function to reset all filters
  function resetAllFilters() {
    console.log("Resetting all filters");
    
    // Reset year filter
    const yearCheckboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]');
    yearCheckboxes.forEach(item => {
      item.checked = item.value === 'All';
    });
    
    // Reset detection method filter
    const detectionCheckboxes = document.querySelectorAll('#detection-checkbox-list input[type="checkbox"]');
    detectionCheckboxes.forEach(item => {
      item.checked = item.value === 'All';
    });
    
    // Update displays
    if (document.getElementById('year-selected-output')) {
      document.getElementById('year-selected-output').textContent = 'Selected: All';
    }
    if (document.getElementById('detection-selected-output')) {
      document.getElementById('detection-selected-output').textContent = 'Selected: All';
    }
    
    // Update charts with reset filters
    updateCharts();
  }
  
  // Add reset button event listener
  const resetButton = document.getElementById('reset');
  if (resetButton) {
    resetButton.addEventListener('click', resetAllFilters);
  }
  
  // Function for chart updates - connects to the jurisdictionMap
  window.updateCharts = function() {
    console.log('Updating charts based on filters');
    
    // If the jurisdiction map update function exists, call it
    if (window.updateJurisdictionMap) {
      window.updateJurisdictionMap();
    }
  };

  // Tabbed interface for jurisdictions.html
  const tabs = document.querySelectorAll('.viz-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach(content => {
          content.style.display = 'none';
        });
        
        // Show selected tab content
        const contentId = tab.getAttribute('data-tab');
        document.getElementById(contentId).style.display = 'block';
        
        // If switching to map tab, update it
        if (contentId === 'map-tab' && window.updateJurisdictionMap) {
          window.updateJurisdictionMap();
        }
      });
    });
    
    // Activate first tab by default (your original behavior)
    tabs[0].click();
  }
  
  // For mobile, close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdowns = [
      document.getElementById('year-checkbox-list'),
      document.getElementById('detection-checkbox-list')
    ];
    
    dropdowns.forEach(dropdown => {
      if (dropdown && 
          !e.target.closest('.multi-select-wrapper') && 
          dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
      }
    });
  });
  
  // Simple CSS fix for dropdowns
  const style = document.createElement('style');
  style.textContent = `
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
  `;
  document.head.appendChild(style);
});