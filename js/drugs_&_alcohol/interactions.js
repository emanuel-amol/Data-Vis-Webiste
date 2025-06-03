// js/drugs_&_alcohol/interactions.js
// Interactive functionality for drugs and alcohol analysis page

class DrugsAlcoholInteractions {
  constructor() {
    this.activeFilters = {
      years: [],
      jurisdictions: [],
      ageGroups: [],
      metrics: [],
      detectionMethods: []
    };
    
    this.charts = {
      overview: null,
      trends: null,
      jurisdictions: null,
      demographics: null,
      detection: null
    };
    
    this.data = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupEventListeners();
    this.initializeFilters();
    this.setupTabNavigation();
    this.loadChartInstances();
    
    this.isInitialized = true;
    console.log('Drugs & Alcohol interactions initialized');
  }

  setupEventListeners() {
    // Data ready event
    document.addEventListener('drugsAlcoholDataReady', (event) => {
      this.data = event.detail.data;
      this.updateFilterOptions();
      this.applyFilters();
    });

    // Filter reset button
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllFilters());
    }

    // Analysis toggles
    const showArrests = document.getElementById('show-arrests');
    const showCharges = document.getElementById('show-charges');
    
    if (showArrests) {
      showArrests.addEventListener('change', (e) => {
        this.toggleMetricVisibility('arrests', e.target.checked);
      });
    }
    
    if (showCharges) {
      showCharges.addEventListener('change', (e) => {
        this.toggleMetricVisibility('charges', e.target.checked);
      });
    }

    // Window resize handler
    window.addEventListener('resize', this.debounce(() => {
      this.refreshAllCharts();
    }, 300));
  }

  setupTabNavigation() {
    const tabs = document.querySelectorAll('.viz-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.style.display = 'none');
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const targetTab = tab.getAttribute('data-tab');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.style.display = 'block';
          
          // Trigger chart refresh for the active tab
          this.refreshChartForTab(targetTab);
        }
      });
    });
  }

  loadChartInstances() {
    // Store references to chart instances
    if (window.drugsAlcoholOverviewChart) {
      this.charts.overview = window.drugsAlcoholOverviewChart;
    }
    if (window.drugsAlcoholTrendsChart) {
      this.charts.trends = window.drugsAlcoholTrendsChart;
    }
    if (window.drugsAlcoholJurisdictionsChart) {
      this.charts.jurisdictions = window.drugsAlcoholJurisdictionsChart;
    }
    if (window.drugsAlcoholDemographicsChart) {
      this.charts.demographics = window.drugsAlcoholDemographicsChart;
    }
    if (window.drugsAlcoholDetectionChart) {
      this.charts.detection = window.drugsAlcoholDetectionChart;
    }
  }

  initializeFilters() {
    // Initialize all filters to "All" selected
    this.resetAllFilters();
  }

  updateFilterOptions() {
    if (!this.data || !this.data.raw) return;

    // Update year options
    this.updateYearOptions();
    
    // Update jurisdiction options  
    this.updateJurisdictionOptions();
    
    // Update age group options
    this.updateAgeGroupOptions();
    
    // Update metric options
    this.updateMetricOptions();
    
    // Update detection method options
    this.updateDetectionMethodOptions();
  }

  updateYearOptions() {
    const years = [...new Set(this.data.raw.map(d => d.YEAR))].sort((a, b) => b - a);
    const yearCheckboxList = document.getElementById('year-checkbox-list');
    
    if (yearCheckboxList) {
      // Keep the "All" option and add years
      const existingAll = yearCheckboxList.querySelector('input[value="All"]').parentElement;
      yearCheckboxList.innerHTML = '';
      yearCheckboxList.appendChild(existingAll);
      
      years.forEach(year => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${year}" onchange="updateYearSelection()"> ${year}`;
        yearCheckboxList.appendChild(label);
      });
    }
  }

  updateJurisdictionOptions() {
    const jurisdictions = [...new Set(this.data.raw.map(d => d.JURISDICTION))].sort();
    const jurisdictionCheckboxList = document.getElementById('jurisdiction-checkbox-list');
    
    if (jurisdictionCheckboxList) {
      // Keep the "All" option and add jurisdictions
      const existingAll = jurisdictionCheckboxList.querySelector('input[value="All"]').parentElement;
      jurisdictionCheckboxList.innerHTML = '';
      jurisdictionCheckboxList.appendChild(existingAll);
      
      jurisdictions.forEach(jurisdiction => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${jurisdiction}" onchange="updateJurisdictionSelection()"> ${jurisdiction}`;
        jurisdictionCheckboxList.appendChild(label);
      });
    }
  }

  updateAgeGroupOptions() {
    const ageGroups = [...new Set(this.data.raw.map(d => d.AGE_GROUP))];
    const ageOrder = ['0-16', '17-25', '26-39', '40-64', '65 and over'];
    const sortedAgeGroups = ageGroups.sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));
    
    const ageCheckboxList = document.getElementById('age-checkbox-list');
    
    if (ageCheckboxList) {
      // Keep the "All" option and add age groups
      const existingAll = ageCheckboxList.querySelector('input[value="All"]').parentElement;
      ageCheckboxList.innerHTML = '';
      ageCheckboxList.appendChild(existingAll);
      
      sortedAgeGroups.forEach(ageGroup => {
        const label = document.createElement('label');
        const displayAge = ageGroup === '65 and over' ? '65+' : ageGroup;
        label.innerHTML = `<input type="checkbox" value="${ageGroup}" onchange="updateAgeSelection()"> ${displayAge}`;
        ageCheckboxList.appendChild(label);
      });
    }
  }

  updateMetricOptions() {
    const metrics = [...new Set(this.data.raw.map(d => d.METRIC))].sort();
    // This could be used for a metric filter if needed in the future
  }

  updateDetectionMethodOptions() {
    const methods = [...new Set(this.data.raw.map(d => d.DETECTION_METHOD))].sort();
    // This could be used for a detection method filter if needed in the future
  }

  applyFilters() {
    if (!this.data || !window.drugsAlcoholDataLoader) return;

    // Get current filter selections
    const filters = this.getCurrentFilters();
    
    // Apply filters to data
    const filteredData = window.drugsAlcoholDataLoader.getDataByFilters(filters);
    
    // Update processed data
    const processedData = this.processFilteredData(filteredData);
    
    // Update global data reference
    window.drugsAlcoholData.filtered = {
      raw: filteredData,
      processed: processedData
    };
    
    // Refresh all charts with filtered data
    this.refreshAllCharts();
    
    // Update statistics
    this.updateFilteredStatistics(processedData);
  }

  getCurrentFilters() {
    const filters = {};
    
    // Year filters
    const yearInputs = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:checked');
    const yearValues = Array.from(yearInputs).map(input => input.value).filter(v => v !== 'All');
    if (yearValues.length > 0 && !yearInputs[0].value.includes('All')) {
      filters.years = yearValues;
    }
    
    // Jurisdiction filters
    const jurisdictionInputs = document.querySelectorAll('#jurisdiction-checkbox-list input[type="checkbox"]:checked');
    const jurisdictionValues = Array.from(jurisdictionInputs).map(input => input.value).filter(v => v !== 'All');
    if (jurisdictionValues.length > 0 && !Array.from(jurisdictionInputs).some(input => input.value === 'All' && input.checked)) {
      filters.jurisdictions = jurisdictionValues;
    }
    
    // Age group filters
    const ageInputs = document.querySelectorAll('#age-checkbox-list input[type="checkbox"]:checked');
    const ageValues = Array.from(ageInputs).map(input => input.value).filter(v => v !== 'All');
    if (ageValues.length > 0 && !Array.from(ageInputs).some(input => input.value === 'All' && input.checked)) {
      filters.ageGroups = ageValues;
    }
    
    return filters;
  }

  processFilteredData(filteredData) {
    // Use the same processing logic as the main data loader
    if (window.drugsAlcoholDataLoader) {
      // Create a temporary processed structure
      return {
        byYear: window.drugsAlcoholDataLoader.getAggregatedData(filteredData, 'YEAR'),
        byJurisdiction: window.drugsAlcoholDataLoader.getAggregatedData(filteredData, 'JURISDICTION'),
        byAgeGroup: window.drugsAlcoholDataLoader.getAggregatedData(filteredData, 'AGE_GROUP'),
        byMetric: window.drugsAlcoholDataLoader.getAggregatedData(filteredData, 'METRIC'),
        byDetectionMethod: window.drugsAlcoholDataLoader.getAggregatedData(filteredData, 'DETECTION_METHOD')
      };
    }
    return null;
  }

  refreshAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.update === 'function') {
        chart.update();
      }
    });
  }

  refreshChartForTab(tabId) {
    const chartMap = {
      'overview-tab': 'overview',
      'trends-tab': 'trends',
      'jurisdictions-tab': 'jurisdictions',
      'demographics-tab': 'demographics',
      'detection-tab': 'detection'
    };
    
    const chartKey = chartMap[tabId];
    if (chartKey && this.charts[chartKey]) {
      setTimeout(() => {
        if (typeof this.charts[chartKey].update === 'function') {
          this.charts[chartKey].update();
        }
      }, 100);
    }
  }

  updateFilteredStatistics(processedData) {
    if (!processedData) return;
    
    // Calculate filtered statistics
    const totalFines = d3.sum(processedData.byYear, d => d.totalFines || 0);
    const totalArrests = d3.sum(processedData.byYear, d => d.totalArrests || 0);
    const totalCharges = d3.sum(processedData.byYear, d => d.totalCharges || 0);
    
    // Update UI elements
    this.updateStatElement('total-fines-stat', totalFines);
    this.updateStatElement('total-arrests-stat', totalArrests);
    this.updateStatElement('total-charges-stat', totalCharges);
    
    // Update derived statistics
    const combinedTotal = totalFines + totalArrests + totalCharges;
    this.updateStatElement('combined-total', combinedTotal);
  }

  updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      if (typeof value === 'number' && value > 1000) {
        element.textContent = value.toLocaleString();
      } else {
        element.textContent = value;
      }
    }
  }

  resetAllFilters() {
    // Reset all filter checkboxes
    const allCheckboxes = document.querySelectorAll('.checkbox-list input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = checkbox.value === 'All';
    });
    
    // Reset filter displays
    this.updateFilterDisplay('year-selected-output', 'All');
    this.updateFilterDisplay('jurisdiction-selected-output', 'All');
    this.updateFilterDisplay('age-selected-output', 'All');
    
    // Reset analysis toggles
    const showArrests = document.getElementById('show-arrests');
    const showCharges = document.getElementById('show-charges');
    if (showArrests) showArrests.checked = false;
    if (showCharges) showCharges.checked = false;
    
    // Reapply filters (which will be empty, showing all data)
    this.applyFilters();
  }

  updateFilterDisplay(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = `Selected: ${text}`;
    }
  }

  toggleMetricVisibility(metric, visible) {
    // This could be used to show/hide specific metrics in charts
    console.log(`Toggle ${metric} visibility: ${visible}`);
    // Implementation would depend on chart structure
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  exportData() {
    if (!this.data) {
      alert('No data available to export');
      return;
    }
    
    const filteredData = window.drugsAlcoholData.filtered?.raw || this.data.raw;
    
    // Convert to CSV
    const csvContent = this.convertToCSV(filteredData);
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `drugs_alcohol_enforcement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
}

// Global filter functions (called from HTML)
function toggleYearDropdown() {
  const dropdown = document.getElementById('year-checkbox-list');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleJurisdictionDropdown() {
  const dropdown = document.getElementById('jurisdiction-checkbox-list');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleAgeDropdown() {
  const dropdown = document.getElementById('age-checkbox-list');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleAllYears(allCheckbox) {
  const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = allCheckbox.checked;
  });
  updateYearSelection();
}

function toggleAllJurisdictions(allCheckbox) {
  const checkboxes = document.querySelectorAll('#jurisdiction-checkbox-list input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = allCheckbox.checked;
  });
  updateJurisdictionSelection();
}

function toggleAllAges(allCheckbox) {
  const checkboxes = document.querySelectorAll('#age-checkbox-list input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = allCheckbox.checked;
  });
  updateAgeSelection();
}

function updateYearSelection() {
  const checkboxes = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:checked');
  const allCheckbox = document.querySelector('#year-checkbox-list input[value="All"]');
  const selectedValues = Array.from(checkboxes).map(cb => cb.value).filter(v => v !== 'All');
  
  if (selectedValues.length === 0) {
    allCheckbox.checked = true;
  } else {
    allCheckbox.checked = false;
  }
  
  const displayText = selectedValues.length === 0 || allCheckbox.checked ? 'All' : 
                     selectedValues.length <= 3 ? selectedValues.join(', ') : 
                     `${selectedValues.length} selected`;
  
  document.getElementById('year-selected-output').textContent = `Selected: ${displayText}`;
  
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.applyFilters();
  }
}

function updateJurisdictionSelection() {
  const checkboxes = document.querySelectorAll('#jurisdiction-checkbox-list input[type="checkbox"]:checked');
  const allCheckbox = document.querySelector('#jurisdiction-checkbox-list input[value="All"]');
  const selectedValues = Array.from(checkboxes).map(cb => cb.value).filter(v => v !== 'All');
  
  if (selectedValues.length === 0) {
    allCheckbox.checked = true;
  } else {
    allCheckbox.checked = false;
  }
  
  const displayText = selectedValues.length === 0 || allCheckbox.checked ? 'All' : 
                     selectedValues.length <= 3 ? selectedValues.join(', ') : 
                     `${selectedValues.length} selected`;
  
  document.getElementById('jurisdiction-selected-output').textContent = `Selected: ${displayText}`;
  
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.applyFilters();
  }
}

function updateAgeSelection() {
  const checkboxes = document.querySelectorAll('#age-checkbox-list input[type="checkbox"]:checked');
  const allCheckbox = document.querySelector('#age-checkbox-list input[value="All"]');
  const selectedValues = Array.from(checkboxes).map(cb => cb.value).filter(v => v !== 'All');
  
  if (selectedValues.length === 0) {
    allCheckbox.checked = true;
  } else {
    allCheckbox.checked = false;
  }
  
  const displayText = selectedValues.length === 0 || allCheckbox.checked ? 'All' : 
                     selectedValues.length <= 3 ? selectedValues.join(', ') : 
                     `${selectedValues.length} selected`;
  
  document.getElementById('age-selected-output').textContent = `Selected: ${displayText}`;
  
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.applyFilters();
  }
}

function exportDrugsAlcoholData() {
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.exportData();
  }
}

// Hide dropdowns when clicking outside
document.addEventListener('click', function(event) {
  const dropdowns = ['year-checkbox-list', 'jurisdiction-checkbox-list', 'age-checkbox-list'];
  const selectBoxes = ['year-dropdown', 'jurisdiction-dropdown', 'age-dropdown'];
  
  dropdowns.forEach((dropdownId, index) => {
    const dropdown = document.getElementById(dropdownId);
    const selectBox = document.getElementById(selectBoxes[index]);
    
    if (dropdown && selectBox && 
        !selectBox.contains(event.target) && 
        !dropdown.contains(event.target)) {
      dropdown.style.display = 'none';
    }
  });
});

// Initialize interactions when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.drugsAlcoholInteractions = new DrugsAlcoholInteractions();
  window.drugsAlcoholInteractions.init();
});

// Export for use in other modules
window.DrugsAlcoholInteractions = DrugsAlcoholInteractions;