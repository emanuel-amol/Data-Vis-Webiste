// Advanced Statistical Utilities
// Provides statistical functions for enhanced data analysis

class StatisticsUtils {
  // Calculate confidence intervals for a dataset
  static confidenceInterval(data, confidenceLevel = 0.95) {
    const n = data.length;
    const mean = d3.mean(data);
    const std = d3.deviation(data);
    const sem = std / Math.sqrt(n);
    
    // t-distribution critical value (approximation for large n)
    const alpha = 1 - confidenceLevel;
    const tValue = this.tCritical(n - 1, alpha / 2);
    
    const margin = tValue * sem;
    
    return {
      mean: mean,
      lower: mean - margin,
      upper: mean + margin,
      margin: margin,
      std: std,
      n: n
    };
  }
  
  // Approximate t-critical value
  static tCritical(df, alpha) {
    // Simplified approximation - in production, use a proper t-distribution library
    if (df >= 30) {
      // Use normal approximation for large df
      return this.zCritical(alpha);
    } else {
      // Basic t-values for common cases
      const tTable = {
        0.025: { // 95% confidence
          1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
          10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060, 29: 2.045
        }
      };
      
      const closest = Object.keys(tTable[alpha] || {})
        .map(Number)
        .reduce((prev, curr) => 
          Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
        );
      
      return tTable[alpha]?.[closest] || 2.0;
    }
  }
  
  // Z-critical value for normal distribution
  static zCritical(alpha) {
    // Common z-values
    const zTable = {
      0.005: 2.576, // 99%
      0.01: 2.326,  // 98%
      0.025: 1.96,  // 95%
      0.05: 1.645,  // 90%
      0.1: 1.282    // 80%
    };
    
    return zTable[alpha] || 1.96;
  }
  
  // Perform t-test between two groups
  static tTest(group1, group2) {
    const n1 = group1.length;
    const n2 = group2.length;
    const mean1 = d3.mean(group1);
    const mean2 = d3.mean(group2);
    const var1 = d3.variance(group1);
    const var2 = d3.variance(group2);
    
    // Pooled variance
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
    
    const tStat = (mean1 - mean2) / se;
    const df = n1 + n2 - 2;
    
    return {
      tStatistic: tStat,
      degreesOfFreedom: df,
      pValue: this.tToPValue(Math.abs(tStat), df),
      significant: this.tToPValue(Math.abs(tStat), df) < 0.05,
      mean1: mean1,
      mean2: mean2,
      difference: mean1 - mean2
    };
  }
  
  // Convert t-statistic to p-value (approximation)
  static tToPValue(tStat, df) {
    // Very rough approximation
    if (df >= 30) {
      // Use normal approximation
      return 2 * (1 - this.normalCDF(tStat));
    }
    
    // Simplified lookup for common cases
    if (tStat > 2.576) return 0.01;
    if (tStat > 2.0) return 0.05;
    if (tStat > 1.645) return 0.1;
    return 0.2;
  }
  
  // Normal CDF approximation
  static normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }
  
  // Error function approximation
  static erf(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
  
  // Calculate correlation coefficient
  static correlation(x, y) {
    const n = Math.min(x.length, y.length);
    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);
    
    const xMean = d3.mean(xSlice);
    const yMean = d3.mean(ySlice);
    
    let numerator = 0;
    let xSumSq = 0;
    let ySumSq = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xSlice[i] - xMean;
      const yDiff = ySlice[i] - yMean;
      
      numerator += xDiff * yDiff;
      xSumSq += xDiff * xDiff;
      ySumSq += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(xSumSq * ySumSq);
    const r = denominator === 0 ? 0 : numerator / denominator;
    
    return {
      correlation: r,
      rSquared: r * r,
      significant: Math.abs(r) > this.correlationCritical(n),
      n: n
    };
  }
  
  // Critical value for correlation significance (p < 0.05)
  static correlationCritical(n) {
    // Approximate critical values for correlation
    if (n >= 100) return 0.195;
    if (n >= 50) return 0.279;
    if (n >= 30) return 0.349;
    if (n >= 20) return 0.423;
    if (n >= 10) return 0.576;
    return 0.8;
  }
  
  // Linear regression
  static linearRegression(x, y) {
    const n = Math.min(x.length, y.length);
    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);
    
    const xMean = d3.mean(xSlice);
    const yMean = d3.mean(ySlice);
    
    let ssXY = 0;
    let ssXX = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xSlice[i] - xMean;
      const yDiff = ySlice[i] - yMean;
      
      ssXY += xDiff * yDiff;
      ssXX += xDiff * xDiff;
    }
    
    const slope = ssXX === 0 ? 0 : ssXY / ssXX;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * xSlice[i] + intercept;
      ssRes += (ySlice[i] - predicted) ** 2;
      ssTot += (ySlice[i] - yMean) ** 2;
    }
    
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    
    return {
      slope: slope,
      intercept: intercept,
      rSquared: rSquared,
      correlation: Math.sqrt(rSquared) * Math.sign(slope),
      predict: (x) => slope * x + intercept,
      n: n
    };
  }
  
  // Detect outliers using IQR method
  static detectOutliers(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = d3.quantile(sorted, 0.25);
    const q3 = d3.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return {
      outliers: data.filter(d => d < lowerBound || d > upperBound),
      lowerBound: lowerBound,
      upperBound: upperBound,
      q1: q1,
      q3: q3,
      iqr: iqr
    };
  }
  
  // Calculate effect size (Cohen's d)
  static cohensD(group1, group2) {
    const mean1 = d3.mean(group1);
    const mean2 = d3.mean(group2);
    const var1 = d3.variance(group1);
    const var2 = d3.variance(group2);
    
    const pooledStd = Math.sqrt((var1 + var2) / 2);
    const d = (mean1 - mean2) / pooledStd;
    
    let interpretation;
    if (Math.abs(d) < 0.2) interpretation = "negligible";
    else if (Math.abs(d) < 0.5) interpretation = "small";
    else if (Math.abs(d) < 0.8) interpretation = "medium";
    else interpretation = "large";
    
    return {
      d: d,
      interpretation: interpretation,
      pooledStd: pooledStd
    };
  }
  
  // Normalize data to per-capita rates
  static normalizePerCapita(data, populationData) {
    return data.map((d, i) => {
      const population = populationData[i] || 1;
      return {
        ...d,
        rawValue: d.value,
        normalizedValue: (d.value / population) * 100000, // per 100,000 population
        population: population
      };
    });
  }
  
  // Calculate moving average
  static movingAverage(data, window = 3) {
    const result = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(data[i]);
      } else {
        const slice = data.slice(i - window + 1, i + 1);
        const avg = d3.mean(slice);
        result.push(avg);
      }
    }
    
    return result;
  }
  
  // Calculate trend using linear regression
  static calculateTrend(data, timePoints) {
    const regression = this.linearRegression(timePoints, data);
    
    let trendDirection;
    if (Math.abs(regression.slope) < 0.01) trendDirection = "stable";
    else if (regression.slope > 0) trendDirection = "increasing";
    else trendDirection = "decreasing";
    
    return {
      ...regression,
      direction: trendDirection,
      significance: regression.rSquared > 0.5 ? "strong" : 
                   regression.rSquared > 0.3 ? "moderate" : "weak"
    };
  }
}

// Export for use in other modules
window.StatisticsUtils = StatisticsUtils;