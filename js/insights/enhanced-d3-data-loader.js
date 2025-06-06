// js/insights/enhanced-d3-data-loader.js
// Enhanced data loader with D3.js integration for responsive graphs

class EnhancedD3DataLoader {
  constructor() {
    this.rawData = null;
    this.processedData = null;
    this.currentFilters = {
      jurisdiction: 'all',
      year: 'all',
      metric: 'all',
      ageGroup: 'all'
    };
    this.subscribers = new Map();
    this.isLoaded = false;
    
    // Population data for calculations
    this.populationData = {
      'ACT': 431000, 'NSW': 8166000, 'NT': 249000, 'QLD': 5260000,
      'SA': 1803000, 'TAS': 571000, 'VIC': 6680000, 'WA': 2787000
    };
  }

  async loadData() {
    try {
      console.log("Loading CSV data with D3...");
      
      // Try to load real CSV first
      try {
        this.rawData = await d3.csv('../data/police_enforcement_2023_fines.csv', d => ({
          year: +d.YEAR,
          jurisdiction: d.JURISDICTION,
          ageGroup: d.AGE_GROUP,
          metric: d.METRIC,
          detectionMethod: d.DETECTION_METHOD,
          fines: +d.FINES || 0
        }));
        console.log(`Real data loaded: ${this.rawData.length} records`);
      } catch (error) {
        console.warn("Using generated sample data for demo");
        this.generateSampleData();
      }

      this.processData();
      this.isLoaded = true;
      
      // Notify all subscribers
      this.notifySubscribers('dataLoaded', this.getProcessedData());
      
      return this.getProcessedData();
      
    } catch (error) {
      console.error("Data loading failed:", error);
      throw error;
    }
  }

  generateSampleData() {
    const years = d3.range(2019, 2024);
    const jurisdictions = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];
    const ageGroups = ['17-25', '26-39', '40-64', '65 and over'];
    const metrics = ['mobile_phone_use', 'speed_fines', 'non_wearing_seatbelts'];
    const methods = ['Police issued', 'Mobile camera', 'Fixed camera'];

    this.rawData = [];

    years.forEach(year => {
      jurisdictions.forEach(jurisdiction => {
        ageGroups.forEach(ageGroup => {
          metrics.forEach(metric => {
            methods.forEach(method => {
              // Create realistic patterns
              let baseFines = 1000;
              
              // Jurisdiction multipliers
              const jMultipliers = {
                'NSW': year >= 2020 ? 3.5 : 2.8,
                'VIC': 2.2, 'QLD': 1.8, 'WA': 1.5,
                'SA': 1.2, 'ACT': 0.8, 'TAS': 0.6, 'NT': 0.7
              };
              baseFines *= jMultipliers[jurisdiction];

              // Age group multipliers (middle-aged highest)
              const ageMultipliers = {
                '17-25': 0.7, '26-39': 1.0, '40-64': 1.6, '65 and over': 0.4
              };
              baseFines *= ageMultipliers[ageGroup];

              // Technology boost for cameras
              if (method.includes('camera') && year >= 2020) {
                baseFines *= 2.2;
              }

              // Metric patterns
              if (metric === 'mobile_phone_use' && year >= 2020) baseFines *= 2.0;
              if (metric === 'speed_fines') baseFines *= 1.8;

              // Random variation
              baseFines *= (0.7 + Math.random() * 0.6);
              
              const fines = Math.max(50, Math.round(baseFines));

              this.rawData.push({
                year,
                jurisdiction,
                ageGroup,
                metric,
                detectionMethod: method,
                fines
              });
            });
          });
        });
      });
    });

    console.log(`Generated ${this.rawData.length} sample records`);
  }

  processData() {
    // Process data with D3 rollups for efficient aggregation
    this.processedData = {
      // By jurisdiction with comprehensive metrics
      byJurisdiction: this.aggregateByJurisdiction(),
      
      // By year for time series
      byYear: this.aggregateByYear(),
      
      // By age group for demographic analysis
      byAgeGroup: this.aggregateByAgeGroup(),
      
      // By metric type
      byMetric: this.aggregateByMetric(),
      
      // Summary statistics
      summary: this.calculateSummaryStats(),
      
      // For map coloring
      mapData: this.prepareMapData()
    };
  }

  aggregateByJurisdiction() {
    return d3.rollups(
      this.rawData,
      v => {
        const totalFines = d3.sum(v, d => d.fines);
        const population = this.populationData[v[0].jurisdiction] || 1;
        const perCapita = (totalFines / population) * 100000;
        
        // Calculate growth rate (2020-2023)
        const recent = v.filter(d => d.year >= 2020);
        const early = v.filter(d => d.year <= 2020);
        const earlySum = d3.sum(early, d => d.fines);
        const recentSum = d3.sum(recent, d => d.fines);
        const growthRate = earlySum > 0 ? ((recentSum - earlySum) / earlySum) * 100 : 0;
        
        // Technology score based on camera usage
        const cameraFines = d3.sum(v.filter(d => d.detectionMethod.includes('camera')), d => d.fines);
        const techRatio = totalFines > 0 ? cameraFines / totalFines : 0;
        
        return {
          jurisdiction: v[0].jurisdiction,
          totalFines,
          avgFines: d3.mean(v, d => d.fines),
          perCapita,
          growthRate,
          techRatio,
          recordCount: v.length,
          population
        };
      },
      d => d.jurisdiction
    ).map(([jurisdiction, data]) => data);
  }

  aggregateByYear() {
    return d3.rollups(
      this.rawData,
      v => ({
        year: v[0].year,
        totalFines: d3.sum(v, d => d.fines),
        avgFines: d3.mean(v, d => d.fines),
        recordCount: v.length,
        byJurisdiction: d3.rollup(v, vv => d3.sum(vv, d => d.fines), d => d.jurisdiction)
      }),
      d => d.year
    ).map(([year, data]) => data).sort((a, b) => a.year - b.year);
  }

  aggregateByAgeGroup() {
    return d3.rollups(
      this.rawData,
      v => {
        const totalFines = d3.sum(v, d => d.fines);
        return {
          ageGroup: v[0].ageGroup,
          totalFines,
          avgFines: d3.mean(v, d => d.fines),
          percentage: 0 // Will be calculated after all groups
        };
      },
      d => d.ageGroup
    ).map(([ageGroup, data]) => data);
  }

  aggregateByMetric() {
    return d3.rollups(
      this.rawData,
      v => ({
        metric: v[0].metric,
        totalFines: d3.sum(v, d => d.fines),
        avgFines: d3.mean(v, d => d.fines),
        recordCount: v.length
      }),
      d => d.metric
    ).map(([metric, data]) => data);
  }

  calculateSummaryStats() {
    const totalFines = d3.sum(this.rawData, d => d.fines);
    const jurisdictionTotals = d3.rollup(this.rawData, v => d3.sum(v, d => d.fines), d => d.jurisdiction);
    const ageTotals = d3.rollup(this.rawData, v => d3.sum(v, d => d.fines), d => d.ageGroup);
    
    // Calculate percentages for age groups
    this.processedData?.byAgeGroup?.forEach(item => {
      item.percentage = (item.totalFines / totalFines) * 100;
    });
    
    return {
      totalFines,
      totalRecords: this.rawData.length,
      jurisdictionCount: jurisdictionTotals.size,
      topJurisdiction: [...jurisdictionTotals.entries()].sort((a, b) => b[1] - a[1])[0],
      middleAgedPercentage: (ageTotals.get('40-64') || 0) / totalFines * 100,
      peakYear: [...d3.rollup(this.rawData, v => d3.sum(v, d => d.fines), d => d.year).entries()]
        .sort((a, b) => b[1] - a[1])[0]
    };
  }

  prepareMapData() {
    const jurisdictionData = new Map();
    
    this.processedData.byJurisdiction.forEach(item => {
      jurisdictionData.set(item.jurisdiction, {
        ...item,
        colorValue: item.totalFines,
        intensity: this.calculateIntensity(item.totalFines)
      });
    });
    
    return jurisdictionData;
  }

  calculateIntensity(value) {
    const maxValue = d3.max(this.processedData.byJurisdiction, d => d.totalFines);
    return value / maxValue;
  }

  // Filtering methods for responsive updates
  applyFilters(filters = {}) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    
    let filteredData = [...this.rawData];
    
    if (this.currentFilters.jurisdiction !== 'all') {
      filteredData = filteredData.filter(d => d.jurisdiction === this.currentFilters.jurisdiction);
    }
    
    if (this.currentFilters.year !== 'all') {
      filteredData = filteredData.filter(d => d.year === +this.currentFilters.year);
    }
    
    if (this.currentFilters.metric !== 'all') {
      filteredData = filteredData.filter(d => d.metric === this.currentFilters.metric);
    }
    
    if (this.currentFilters.ageGroup !== 'all') {
      filteredData = filteredData.filter(d => d.ageGroup === this.currentFilters.ageGroup);
    }
    
    // Temporarily replace rawData for processing
    const originalData = this.rawData;
    this.rawData = filteredData;
    this.processData();
    this.rawData = originalData;
    
    // Notify subscribers of filtered data
    this.notifySubscribers('dataFiltered', this.getProcessedData());
    
    return this.getProcessedData();
  }

  // Subscription system for reactive updates
  subscribe(eventType, callback, id = null) {
    const subscriptionId = id || `sub_${Date.now()}_${Math.random()}`;
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }
    
    this.subscribers.get(eventType).set(subscriptionId, callback);
    return subscriptionId;
  }

  unsubscribe(eventType, subscriptionId) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.get(eventType).delete(subscriptionId);
    }
  }

  notifySubscribers(eventType, data) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.get(eventType).forEach(callback => {
        try {
          callback(data, this.currentFilters);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  // Public API methods
  getProcessedData() {
    return {
      ...this.processedData,
      filters: this.currentFilters,
      rawDataLength: this.rawData?.length || 0
    };
  }

  getJurisdictionData(jurisdictionCode) {
    return this.processedData.byJurisdiction.find(d => d.jurisdiction === jurisdictionCode);
  }

  getYearData(year) {
    return this.processedData.byYear.find(d => d.year === year);
  }

  getTopPerformers(metric = 'totalFines', limit = 5) {
    return [...this.processedData.byJurisdiction]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }

  getTimeSeriesForJurisdiction(jurisdictionCode) {
    const jurisdictionData = this.rawData.filter(d => d.jurisdiction === jurisdictionCode);
    
    return d3.rollups(
      jurisdictionData,
      v => ({
        year: v[0].year,
        fines: d3.sum(v, d => d.fines),
        jurisdiction: jurisdictionCode
      }),
      d => d.year
    ).map(([year, data]) => data).sort((a, b) => a.year - b.year);
  }

  // Method to get data formatted for specific D3 visualizations
  getFormattedDataFor(visualizationType) {
    switch (visualizationType) {
      case 'map':
        return this.processedData.mapData;
      
      case 'timeSeriesChart':
        return this.processedData.byYear;
      
      case 'barChart':
        return this.processedData.byJurisdiction.map(d => ({
          category: d.jurisdiction,
          value: d.totalFines,
          label: `${d.jurisdiction}: ${d.totalFines.toLocaleString()}`
        }));
      
      case 'pieChart':
        return this.processedData.byAgeGroup.map(d => ({
          category: d.ageGroup,
          value: d.totalFines,
          percentage: d.percentage
        }));
      
      case 'scatterPlot':
        return this.processedData.byJurisdiction.map(d => ({
          x: d.perCapita,
          y: d.growthRate,
          jurisdiction: d.jurisdiction,
          size: d.totalFines
        }));
      
      default:
        return this.processedData;
    }
  }

  // Utility method for color scales
  createColorScale(metric = 'totalFines') {
    const data = this.processedData.byJurisdiction;
    const extent = d3.extent(data, d => d[metric]);
    
    return d3.scaleSequential()
      .domain(extent)
      .interpolator(d3.interpolateBlues);
  }

  // Method to export processed data
  exportData(format = 'json') {
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: this.rawData.length,
        filters: this.currentFilters
      },
      processed: this.processedData,
      raw: this.rawData
    };

    if (format === 'csv') {
      return d3.csvFormat(this.rawData);
    }
    
    return JSON.stringify(exportData, null, 2);
  }
}

// Create global instance
window.enhancedD3DataLoader = new EnhancedD3DataLoader();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Enhanced D3 Data Loader...');
  window.enhancedD3DataLoader.loadData()
    .then(data => {
      console.log('Enhanced D3 data loader ready:', data.summary);
      
      // Dispatch global event
      document.dispatchEvent(new CustomEvent('d3DataReady', {
        detail: { loader: window.enhancedD3DataLoader, data }
      }));
    })
    .catch(error => {
      console.error('Failed to load data:', error);
    });
});

// Export the class
window.EnhancedD3DataLoader = EnhancedD3DataLoader;