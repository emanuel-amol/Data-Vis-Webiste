// Main script.js file with all required functionality
document.addEventListener("DOMContentLoaded", () => {
  // Dropdown functionality for jurisdiction filter
  window.toggleDropdown = function() {
    const dropdownList = document.getElementById('checkbox-list');
    if (dropdownList) {
      dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
    }
  };

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

  // Toggle all jurisdictions
  window.toggleAll = function(checkbox) {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    checkboxes.forEach(item => {
      item.checked = checkbox.checked;
    });
    updateSelection();
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

  // Update jurisdiction selection display
  window.updateSelection = function() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#checkbox-list input[value="All"]');
    const selectedOutput = document.getElementById('selected-output');
    
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
    
    // Here you would add code to update the charts based on selection
    updateCharts();
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
    
    // Here you would add code to update the charts based on selection
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
    
    // Here you would add code to update the charts based on selection
    updateCharts();
  };

  // Function to reset all filters
  function resetAllFilters() {
    // Reset jurisdiction filter
    const jurisdictionCheckboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]');
    jurisdictionCheckboxes.forEach(item => {
      item.checked = item.value === 'All';
    });
    
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
    if (document.getElementById('selected-output')) {
      document.getElementById('selected-output').textContent = 'Selected: All';
    }
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
  
  // Placeholder function for chart updates - to be implemented with D3.js in Phase 2
  function updateCharts() {
    console.log('Charts would be updated here with D3.js in Standup 2');
    // This will be implemented when we add actual D3.js visualizations
  }

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
      });
    });
    
    // Activate first tab by default
    tabs[0].click();
  }
  
  // Tooltip functionality
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', (e) => {
      const tooltipText = e.target.getAttribute('data-tooltip');
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = tooltipText;
      
      // Position tooltip
      document.body.appendChild(tooltip);
      const rect = e.target.getBoundingClientRect();
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10 + window.scrollY}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + window.scrollX}px`;
      
      // Store tooltip reference
      e.target.tooltip = tooltip;
    });
    
    element.addEventListener('mouseleave', (e) => {
      if (e.target.tooltip) {
        e.target.tooltip.remove();
        e.target.tooltip = null;
      }
    });
  });

  // For mobile, close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdowns = [
      document.getElementById('checkbox-list'),
      document.getElementById('year-checkbox-list'),
      document.getElementById('detection-checkbox-list')
    ];
    
    dropdowns.forEach(dropdown => {
      if (dropdown && !e.target.closest('.multi-select-wrapper') && dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
      }
    });
  });
});