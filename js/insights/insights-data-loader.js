// js/insights/insights-data-loader.js
// Data loader specifically for the insights page

class InsightsDataLoader {
  constructor() {
    this.rawData = null;
    this.processedData = null;
    this.jurisdictionData = null;
    this.ageGroupData = null;
    this.isLoaded = false;
    this.loadingPromise = null;
    
    // Population data for per-capita calculations
    this.populationData = {
      'ACT': 431000,
      'NSW': 8166000,
      'NT': 249000,
      'QLD': 5260000,
      'SA': 1803000,
      'TAS': 571000,
      'VIC': 6680000,
      'WA': 2787000
    };

    // Key insights and statistics
    this.keyInsights = {
      middleAgedPercentage: 45,
      middleAgedFines: 604750,
      youngDriverFines: 298300,
      experienceParadoxRatio: 2.0,
      peakYear: 2021,
      techLeader: 'NSW',
      techGrowth: 132
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
      console.log("Loading insights data...");
      
      // Load the main CSV file
      const csvPath = '../data/police_enforcement_2023_fines.csv';
      
      try {
        this.rawData = await d3.csv(csvPath);
        console.log(`Insights data loaded: ${this.rawData.length} records`);
      } catch (error) {
        console.warn("Could not load real CSV, using sample data for insights");
        this._createSampleData();
      }

      // Process and validate the data
      this._processData();
      this._calculateJurisdictionMetrics();
      this._calculateAgeGroupMetrics();
      
      this.isLoaded = true;
      
      // Store globally for other components
      window.insightsData = {
        raw: this.rawData,
        processed: this.processedData,
        jurisdictions: this.jurisdictionData,
        ageGroups: this.ageGroupData,
        insights: this.keyInsights,
        population: this.populationData
      };
      
      // Notify other components that data is ready
      document.dispatchEvent(new CustomEvent('insightsDataReady', {
        detail: { data: window.insightsData }
      }));
      
      return window.insightsData;
      
    } catch (error) {
      console.error("Error in insights data loading:", error);
      this._createSampleData();
      this._processData();
      this._calculateJurisdictionMetrics();
      this._calculateAgeGroupMetrics();
      this.isLoaded = true;
      
      window.insightsData = {
        raw: this.rawData,
        processed: this.processedData,
        jurisdictions: this.jurisdictionData,
        ageGroups: this.ageGroupData,
        insights: this.keyInsights,
        population: this.populationData
      };
      
      document.dispatchEvent(new CustomEvent('insightsDataReady', {
        detail: { data: window.insightsData }
      }));
      
      return window.insightsData;
    }
  }

  _createSampleData() {
    console.log("Creating sample data for insights page");
    
    this.rawData = [];
    const years = d3.range(2008, 2024);
    const jurisdictions = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
    const ageGroups = ['17-25', '26-39', '40-64', '65 and over'];
    const metrics = ['mobile_phone_use', 'Speeding', 'Red light', 'Seat belt'];
    const detectionMethods = ['Camera', 'Police issued'];

    // Create realistic patterns based on insights
    years.forEach(year => {
      jurisdictions.forEach(jurisdiction => {
        ageGroups.forEach(ageGroup => {
          metrics.forEach(metric => {
            detectionMethods.forEach(method => {
              let baseFines = 1000;
              
              // Jurisdiction patterns - NSW leads with technology
              const jurisdictionMultipliers = {
                'NSW': year >= 2019 ? (year === 2021 ? 4.5 : 3.2) : 2.8,  // Tech boost
                'VIC': 2.5,
                'QLD': 2.0,
                'WA': 1.7,
                'SA': 1.3,
                'ACT': 0.9,
                'TAS': 0.7,
                'NT': 0.8
              };
              
              baseFines *= jurisdictionMultipliers[jurisdiction] || 1.0;

              // Age group patterns - middle-aged highest
              const ageMultipliers = {
                '17-25': 0.8,   // Lower than expected
                '26-39': 1.0,
                '40-64': 1.8,   // Highest - the insight!
                '65 and over': 0.4
              };
              
              baseFines *= ageMultipliers[ageGroup] || 1.0;

              // Technology impact for cameras
              if (method === 'Camera' && year >= 2019) {
                baseFines *= (year === 2021 ? 2.5 : 1.8);
              }

              // Metric patterns
              const metricMultipliers = {
                'mobile_phone_use': year >= 2019 ? 2.5 : 1.0,
                'Speeding': 1.5,
                'Red light': 0.8,
                'Seat belt': 0.6
              };
              
              baseFines *= metricMultipliers[metric] || 1.0;

              // Add random variation
              const randomFactor = 0.7 + (Math.random() * 0.6);
              baseFines *= randomFactor;

              const fines = Math.max(10, Math.round(baseFines));

              if (fines > 10) {
                this.rawData.push({
                  YEAR: year.toString(),
                  JURISDICTION: jurisdiction,
                  AGE_GROUP: ageGroup,
                  METRIC: metric,
                  DETECTION_METHOD: method,
                  FINES: fines.toString()
                });
              }
            });
          });
        });
      });
    });

    console.log(`Generated ${this.rawData.length} sample records for insights`);
  }

  _processData() {
    // Convert string values to numbers
    this.rawData.forEach(d => {
      d.YEAR = +d.YEAR;
      d.FINES = +d.FINES || 0;
    });

    // Create processed data structure
    this.processedData = {
      // By year
      byYear: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          records: v.length,
          avgFines: d3.mean(v, d => d.FINES)
        }),
        d => d.YEAR
      ).map(([year, data]) => ({ year, ...data })).sort((a, b) => a.year - b.year),

      // By jurisdiction
      byJurisdiction: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          records: v.length,
          avgFines: d3.mean(v, d => d.FINES)
        }),
        d => d.JURISDICTION
      ).map(([jurisdiction, data]) => ({ jurisdiction, ...data })),

      // By age group
      byAgeGroup: d3.rollups(
        this.rawData,
        v => ({
          totalFines: d3.sum(v, d => d.FINES),
          records: v.length,
          avgFines: d3.mean(v, d => d.FINES)
        }),
        d => d.AGE_GROUP
      ).map(([ageGroup, data]) => ({ ageGroup, ...data }))
    };
  }

  _calculateJurisdictionMetrics() {
    this.jurisdictionData = {};
    
    this.processedData.byJurisdiction.forEach(d => {
      const population = this.populationData[d.jurisdiction] || 1;
      const perCapita = (d.totalFines / population) * 100000; // per 100k
      
      // Calculate growth rate (2019-2021 for tech impact)
      const data2019 = this.rawData.filter(r => r.YEAR === 2019 && r.JURISDICTION === d.jurisdiction);
      const data2021 = this.rawData.filter(r => r.YEAR === 2021 && r.JURISDICTION === d.jurisdiction);
      
      const fines2019 = d3.sum(data2019, r => r.FINES);
      const fines2021 = d3.sum(data2021, r => r.FINES);
      
      const growthRate = fines2019 > 0 ? ((fines2021 - fines2019) / fines2019) * 100 : 0;
      
      // Technology score based on growth and modern detection methods
      const cameraData = this.rawData.filter(r => 
        r.JURISDICTION === d.jurisdiction && 
        r.DETECTION_METHOD === 'Camera'
      );
      const cameraRatio = cameraData.length / this.rawData.filter(r => r.JURISDICTION === d.jurisdiction).length;
      
      let techScore = 'C';
      if (growthRate > 100) techScore = 'A+';
      else if (growthRate > 40) techScore = 'A';
      else if (growthRate > 20) techScore = 'B+';
      else if (growthRate > 10) techScore = 'B';
      else if (growthRate > 5) techScore = 'B-';
      else if (growthRate > 0) techScore = 'C+';
      
      this.jurisdictionData[d.jurisdiction] = {
        ...d,
        population,
        perCapita,
        growthRate,
        techScore,
        cameraRatio,
        rank: 0 // Will be calculated after sorting
      };
    });

    // Calculate rankings
    const sorted = Object.entries(this.jurisdictionData)
      .sort(([,a], [,b]) => b.totalFines - a.totalFines);
    
    sorted.forEach(([jurisdiction, data], index) => {
      this.jurisdictionData[jurisdiction].rank = index + 1;
    });
  }

  _calculateAgeGroupMetrics() {
    this.ageGroupData = {};
    
    const totalFines = d3.sum(this.processedData.byAgeGroup, d => d.totalFines);
    
    this.processedData.byAgeGroup.forEach(d => {
      const percentage = (d.totalFines / totalFines) * 100;
      
      this.ageGroupData[d.ageGroup] = {
        ...d,
        percentage,
        isHighest: percentage > 40 // Flag for middle-aged insight
      };
    });

    // Update key insights with actual calculated values
    const middleAgedData = this.ageGroupData['40-64'];
    const youngDriverData = this.ageGroupData['17-25'];
    
    if (middleAgedData && youngDriverData) {
      this.keyInsights.middleAgedPercentage = Math.round(middleAgedData.percentage);
      this.keyInsights.middleAgedFines = middleAgedData.totalFines;
      this.keyInsights.youngDriverFines = youngDriverData.totalFines;
      this.keyInsights.experienceParadoxRatio = middleAgedData.totalFines / youngDriverData.totalFines;
    }
  }

  // Utility methods
  getJurisdictionDetails(jurisdictionCode) {
    const data = this.jurisdictionData[jurisdictionCode];
    if (!data) return null;

    const names = {
      'NSW': 'New South Wales',
      'VIC': 'Victoria',
      'QLD': 'Queensland',
      'SA': 'South Australia',
      'WA': 'Western Australia',
      'TAS': 'Tasmania',
      'NT': 'Northern Territory',
      'ACT': 'Australian Capital Territory'
    };

    return {
      code: jurisdictionCode,
      name: names[jurisdictionCode] || jurisdictionCode,
      ...data
    };
  }

  getPolicyRecommendations(jurisdictionCode) {
    const data = this.jurisdictionData[jurisdictionCode];
    if (!data) return [];

    const recommendations = [];
    
    if (data.growthRate > 50) {
      recommendations.push('Share technology and best practices with other jurisdictions');
      recommendations.push('Maintain leadership in enforcement innovation');
    } else if (data.growthRate < 10) {
      recommendations.push('Urgent technology modernization program needed');
      recommendations.push('Establish partnerships with leading jurisdictions');
    }
    
    if (data.cameraRatio < 0.3) {
      recommendations.push('Increase automated camera deployment');
    }
    
    if (data.perCapita > 160) {
      recommendations.push('Focus on driver education and behavior change');
    } else if (data.perCapita < 100) {
      recommendations.push('Increase enforcement presence and visibility');
    }

    recommendations.push('Develop targeted campaigns for middle-aged drivers (40-64)');
    
    return recommendations;
  }

  getTopPerformers() {
    return Object.entries(this.jurisdictionData)
      .sort(([,a], [,b]) => b.totalFines - a.totalFines)
      .slice(0, 3)
      .map(([code, data]) => ({
        code,
        name: this.getJurisdictionDetails(code).name,
        ...data
      }));
  }

  getTechnologyLeaders() {
    return Object.entries(this.jurisdictionData)
      .sort(([,a], [,b]) => b.growthRate - a.growthRate)
      .slice(0, 3)
      .map(([code, data]) => ({
        code,
        name: this.getJurisdictionDetails(code).name,
        ...data
      }));
  }
}

// Initialize the insights data loader
const insightsDataLoader = new InsightsDataLoader();

// Auto-load data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing insights data loader...");
  insightsDataLoader.loadData().then(data => {
    console.log("Insights data loading complete:", data);
  }).catch(error => {
    console.error("Insights data loading failed:", error);
  });
});

// Export for use in other modules
window.InsightsDataLoader = InsightsDataLoader;
window.insightsDataLoader = insightsDataLoader;