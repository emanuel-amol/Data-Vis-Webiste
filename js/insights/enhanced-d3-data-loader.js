// Enhanced D3 Data Loader for Insights Dashboard
// File: js/insights/enhanced-d3-data-loader.js

class EnhancedDataLoader {
    constructor() {
        this.rawData = null;
        this.processedData = null;
        this.cache = new Map();
        this.isLoaded = false;
    }

    async loadData() {
        if (this.isLoaded) return this.processedData;
        
        try {
            // Load the CSV data using the file reader API
            const csvContent = await window.fs.readFile('data/police_enforcement_2023_fines.csv', { encoding: 'utf8' });
            
            // Parse with Papa Parse
            const parsed = d3.csvParse(csvContent, d => ({
                year: +d.YEAR,
                jurisdiction: d.JURISDICTION,
                ageGroup: d.AGE_GROUP,
                metric: d.METRIC,
                detectionMethod: d.DETECTION_METHOD,
                fines: +d.FINES
            }));

            this.rawData = parsed;
            this.processedData = this.processData(parsed);
            this.isLoaded = true;
            
            console.log('Data loaded successfully:', {
                totalRecords: this.rawData.length,
                dateRange: d3.extent(this.rawData, d => d.year),
                jurisdictions: [...new Set(this.rawData.map(d => d.jurisdiction))],
                metrics: [...new Set(this.rawData.map(d => d.metric))]
            });
            
            return this.processedData;
        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error('Failed to load enforcement data');
        }
    }

    processData(data) {
        const processed = {
            byJurisdiction: this.aggregateByJurisdiction(data),
            byYear: this.aggregateByYear(data),
            byAgeGroup: this.aggregateByAgeGroup(data),
            byDetectionMethod: this.aggregateByDetectionMethod(data),
            totalsByJurisdiction2023: this.getTotals2023(data),
            trendData: this.getTrendData(data),
            ageDistribution2023: this.getAgeDistribution2023(data),
            technologyImpact: this.getTechnologyImpact(data),
            summaryStats: this.getSummaryStats(data)
        };

        return processed;
    }

    aggregateByJurisdiction(data) {
        const cacheKey = 'byJurisdiction';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        const grouped = d3.group(data, d => d.jurisdiction);
        const result = Array.from(grouped, ([jurisdiction, records]) => ({
            jurisdiction,
            totalFines: d3.sum(records, d => d.fines),
            recordCount: records.length,
            years: [...new Set(records.map(d => d.year))].sort(),
            metrics: [...new Set(records.map(d => d.metric))],
            latest2023: d3.sum(records.filter(d => d.year === 2023), d => d.fines),
            growth: this.calculateGrowth(records)
        })).sort((a, b) => b.totalFines - a.totalFines);

        this.cache.set(cacheKey, result);
        return result;
    }

    aggregateByYear(data) {
        const cacheKey = 'byYear';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        const grouped = d3.group(data, d => d.year);
        const result = Array.from(grouped, ([year, records]) => ({
            year,
            totalFines: d3.sum(records, d => d.fines),
            jurisdictionCount: new Set(records.map(d => d.jurisdiction)).size,
            records: records.length
        })).sort((a, b) => a.year - b.year);

        this.cache.set(cacheKey, result);
        return result;
    }

    aggregateByAgeGroup(data) {
        const cacheKey = 'byAgeGroup';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        // Filter for 2023 data only and exclude "All ages"
        const data2023 = data.filter(d => d.year === 2023 && d.ageGroup !== "All ages");
        const grouped = d3.group(data2023, d => d.ageGroup);
        
        const result = Array.from(grouped, ([ageGroup, records]) => ({
            ageGroup,
            totalFines: d3.sum(records, d => d.fines),
            percentage: 0 // Will be calculated after total
        }));

        const total = d3.sum(result, d => d.totalFines);
        result.forEach(d => d.percentage = (d.totalFines / total) * 100);

        this.cache.set(cacheKey, result.sort((a, b) => b.totalFines - a.totalFines));
        return this.cache.get(cacheKey);
    }

    aggregateByDetectionMethod(data) {
        const data2023 = data.filter(d => d.year === 2023);
        const grouped = d3.group(data2023, d => d.detectionMethod);
        
        return Array.from(grouped, ([method, records]) => ({
            method,
            totalFines: d3.sum(records, d => d.fines),
            jurisdictions: [...new Set(records.map(d => d.jurisdiction))]
        })).sort((a, b) => b.totalFines - a.totalFines);
    }

    getTotals2023(data) {
        const data2023 = data.filter(d => d.year === 2023);
        const grouped = d3.group(data2023, d => d.jurisdiction);
        
        return Array.from(grouped, ([jurisdiction, records]) => ({
            jurisdiction,
            total: d3.sum(records, d => d.fines),
            mobilePhone: d3.sum(records.filter(d => d.metric === 'mobile_phone_use'), d => d.fines),
            seatbelts: d3.sum(records.filter(d => d.metric === 'non_wearing_seatbelts'), d => d.fines),
            speed: d3.sum(records.filter(d => d.metric === 'speed_fines'), d => d.fines),
            unlicensed: d3.sum(records.filter(d => d.metric === 'unlicensed_driving'), d => d.fines)
        })).sort((a, b) => b.total - a.total);
    }

    getTrendData(data) {
        const grouped = d3.group(data, d => `${d.year}-${d.jurisdiction}`);
        const result = [];

        const jurisdictions = [...new Set(data.map(d => d.jurisdiction))];
        const years = [...new Set(data.map(d => d.year))].sort();

        jurisdictions.forEach(jurisdiction => {
            const jurisdictionData = years.map(year => {
                const key = `${year}-${jurisdiction}`;
                const records = grouped.get(key) || [];
                return {
                    year,
                    jurisdiction,
                    total: d3.sum(records, d => d.fines)
                };
            });
            result.push(...jurisdictionData);
        });

        return result;
    }

    getAgeDistribution2023(data) {
        const data2023 = data.filter(d => d.year === 2023 && d.ageGroup !== "All ages");
        return this.aggregateByAgeGroup(data);
    }

    getTechnologyImpact(data) {
        // Calculate the impact of technology deployment
        const cameraData = data.filter(d => 
            d.detectionMethod.includes('camera') || 
            d.detectionMethod.includes('Camera')
        );
        
        const grouped = d3.group(cameraData, d => `${d.year}-${d.jurisdiction}`);
        const result = [];

        const jurisdictions = [...new Set(cameraData.map(d => d.jurisdiction))];
        const years = [...new Set(cameraData.map(d => d.year))].sort();

        jurisdictions.forEach(jurisdiction => {
            const jurisdictionData = years.map(year => {
                const key = `${year}-${jurisdiction}`;
                const records = grouped.get(key) || [];
                return {
                    year,
                    jurisdiction,
                    cameraFines: d3.sum(records, d => d.fines),
                    hasCamera: records.length > 0
                };
            });
            result.push(...jurisdictionData);
        });

        return result;
    }

    getSummaryStats(data) {
        const data2023 = data.filter(d => d.year === 2023);
        const middleAged = data2023.filter(d => d.ageGroup === '40-64');
        const young = data2023.filter(d => d.ageGroup === '17-25');
        
        return {
            totalFines2023: d3.sum(data2023, d => d.fines),
            middleAgedFines: d3.sum(middleAged, d => d.fines),
            youngDriverFines: d3.sum(young, d => d.fines),
            middleAgedPercentage: (d3.sum(middleAged, d => d.fines) / d3.sum(data2023, d => d.fines)) * 100,
            jurisdictionCount: new Set(data.map(d => d.jurisdiction)).size,
            yearSpan: d3.extent(data, d => d.year),
            totalRecords: data.length
        };
    }

    calculateGrowth(records) {
        const years = [...new Set(records.map(d => d.year))].sort();
        if (years.length < 2) return 0;

        const firstYear = years[0];
        const lastYear = years[years.length - 1];
        
        const firstYearTotal = d3.sum(records.filter(d => d.year === firstYear), d => d.fines);
        const lastYearTotal = d3.sum(records.filter(d => d.year === lastYear), d => d.fines);
        
        if (firstYearTotal === 0) return 0;
        return ((lastYearTotal - firstYearTotal) / firstYearTotal) * 100;
    }

    // Utility methods for specific analyses
    getJurisdictionRanking(year = 2023) {
        const yearData = this.rawData.filter(d => d.year === year);
        const grouped = d3.group(yearData, d => d.jurisdiction);
        
        return Array.from(grouped, ([jurisdiction, records]) => ({
            jurisdiction,
            total: d3.sum(records, d => d.fines),
            rank: 0 // Will be set after sorting
        }))
        .sort((a, b) => b.total - a.total)
        .map((d, i) => ({ ...d, rank: i + 1 }));
    }

    getJurisdictionDetails(jurisdiction) {
        const jurisdictionData = this.rawData.filter(d => d.jurisdiction === jurisdiction);
        
        return {
            jurisdiction,
            totalFines: d3.sum(jurisdictionData, d => d.fines),
            fines2023: d3.sum(jurisdictionData.filter(d => d.year === 2023), d => d.fines),
            growth: this.calculateGrowth(jurisdictionData),
            yearlyTotals: d3.group(jurisdictionData, d => d.year),
            metrics: [...new Set(jurisdictionData.map(d => d.metric))],
            detectionMethods: [...new Set(jurisdictionData.map(d => d.detectionMethod))],
            hasCameraTechnology: jurisdictionData.some(d => 
                d.detectionMethod.includes('camera') || 
                d.detectionMethod.includes('Camera')
            )
        };
    }
}

// Export for use in other modules
window.EnhancedDataLoader = EnhancedDataLoader;