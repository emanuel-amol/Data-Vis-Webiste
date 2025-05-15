// Modified dataLoader.js to fix JSON parsing error
document.addEventListener('DOMContentLoaded', function() {
  // Make data available globally
  window.roadSafetyData = null;

  // Function to load data from the CSV file
  window.loadRoadSafetyData = async function() {
    try {
      console.log("Loading road safety data...");
      
      // Load the CSV data for road enforcement fines
      const csvData = await d3.csv('../data/police_enforcement_2023_fines_2024-09-20.csv');
      console.log("CSV data loaded:", csvData);
      
      // Process the CSV data into a more usable format
      const processedData = processRoadSafetyData(csvData);
      
      // Store the data globally
      window.roadSafetyData = {
        finesData: processedData
      };
      
      console.log("Data processing complete:", window.roadSafetyData);
      
      // Notify that data is ready
      document.dispatchEvent(new CustomEvent('roadSafetyDataReady'));
      
      return window.roadSafetyData;
    } catch (error) {
      console.error("Error loading data:", error);
      return null;
    }
  };
  
  // Function to process the CSV data into a more usable format
  function processRoadSafetyData(csvData) {
    const stateNames = {
      "NSW": "New South Wales",
      "VIC": "Victoria",
      "QLD": "Queensland",
      "SA": "South Australia",
      "WA": "Western Australia",
      "TAS": "Tasmania",
      "NT": "Northern Territory",
      "ACT": "Australian Capital Territory"
    };

    const totals = {};
    const byYearAndMethod = {};
    const yearsSet = new Set();
    const methodsSet = new Set();

    csvData.forEach(row => {
      const abbr = row.JURISDICTION;
      const state = stateNames[abbr];
      if (!state) return;
      const year = row.YEAR;
      const methodRaw = row.DETECTION_METHOD || '';
      // Normalize method for filter matching
      let method = '';
      if (/camera/i.test(methodRaw)) method = 'Camera';
      else if (/police/i.test(methodRaw)) method = 'Police';
      else method = methodRaw.trim() || 'Other';

      const fines = parseFloat(row.FINES) || 0;

      // Totals by state
      if (!totals[state]) totals[state] = 0;
      totals[state] += fines;

      // By year and method
      if (!byYearAndMethod[year]) byYearAndMethod[year] = {};
      if (!byYearAndMethod[year][method]) byYearAndMethod[year][method] = {};
      if (!byYearAndMethod[year][method][state]) byYearAndMethod[year][method][state] = 0;
      byYearAndMethod[year][method][state] += fines;

      yearsSet.add(year);
      methodsSet.add(method);
    });

    return {
      totals,
      byYearAndMethod,
      years: Array.from(yearsSet).sort(),
      methods: Array.from(methodsSet)
    };
  }

  // If the page has the jurisdiction map, load the data
  if (document.getElementById('jurisdiction-map')) {
    window.loadRoadSafetyData();
  }
});