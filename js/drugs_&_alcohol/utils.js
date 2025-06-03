// js/drugs_&_alcohol/utils.js
// Utility functions for drugs and alcohol analysis

class DrugsAlcoholUtils {
  static formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }

  static formatPercentage(num, decimals = 1) {
    return num.toFixed(decimals) + '%';
  }

  static calculateGrowthRate(current, previous) {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  static getAgeGroupOrder() {
    return ['0-16', '17-25', '26-39', '40-64', '65 and over'];
  }

  static sortByAgeGroup(data, ageField = 'ageGroup') {
    const order = this.getAgeGroupOrder();
    return data.sort((a, b) => {
      const aIndex = order.indexOf(a[ageField]);
      const bIndex = order.indexOf(b[ageField]);
      return aIndex - bIndex;
    });
  }

  static getJurisdictionFullName(abbr) {
    const mapping = {
      'NSW': 'New South Wales',
      'VIC': 'Victoria',
      'QLD': 'Queensland',
      'SA': 'South Australia',
      'WA': 'Western Australia',
      'TAS': 'Tasmania',
      'NT': 'Northern Territory',
      'ACT': 'Australian Capital Territory'
    };
    return mapping[abbr] || abbr;
  }

  static isDrugMetric(metric) {
    const drugKeywords = ['drug', 'substance', 'narcotics', 'cannabis', 'cocaine', 'heroin', 'methamphetamine'];
    return drugKeywords.some(keyword => 
      metric.toLowerCase().includes(keyword)
    );
  }

  static isAlcoholMetric(metric) {
    const alcoholKeywords = ['alcohol', 'drink', 'drunk', 'breath', 'dui', 'bac'];
    return alcoholKeywords.some(keyword => 
      metric.toLowerCase().includes(keyword)
    );
  }

  static categorizeMetrics(data) {
    const categories = {
      alcohol: [],
      drugs: [],
      other: []
    };

    data.forEach(item => {
      const metric = item.metric || item.METRIC || '';
      if (this.isAlcoholMetric(metric)) {
        categories.alcohol.push(item);
      } else if (this.isDrugMetric(metric)) {
        categories.drugs.push(item);
      } else {
        categories.other.push(item);
      }
    });

    return categories;
  }

  static calculateStatistics(data) {
    if (!data || data.length === 0) {
      return {
        total: 0,
        mean: 0,
        median: 0,
        std: 0,
        min: 0,
        max: 0
      };
    }

    const values = data.map(d => d.value || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const mean = total / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      total,
      mean,
      median,
      std,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  static generateColorPalette(count) {
    const baseColors = [
      '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#2ecc71',
      '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#95a5a6'
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generate additional colors if needed
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle approximation
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }

    return colors;
  }

  static animateValue(element, start, end, duration = 1000) {
    if (!element) return;

    const startTime = performance.now();
    const change = end - start;

    function updateValue(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = start + (change * easedProgress);
      element.textContent = Math.round(currentValue).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    }

    requestAnimationFrame(updateValue);
  }

  static debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static createTooltipContent(data, options = {}) {
    const {
      title = '',
      showPercentage = false,
      showPerCapita = false,
      customFields = []
    } = options;

    let content = '';
    
    if (title) {
      content += `<div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 8px; padding-bottom: 8px;">
        <strong>${title}</strong>
      </div>`;
    }

    // Add main data fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'title' || customFields.includes(key)) return;
      
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const formattedValue = typeof value === 'number' ? 
        (value > 1000 ? value.toLocaleString() : value) : value;
      
      content += `<div style="margin-bottom: 6px;">
        <strong>${label}:</strong> ${formattedValue}
      </div>`;
    });

    // Add custom fields
    customFields.forEach(field => {
      if (data[field] !== undefined) {
        const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        content += `<div style="margin-bottom: 6px;">
          <strong>${label}:</strong> ${data[field]}
        </div>`;
      }
    });

    return content;
  }

  static exportToCSV(data, filename = 'drugs_alcohol_data.csv') {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? 
            `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  static showNotification(message, type = 'info', duration = 3000) {
    // Remove any existing notifications
    const existing = document.querySelector('.drugs-alcohol-notification');
    if (existing) {
      existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'drugs-alcohol-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    // Set color based on type
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, duration);
  }

  static validateData(data, requiredFields = []) {
    if (!data || !Array.isArray(data)) {
      return { valid: false, error: 'Data must be an array' };
    }

    if (data.length === 0) {
      return { valid: false, error: 'Data array is empty' };
    }

    // Check required fields
    for (const field of requiredFields) {
      if (!data.every(item => item.hasOwnProperty(field))) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  }

  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  static sumBy(array, key) {
    return array.reduce((sum, item) => sum + (item[key] || 0), 0);
  }

  static meanBy(array, key) {
    if (array.length === 0) return 0;
    return this.sumBy(array, key) / array.length;
  }

  static findPeak(data, valueField = 'value') {
    if (!data || data.length === 0) return null;
    return data.reduce((max, item) => 
      (item[valueField] || 0) > (max[valueField] || 0) ? item : max
    );
  }

  static calculateTrend(data, xField = 'year', yField = 'value') {
    if (!data || data.length < 2) return { slope: 0, direction: 'stable' };

    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d[xField], 0);
    const sumY = data.reduce((sum, d) => sum + d[yField], 0);
    const sumXY = data.reduce((sum, d) => sum + d[xField] * d[yField], 0);
    const sumXX = data.reduce((sum, d) => sum + d[xField] * d[xField], 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction = 'stable';
    if (Math.abs(slope) > 0.1) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { slope, direction };
  }

  static createLoadingSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'drugs-alcohol-loading';
    spinner.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      flex-direction: column;
    `;
    
    spinner.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: drugs-alcohol-spin 1s linear infinite;
        margin-bottom: 15px;
      "></div>
      <p style="color: #7f8c8d; font-style: italic;">Loading drugs & alcohol data...</p>
    `;

    // Add CSS animation if not already present
    if (!document.querySelector('#drugs-alcohol-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'drugs-alcohol-spinner-style';
      style.textContent = `
        @keyframes drugs-alcohol-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    if (container) {
      container.appendChild(spinner);
    }

    return spinner;
  }

  static removeLoadingSpinner(container) {
    if (container) {
      const spinner = container.querySelector('.drugs-alcohol-loading');
      if (spinner) {
        spinner.remove();
      }
    }
  }

  static formatDateRange(startYear, endYear) {
    if (startYear === endYear) {
      return startYear.toString();
    }
    return `${startYear} - ${endYear}`;
  }

  static getColorForMetric(metric) {
    const colorMap = {
      'totalFines': '#3498db',
      'totalArrests': '#e74c3c',
      'totalCharges': '#f39c12',
      'fines': '#3498db',
      'arrests': '#e74c3c',
      'charges': '#f39c12'
    };

    return colorMap[metric] || '#95a5a6';
  }

  static createResponsiveScale(domain, range, padding = 0.1) {
    const scale = d3.scaleLinear()
      .domain(domain)
      .range(range);

    const domainSize = domain[1] - domain[0];
    const paddingAmount = domainSize * padding;
    
    return scale.domain([
      domain[0] - paddingAmount,
      domain[1] + paddingAmount
    ]);
  }

  static addChartTransitions(selection, duration = 300) {
    return selection
      .transition()
      .duration(duration)
      .ease(d3.easeQuadOut);
  }

  static handleChartResize(chartInstance, containerSelector) {
    if (!chartInstance || !containerSelector) return;

    const resizeHandler = this.debounce(() => {
      const container = document.querySelector(containerSelector);
      if (container && typeof chartInstance.update === 'function') {
        chartInstance.update();
      }
    }, 250);

    window.addEventListener('resize', resizeHandler);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }
}

// Export utilities globally
window.DrugsAlcoholUtils = DrugsAlcoholUtils;