// js/drugs_&_alcohol/interactions.js
// Fixed interactive functionality for drugs and alcohol analysis page - FOCUS ON FINES

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
    this.insightsVisible = false;
    this.comparisonMode = false;
    this.focusOnFines = true; // PRIMARY FOCUS ON FINES
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupEventListeners();
    this.initializeFilters();
    this.setupTabNavigation();
    this.setupButtonHandlers();
    this.loadChartInstances();
    
    this.isInitialized = true;
    console.log('Drugs & Alcohol interactions initialized - FOCUS ON FINES');
  }

  setupButtonHandlers() {
    // Show Insights button
    const showInsightsBtn = document.getElementById('show-insights-btn');
    if (showInsightsBtn) {
      showInsightsBtn.addEventListener('click', () => this.toggleInsights());
    }

    // Compare Metrics button  
    const compareBtn = document.getElementById('compare-metrics-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => this.toggleComparisonMode());
    }

    // Export button
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    // Reset filters button
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllFilters());
    }

    // Analysis toggles - FOCUS ON FINES
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
  }

  setupEventListeners() {
    // Data ready event
    document.addEventListener('drugsAlcoholDataReady', (event) => {
      this.data = event.detail.data;
      this.updateFilterOptions();
      this.updateInsightsData();
      this.applyFilters();
      console.log('Data loaded - focusing on FINES analysis');
    });

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
          
          // Trigger chart refresh for the active tab with delay
          setTimeout(() => {
            this.refreshChartForTab(targetTab);
          }, 100);
        }
      });
    });
  }

  toggleInsights() {
    const insights = document.getElementById('chart-insights');
    const button = document.getElementById('show-insights-btn');
    
    if (insights) {
      this.insightsVisible = !this.insightsVisible;
      insights.style.display = this.insightsVisible ? 'grid' : 'none';
      
      if (button) {
        button.textContent = this.insightsVisible ? '📊 Hide Insights' : '📊 Show Insights';
        button.style.backgroundColor = this.insightsVisible ? '#27ae60' : '#3b82f6';
      }

      // Add animation effect
      if (this.insightsVisible) {
        insights.style.opacity = '0';
        insights.style.transform = 'translateY(20px)';
        setTimeout(() => {
          insights.style.transition = 'all 0.3s ease';
          insights.style.opacity = '1';
          insights.style.transform = 'translateY(0)';
        }, 10);
      }

      console.log(`Insights ${this.insightsVisible ? 'shown' : 'hidden'} - FINES focus`);
    }
  }

  toggleComparisonMode() {
    this.comparisonMode = !this.comparisonMode;
    const button = document.getElementById('compare-metrics-btn');
    
    if (button) {
      button.textContent = this.comparisonMode ? '⚖️ Exit Comparison' : '⚖️ Compare Outcomes';
      button.style.backgroundColor = this.comparisonMode ? '#e67e22' : '#3b82f6';
    }

    // Apply comparison styling to charts
    this.applyComparisonMode();
    
    console.log(`Comparison mode ${this.comparisonMode ? 'enabled' : 'disabled'} - FINES focus`);
  }

  applyComparisonMode() {
    const chartContainers = document.querySelectorAll('.enhanced-chart');
    
    chartContainers.forEach(container => {
      if (this.comparisonMode) {
        container.style.border = '3px solid #e67e22';
        container.style.backgroundColor = '#fef9f3';
      } else {
        container.style.border = '';
        container.style.backgroundColor = '';
      }
    });

    // Update charts to show comparison data if available
    this.refreshAllCharts();
  }

  loadChartInstances() {
    // Store references to chart instances
    const tryLoad = () => {
      let loaded = 0;
      if (window.drugsAlcoholOverviewChart) {
        this.charts.overview = window.drugsAlcoholOverviewChart;
        loaded++;
      }
      if (window.drugsAlcoholTrendsChart) {
        this.charts.trends = window.drugsAlcoholTrendsChart;
        loaded++;
      }
      if (window.drugsAlcoholJurisdictionsChart) {
        this.charts.jurisdictions = window.drugsAlcoholJurisdictionsChart;
        loaded++;
      }
      if (window.drugsAlcoholDemographicsChart) {
        this.charts.demographics = window.drugsAlcoholDemographicsChart;
        loaded++;
      }
      if (window.drugsAlcoholDetectionChart) {
        this.charts.detection = window.drugsAlcoholDetectionChart;
        loaded++;
      }
      if (loaded < 5) {
        setTimeout(tryLoad, 300); // Try again until all charts are loaded
      } else {
        this.refreshAllCharts();
        console.log('Chart instances loaded - FINES focus enabled');
      }
    };
    tryLoad();
  }

  initializeFilters() {
    // Initialize all filters to "All" selected
    this.resetAllFilters();
  }

  updateFilterOptions() {
    if (!this.data || !this.data.raw) return;

    console.log('Updating filter options - FINES focus');
    
    // Update year options
    this.updateYearOptions();
    
    // Update jurisdiction options  
    this.updateJurisdictionOptions();
    
    // Update age group options
    this.updateAgeGroupOptions();
  }

  updateYearOptions() {
    const years = [...new Set(this.data.raw.map(d => d.YEAR))].sort((a, b) => b - a);
    const yearCheckboxList = document.getElementById('year-checkbox-list');
    
    if (yearCheckboxList) {
      // Keep the "All" option and add years
      const existingAll = yearCheckboxList.querySelector('input[value="All"]')?.parentElement;
      yearCheckboxList.innerHTML = '';
      if (existingAll) {
        yearCheckboxList.appendChild(existingAll);
      }
      
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
      const existingAll = jurisdictionCheckboxList.querySelector('input[value="All"]')?.parentElement;
      jurisdictionCheckboxList.innerHTML = '';
      if (existingAll) {
        jurisdictionCheckboxList.appendChild(existingAll);
      }
      
      jurisdictions.forEach(jurisdiction => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${jurisdiction}" onchange="updateJurisdictionSelection()"> ${jurisdiction}`;
        jurisdictionCheckboxList.appendChild(label);
      });
    }
  }

  updateAgeGroupOptions() {
    const ageGroups = [...new Set(this.data.raw.map(d => d.AGE_GROUP))];
    const ageOrder = ['17-25', '26-39', '40-64', '65 and over'];
    const sortedAgeGroups = ageGroups.sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));
    
    const ageCheckboxList = document.getElementById('age-checkbox-list');
    
    if (ageCheckboxList) {
      // Keep the "All" option and add age groups
      const existingAll = ageCheckboxList.querySelector('input[value="All"]')?.parentElement;
      ageCheckboxList.innerHTML = '';
      if (existingAll) {
        ageCheckboxList.appendChild(existingAll);
      }
      
      sortedAgeGroups.forEach(ageGroup => {
        const label = document.createElement('label');
        const displayAge = ageGroup === '65 and over' ? '65+' : ageGroup;
        label.innerHTML = `<input type="checkbox" value="${ageGroup}" onchange="updateAgeSelection()"> ${displayAge}`;
        ageCheckboxList.appendChild(label);
      });
    }
  }

  updateInsightsData() {
    if (!this.data || !this.data.stats) return;

    console.log('Updating insights data - FINES focus');

    // Update insight cards with real data - FOCUS ON FINES
    this.updateStatElement('primary-metric', this.data.stats.primaryMetric || 'Positive Breath Tests');
    this.updateStatElement('peak-year', this.data.stats.peakYear || '2021');
    this.updateStatElement('leading-jurisdiction', this.data.stats.topJurisdiction || 'NSW');
    this.updateStatElement('top-age-group', this.data.stats.topAgeGroup || '26-39');

    // Update comparison data - FOCUS ON FINES
    if (window.drugsAlcoholDataLoader) {
      const comparisonData = window.drugsAlcoholDataLoader.getDrugVsAlcoholData();
      
      // Focus primarily on FINES for the main stats
      this.updateStatElement('alcohol-total', comparisonData.alcohol.totalFines);
      this.updateStatElement('drug-total', comparisonData.drugs.totalFines);
      this.updateStatElement('combined-total', this.data.stats.totalFines);
      
      const alcoholDrugRatio = comparisonData.drugs.totalFines > 0 ? 
        (comparisonData.alcohol.totalFines / comparisonData.drugs.totalFines).toFixed(1) + ':1' : 'N/A';
      this.updateStatElement('alcohol-drug-ratio', alcoholDrugRatio);
    }
  }

  applyFilters() {
    if (!this.data || !window.drugsAlcoholDataLoader) return;

    console.log('Applying filters - FINES focus');

    // Get current filter selections
    const filters = this.getCurrentFilters();
    console.log('Current filters:', filters);
    
    // Apply filters to data
    let filteredData = window.drugsAlcoholDataLoader.getDataByFilters(filters);

    // Fallback: If filtering by age group returns no data, try including "All ages"
    if (filters.ageGroups && filteredData.length === 0 && filters.includeAllAges) {
      const fallbackFilters = { ...filters };
      delete fallbackFilters.ageGroups;
      filteredData = window.drugsAlcoholDataLoader.getDataByFilters(fallbackFilters)
        .filter(d => d.AGE_GROUP === "All ages");
    }

    console.log(`Filtered to ${filteredData.length} records from ${this.data.raw.length} total`);
    
    // Update processed data using the loader's method
    const processedData = window.drugsAlcoholDataLoader.processFilteredData(filteredData);
    console.log('Processed filtered data:', processedData);
    
    // Update global data reference - CRITICAL
    if (!window.drugsAlcoholData.filtered) {
      window.drugsAlcoholData.filtered = {};
    }
    window.drugsAlcoholData.filtered.raw = filteredData;
    window.drugsAlcoholData.filtered.processed = processedData;
    
    console.log('Updated global filtered data reference');
    
    // Update statistics - FOCUS ON FINES
    this.updateFilteredStatistics(processedData);
    
    // Refresh all charts with filtered data - DELAY TO ENSURE DATA IS SET
    setTimeout(() => {
      this.refreshAllCharts();
    }, 100);
    
    console.log(`✓ Filters applied to ${filteredData.length} records - FINES focus`);
  }

  getCurrentFilters() {
    const filters = {};

    // Year filters
    const yearInputs = document.querySelectorAll('#year-checkbox-list input[type="checkbox"]:checked');
    const yearValues = Array.from(yearInputs).map(input => input.value).filter(v => v !== 'All');
    if (yearValues.length > 0 && !Array.from(yearInputs).some(input => input.value === 'All' && input.checked)) {
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
      // Add fallback to include "All ages" if no age-specific data exists
      filters.includeAllAges = true;
    }

    return filters;
  }

  refreshAllCharts() {
    console.log('Refreshing all charts - FINES focus');
    console.log('Filtered data available:', !!window.drugsAlcoholData?.filtered);
    
    // Force update each chart instance
    Object.entries(this.charts).forEach(([name, chart]) => {
      if (chart && typeof chart.update === 'function') {
        try {
          console.log(`Updating ${name} chart...`);
          
          // Set data reference directly on chart if needed
          if (window.drugsAlcoholData?.filtered?.processed) {
            chart.data = window.drugsAlcoholData.filtered.processed;
          }
          
          chart.update();
          console.log(`✓ Updated ${name} chart - FINES focus`);
        } catch (error) {
          console.warn(`✗ Error updating ${name} chart:`, error);
        }
      } else {
        console.warn(`Chart ${name} not available or no update method`);
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
          try {
            this.charts[chartKey].update();
            console.log(`Updated ${chartKey} chart for tab - FINES focus`);
          } catch (error) {
            console.warn(`Error updating ${chartKey} chart:`, error);
          }
        }
      }, 100);
    }
  }

  updateFilteredStatistics(processedData) {
    if (!processedData) return;
    
    console.log('Updating filtered statistics - FINES focus');
    
    // Calculate filtered statistics - FOCUS ON FINES
    const totalFines = d3.sum(processedData.byYear, d => d.totalFines || 0);
    const totalArrests = d3.sum(processedData.byYear, d => d.totalArrests || 0);
    const totalCharges = d3.sum(processedData.byYear, d => d.totalCharges || 0);
    
    // Update UI elements - MAIN FOCUS ON FINES
    this.updateStatElement('total-fines-stat', totalFines);
    this.updateStatElement('total-arrests-stat', totalArrests);
    this.updateStatElement('total-charges-stat', totalCharges);
    
    // Update derived statistics - FOCUS ON FINES
    this.updateStatElement('combined-total', totalFines); // Changed to focus on fines
    
    // Update comparison with filtered data
    if (window.drugsAlcoholData.filtered?.raw) {
      const filteredRaw = window.drugsAlcoholData.filtered.raw;
      
      const alcoholFines = d3.sum(filteredRaw.filter(d => 
        d.METRIC.toLowerCase().includes('breath') || 
        d.METRIC.toLowerCase().includes('alcohol')
      ), d => d.FINES);
      
      const drugFines = d3.sum(filteredRaw.filter(d => 
        d.METRIC.toLowerCase().includes('drug')
      ), d => d.FINES);
      
      this.updateStatElement('alcohol-total', alcoholFines);
      this.updateStatElement('drug-total', drugFines);
      
      const alcoholDrugRatio = drugFines > 0 ? 
        (alcoholFines / drugFines).toFixed(1) + ':1' : 'N/A';
      this.updateStatElement('alcohol-drug-ratio', alcoholDrugRatio);
    }
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
    console.log('Resetting all filters - FINES focus');
    
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

    // Reset comparison mode
    this.comparisonMode = false;
    const compareBtn = document.getElementById('compare-metrics-btn');
    if (compareBtn) {
      compareBtn.textContent = '⚖️ Compare Outcomes';
      compareBtn.style.backgroundColor = '#3b82f6';
    }
    this.applyComparisonMode();

    // Reset insights
    this.insightsVisible = false;
    const insights = document.getElementById('chart-insights');
    const insightsBtn = document.getElementById('show-insights-btn');
    if (insights) insights.style.display = 'none';
    if (insightsBtn) {
      insightsBtn.textContent = '📊 Show Insights';
      insightsBtn.style.backgroundColor = '#3b82f6';
    }
    
    // Reapply filters (which will be empty, showing all data)
    this.applyFilters();
    
    console.log('All filters and modes reset - FINES focus maintained');
  }

  updateFilterDisplay(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = `Selected: ${text}`;
    }
  }

  toggleMetricVisibility(metric, visible) {
    console.log(`Toggle ${metric} visibility: ${visible} - FINES focus maintained`);
    
    // Store the toggle state and refresh charts
    if (!this.activeFilters.visibilityToggles) {
      this.activeFilters.visibilityToggles = {};
    }
    this.activeFilters.visibilityToggles[metric] = visible;
    
    // Refresh charts to apply visibility changes
    this.refreshAllCharts();
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
    
    console.log('Exporting data - FINES focus');
    
    const filteredData = window.drugsAlcoholData.filtered?.raw || this.data.raw;
    
    try {
      // Convert to CSV
      const csvContent = this.convertToCSV(filteredData);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `drugs_alcohol_fines_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('Data export completed successfully - FINES focus');
      
      // Show success message
      this.showExportSuccess();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }

  showExportSuccess() {
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      const originalText = exportBtn.textContent;
      const originalColor = exportBtn.style.backgroundColor;
      
      exportBtn.textContent = '✓ EXPORTED';
      exportBtn.style.backgroundColor = '#27ae60';
      
      setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.style.backgroundColor = originalColor;
      }, 2000);
    }
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
  
  if (selectedValues.length === 0 && allCheckbox) {
    allCheckbox.checked = true;
  } else if (allCheckbox) {
    allCheckbox.checked = false;
  }
  
  const displayText = selectedValues.length === 0 || (allCheckbox && allCheckbox.checked) ? 'All' : 
                     selectedValues.length <= 3 ? selectedValues.join(', ') : 
                     `${selectedValues.length} selected`;
  
  const output = document.getElementById('year-selected-output');
  if (output) output.textContent = `Selected: ${displayText}`;
  
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.applyFilters();
  }
}

function updateJurisdictionSelection() {
  const checkboxes = document.querySelectorAll('#jurisdiction-checkbox-list input[type="checkbox"]:checked');
  const allCheckbox = document.querySelector('#jurisdiction-checkbox-list input[value="All"]');
  const selectedValues = Array.from(checkboxes).map(cb => cb.value).filter(v => v !== 'All');
  
  if (selectedValues.length === 0 && allCheckbox) {
    allCheckbox.checked = true;
  } else if (allCheckbox) {
    allCheckbox.checked = false;
  }
  
  const displayText = selectedValues.length === 0 || (allCheckbox && allCheckbox.checked) ? 'All' : 
                     selectedValues.length <= 3 ? selectedValues.join(', ') : 
                     `${selectedValues.length} selected`;
  
  const output = document.getElementById('jurisdiction-selected-output');
  if (output) output.textContent = `Selected: ${displayText}`;
  
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.applyFilters();
  }
}

function updateAgeSelection() {
  const checkboxes = document.querySelectorAll('#age-checkbox-list input[type="checkbox"]:checked');
  const allCheckbox = document.querySelector('#age-checkbox-list input[value="All"]');
  const selectedValues = Array.from(checkboxes).map(cb => cb.value).filter(v => v !== 'All');
  
  if (selectedValues.length === 0 && allCheckbox) {
    allCheckbox.checked = true;
  } else if (allCheckbox) {
    allCheckbox.checked = false;
  }
  
  const displayText = selectedValues.length === 0 || (allCheckbox && allCheckbox.checked) ? 'All' : 
                     selectedValues.length <= 3 ? selectedValues.join(', ') : 
                     `${selectedValues.length} selected`;
  
  const output = document.getElementById('age-selected-output');
  if (output) output.textContent = `Selected: ${displayText}`;
  
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.applyFilters();
  }
}

// Global functions for backward compatibility
function showInsights() {
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.toggleInsights();
  }
}

function compareMetrics() {
  if (window.drugsAlcoholInteractions) {
    window.drugsAlcoholInteractions.toggleComparisonMode();
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
  console.log('Drugs & Alcohol Interactions initialized - FINES focus enabled');
});

// Export for use in other modules
window.DrugsAlcoholInteractions = DrugsAlcoholInteractions;

// No changes needed here if you use the fallback in data-loader.js