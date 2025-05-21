document.addEventListener("DOMContentLoaded", () => {
  // Toggle dropdown for Jurisdiction
  window.toggleDropdown = function() {
    const dropdownList = document.getElementById('checkbox-list');
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

  // Update jurisdiction selection text and trigger chart update
  window.updateSelection = function() {
    const checkboxes = document.querySelectorAll('#checkbox-list input[type="checkbox"]:not([value="All"])');
    const allCheckbox = document.querySelector('#checkbox-list input[value="All"]');
    const output = document.getElementById('selected-output');

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

  // RESET logic now supports jurisdiction
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

    // ✅ Reset jurisdiction checkboxes
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

  // Global chart update hook
  window.updateCharts = function() {
    if (window.updateJurisdictionMap) {
      window.updateJurisdictionMap();
    }
    if (window.updateChart) {
      window.updateChart();
    }
  };

  // Tabbed interface (unchanged)
  const tabs = document.querySelectorAll('.viz-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabContents.forEach(c => c.style.display = 'none');
        const contentId = tab.getAttribute('data-tab');
        document.getElementById(contentId).style.display = 'block';
        if (contentId === 'map-tab' && window.updateJurisdictionMap) {
          window.updateJurisdictionMap();
        }
      });
    });
    tabs[0].click();
  }

  // Close dropdowns if clicked outside
  document.addEventListener('click', (e) => {
    const dropdowns = [
      document.getElementById('year-checkbox-list'),
      document.getElementById('detection-checkbox-list'),
      document.getElementById('checkbox-list') // ✅ added jurisdiction
    ];

    dropdowns.forEach(dropdown => {
      if (dropdown &&
          !e.target.closest('.multi-select-wrapper') &&
          dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
      }
    });
  });

  // Style fixes
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
