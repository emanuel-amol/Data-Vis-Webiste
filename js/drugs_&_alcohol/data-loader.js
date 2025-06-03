// js/drugs_&_alcohol/data-loader.js
// Data loader specifically for drugs and alcohol enforcement data

class DrugsAlcoholDataLoader {
  constructor() {
    this.rawData = null;
    this.processedData = null;
    this.isLoaded = false;
    this.loadingPromise = null;
    
    // Key statistics
    this.keyStats = {
      totalRecords: 0,
      totalFines: 0,
      totalArrests: 0,
      totalCharges: 0,
      peakYear: null,
      topJurisdiction: null,
      topAgeGroup: null,
      primaryMetric: null
    };
  }

  async loadData() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadDataInternal();
    return this.loadingPromise;
  }

  async _loadDataInternal() {
    try {
      console.log("Loading drugs and alcohol enforcement data...");
      
      // Try different possible paths for the CSV file
      const csvPaths = [
        '../data/police_enforcement_2023_fines_by_drugs_and_alcohol.csv',
        './data/police_enforcement_2023_fines_by_drugs_and_alcohol.csv',
        'data/police_enforcement_2023_fines_by_drugs_and_alcohol.csv'
      ];
      
      let dataLoaded = false;
      
      for (const csvPath of csvPaths) {
        try {
          this.rawData = await d3.csv(csvPath);
          console.log(`Drugs & alcohol data loaded successfully from ${csvPath}: ${this.rawData.length} records`);
          dataLoaded = true;
          break;
        } catch (error) {
          console.warn(`Could not load from ${csvPath}:`, error);
        }
      }

      if (!dataLoaded) {
        console.warn("Could not load real CSV, using sample data");
        this._createSampleData();
      }

      // Process and validate the data
      this._processData();
      this._calculateStatistics();
      
      this.isLoaded = true;
      
      // Store globally for other scripts
      window.drugsAlcoholData = {
        raw: this.rawData,
        processed: this.processedData,
        stats: this.keyStats
      };
      
      // Notify other components that data is ready
      document.dispatchEvent(new CustomEvent('drugsAlcoholDataReady', {
        detail: { data: window.drugsAlcoholData }
      }));
      
      return window.drugsAlcoholData;
      
    } catch (error) {
      console.error("Error in drugs & alcohol data loading:", error);
      this._createSampleData();
      this._processData();
      this._calculateStatistics();
      this.isLoaded = true;
      
      window.drugsAlcoholData = {
        raw: this.rawData,
        processed: this.processedData,
        stats: this.keyStats
      };
      
      document.dispatchEvent(new CustomEvent('drugsAlcoholDataReady', {
        detail: { data: window.drugsAlcoholData }
      }));
      
      return window.drugsAlcoholData;
    }
  }

  _createSampleData() {
    console.log("Creating sample drugs & alcohol data");
    
    this.rawData = [];
    const years = d3.range(2008, 2024);
    const jurisdictions = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
    const ageGroups = ['0-16', '17-25', '26-39', '40-64', '65 and over'];
    const metrics = [
      'Drink driving', 
      'Drug driving', 
      'Drug possession', 
      'Alcohol-related disorder',
      'Refuse breath test',
      'Refuse drug test'
    ];
    const detectionMethods = ['Roadside testing', 'Random breath test', 'Police patrol', 'Traffic stop'];

    // Create realistic patterns for drugs and alcohol violations
    years.forEach(year => {
      jurisdictions.forEach(jurisdiction => {
        ageGroups.forEach(ageGroup => {
          metrics.forEach(metric => {
            detectionMethods.forEach(method => {
              // Create realistic violation patterns
              let baseFines = 10;
              let baseArrests = 2;
              let baseCharges = 3;

              // Age group patterns
              if (ageGroup === '17-25') {
                baseFines *= 2.5; // Young adults higher risk
                baseArrests *= 2.0;
                baseCharges *= 2.0;
              } else if (ageGroup === '26-39') {
                baseFines *= 2.0;
                baseArrests *= 1.8;
                baseCharges *= 1.8;
              } else if (ageGroup === '40-64') {
                baseFines *= 1.5;
                baseArrests *= 1.2;
                baseCharges *= 1.2;
              } else if (ageGroup === '0-16') {
                baseFines *= 0.1; // Very low
                baseArrests *= 0.1;
                baseCharges *= 0.1;
              }

              // Jurisdiction patterns
              const jurisdictionMultipliers = {
                'NSW': 2.5,
                'VIC': 2.2,
                'QLD': 1.8,
                'WA': 1.5,
                'SA': 1.2,
                'ACT': 0.8,
                'TAS': 0.6,
                'NT': 0.5
              };
              
              const jurisdictionMultiplier = jurisdictionMultipliers[jurisdiction] || 1.0;
              baseFines *= jurisdictionMultiplier;
              baseArrests *= jurisdictionMultiplier;
              baseCharges *= jurisdictionMultiplier;

              // Metric patterns
              if (metric === 'Drink driving') {
                baseFines *= 3.0; // Most common
                baseArrests *= 2.5;
                baseCharges *= 2.5;
              } else if (metric === 'Drug driving') {
                baseFines *= 1.5; // Growing concern
                baseArrests *= 1.8;
                baseCharges *= 1.8;
              } else if (metric === 'Refuse breath test') {
                baseFines *= 0.5; // Less common
                baseArrests *= 2.0; // But serious
                baseCharges *= 2.0;
              }

              // Year trends
              const yearIndex = year - 2008;
              const yearMultiplier = 1 + (yearIndex * 0.03); // Gradual increase
              
              // Add some variation for recent years
              if (year >= 2020) {
                if (metric === 'Drug driving') {
                  baseFines *= 1.4; // Increased focus on drug testing
                  baseArrests *= 1.3;
                  baseCharges *= 1.3;
                }
              }

              // Apply year multiplier
              baseFines *= yearMultiplier;
              baseArrests *= yearMultiplier;
              baseCharges *= yearMultiplier;

              // Add random variation
              const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
              baseFines *= randomFactor;
              baseArrests *= randomFactor;
              baseCharges *= randomFactor;

              // Round to integers
              const fines = Math.max(0, Math.round(baseFines));
              const arrests = Math.max(0, Math.round(baseArrests));
              const charges = Math.max(0, Math.round(baseCharges));

              // Only add records with meaningful numbers
              if (fines > 0 || arrests > 0 || charges > 0) {
                this.rawData.push({
                  YEAR: year.toString(),
                  JURISDICTION: jurisdiction,
                  AGE_GROUP: ageGroup,
                  METRIC: metric,
                  DETECTION_METHOD: method,
                  FINES: fines.toString(),
                  ARRESTS: arrests.toString(),
                  CHARGES: charges.toString()
                });
              }
            });
          });
        });
      });
    });

    console.log(`Generated ${this.rawData.length} sample records for drugs & alcohol analysis`);
  }

  _processData() {
    // Convert string values to numbers and validate
    this.rawData.forEach(d => {
      d.YEAR = +d.YEAR;
      d.FINES = +d.FINES || 0;
      d.ARRESTS = +d.ARRESTS || 0;
      d.CHARGES = +d.CHARGES || 0;
    });

    // Create processed data structure
    this.processedData = {
      // By year
      byYear: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES),
          records: v.length
        }),
        d => d.YEAR
      ).map(([year, data]) => ({ year, ...data })).sort((a, b) => a.year - b.year),

      // By jurisdiction
      byJurisdiction: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES),
          records: v.length
        }),
        d => d.JURISDICTION
      ).map(([jurisdiction, data]) => ({ jurisdiction, ...data })),

      // By age group
      byAgeGroup: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES),
          records: v.length
        }),
        d => d.AGE_GROUP
      ).map(([ageGroup, data]) => ({ ageGroup, ...data })),

      // By metric (violation type)
      byMetric: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES),
          records: v.length
        }),
        d => d.METRIC
      ).map(([metric, data]) => ({ metric, ...data })),

      // By detection method
      byDetectionMethod: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES),
          records: v.length
        }),
        d => d.DETECTION_METHOD
      ).map(([method, data]) => ({ method, ...data })),

      // Time series by jurisdiction
      timeSeriesByJurisdiction: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES)
        }),
        d => d.JURISDICTION,
        d => d.YEAR
      ).map(([jurisdiction, yearData]) => ({
        jurisdiction,
        values: yearData.map(([year, data]) => ({ year, ...data })).sort((a, b) => a.year - b.year)
      })),

      // Age groups by metric
      ageGroupsByMetric: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          totalArrests: d3.sum(v, d => d.ARRESTS),
          totalCharges: d3.sum(v, d => d.CHARGES)
        }),
        d => d.METRIC,
        d => d.AGE_GROUP
      ).map(([metric, ageData]) => ({
        metric,
        ageGroups: ageData.map(([ageGroup, data]) => ({ ageGroup, ...data }))
      }))
    };
  }

  _calculateStatistics() {
    // Calculate key statistics
    this.keyStats.totalRecords = this.rawData.length;
    this.keyStats.totalFines = d3.sum(this.rawData, d => d.FINES);
    this.keyStats.totalArrests = d3.sum(this.rawData, d => d.ARRESTS);
    this.keyStats.totalCharges = d3.sum(this.rawData, d => d.CHARGES);

    // Find peak year
    const peakYear = this.processedData.byYear.reduce((max, d) => 
      (d.totalFines + d.totalArrests + d.totalCharges) > (max.totalFines + max.totalArrests + max.totalCharges) ? d : max
    );
    this.keyStats.peakYear = peakYear.year;

    // Find top jurisdiction
    const topJurisdiction = this.processedData.byJurisdiction.reduce((max, d) => 
      (d.totalFines + d.totalArrests + d.totalCharges) > (max.totalFines + max.totalArrests + max.totalCharges) ? d : max
    );
    this.keyStats.topJurisdiction = topJurisdiction.jurisdiction;

    // Find top age group
    const topAgeGroup = this.processedData.byAgeGroup.reduce((max, d) => 
      (d.totalFines + d.totalArrests + d.totalCharges) > (max.totalFines + max.totalArrests + max.totalCharges) ? d : max
    );
    this.keyStats.topAgeGroup = topAgeGroup.ageGroup;

    // Find primary metric (most common violation type)
    const primaryMetric = this.processedData.byMetric.reduce((max, d) => 
      (d.totalFines + d.totalArrests + d.totalCharges) > (max.totalFines + max.totalArrests + max.totalCharges) ? d : max
    );
    this.keyStats.primaryMetric = primaryMetric.metric;

    console.log("Drugs & alcohol statistics:", this.keyStats);
  }

  // Utility methods for filtering
  getDataByFilters(filters = {}) {
    let filtered = [...this.rawData];

    if (filters.jurisdictions && filters.jurisdictions.length > 0) {
      filtered = filtered.filter(d => filters.jurisdictions.includes(d.JURISDICTION));
    }

    if (filters.years && filters.years.length > 0) {
      filtered = filtered.filter(d => filters.years.includes(d.YEAR.toString()));
    }

    if (filters.ageGroups && filters.ageGroups.length > 0) {
      filtered = filtered.filter(d => filters.ageGroups.includes(d.AGE_GROUP));
    }

    if (filters.metrics && filters.metrics.length > 0) {
      filtered = filtered.filter(d => filters.metrics.includes(d.METRIC));
    }

    if (filters.detectionMethods && filters.detectionMethods.length > 0) {
      filtered = filtered.filter(d => filters.detectionMethods.includes(d.DETECTION_METHOD));
    }

    return filtered;
  }

  getAggregatedData(data, groupBy) {
    return d3.rollups(
      data,
      v => ({
        totalFines: d3.sum(v, d => d.FINES),
        totalArrests: d3.sum(v, d => d.ARRESTS),
        totalCharges: d3.sum(v, d => d.CHARGES),
        count: v.length,
        avgFines: d3.mean(v, d => d.FINES),
        avgArrests: d3.mean(v, d => d.ARRESTS),
        avgCharges: d3.mean(v, d => d.CHARGES)
      }),
      d => d[groupBy]
    ).map(([key, values]) => ({ [groupBy.toLowerCase()]: key, ...values }));
  }

  // Get unique values for dropdowns
  getUniqueValues(field) {
    return [...new Set(this.rawData.map(d => d[field]))].sort();
  }

  // Get data for specific analysis
  getDrugVsAlcoholData() {
    const drugMetrics = this.rawData.filter(d => 
      d.METRIC.toLowerCase().includes('drug') || 
      d.METRIC.toLowerCase().includes('substance')
    );
    
    const alcoholMetrics = this.rawData.filter(d => 
      d.METRIC.toLowerCase().includes('drink') || 
      d.METRIC.toLowerCase().includes('alcohol') ||
      d.METRIC.toLowerCase().includes('breath')
    );

    return {
      drugs: {
        totalFines: d3.sum(drugMetrics, d => d.FINES),
        totalArrests: d3.sum(drugMetrics, d => d.ARRESTS),
        totalCharges: d3.sum(drugMetrics, d => d.CHARGES),
        records: drugMetrics.length
      },
      alcohol: {
        totalFines: d3.sum(alcoholMetrics, d => d.FINES),
        totalArrests: d3.sum(alcoholMetrics, d => d.ARRESTS),
        totalCharges: d3.sum(alcoholMetrics, d => d.CHARGES),
        records: alcoholMetrics.length
      }
    };
  }
}

// Initialize the data loader
const drugsAlcoholDataLoader = new DrugsAlcoholDataLoader();

// Auto-load data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing drugs & alcohol data loader...");
  drugsAlcoholDataLoader.loadData().then(data => {
    console.log("Drugs & alcohol data loading complete:", data);
    
    // Update statistics in UI
    if (data.stats) {
      const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
          if (typeof value === 'number' && value > 1000) {
            element.textContent = value.toLocaleString();
          } else {
            element.textContent = value;
          }
        }
      };

      updateElement('total-fines-stat', data.stats.totalFines);
      updateElement('total-arrests-stat', data.stats.totalArrests);
      updateElement('total-charges-stat', data.stats.totalCharges);
      updateElement('primary-metric', data.stats.primaryMetric);
      updateElement('peak-year', data.stats.peakYear);
      updateElement('leading-jurisdiction', data.stats.topJurisdiction);
      updateElement('top-age-group', data.stats.topAgeGroup);

      // Calculate and display comparison stats
      const comparisonData = drugsAlcoholDataLoader.getDrugVsAlcoholData();
      updateElement('alcohol-total', comparisonData.alcohol.totalFines + comparisonData.alcohol.totalArrests + comparisonData.alcohol.totalCharges);
      updateElement('drug-total', comparisonData.drugs.totalFines + comparisonData.drugs.totalArrests + comparisonData.drugs.totalCharges);
      updateElement('combined-total', data.stats.totalFines + data.stats.totalArrests + data.stats.totalCharges);
      
      const alcoholDrugRatio = comparisonData.alcohol.totalFines > 0 && comparisonData.drugs.totalFines > 0 ? 
        (comparisonData.alcohol.totalFines / comparisonData.drugs.totalFines).toFixed(1) + ':1' : 'N/A';
      updateElement('alcohol-drug-ratio', alcoholDrugRatio);
    }
  }).catch(error => {
    console.error("Drugs & alcohol data loading failed:", error);
  });
});

// Export for use in other modules
window.DrugsAlcoholDataLoader = DrugsAlcoholDataLoader;
window.drugsAlcoholDataLoader = drugsAlcoholDataLoader;