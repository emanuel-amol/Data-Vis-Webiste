// Fixed D3 Responsive Charts for Insights Dashboard
// File: js/insights/d3-responsive-charts.js

class ResponsiveChartFactory {
    constructor() {
        this.defaultMargin = { top: 20, right: 30, bottom: 40, left: 60 };
        this.colors = {
            primary: '#3b82f6',
            secondary: '#7c3aed',
            success: '#059669',
            warning: '#f59e0b',
            danger: '#dc2626',
            muted: '#6b7280'
        };
        this.jurisdictionColors = {
            'NSW': '#1e40af',
            'VIC': '#7c3aed', 
            'QLD': '#059669',
            'WA': '#dc2626',
            'SA': '#f59e0b',
            'TAS': '#4b5563',
            'ACT': '#0891b2',
            'NT': '#be185d'
        };
    }

    createTrendChart(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            this.showNoDataMessage(container, "No trend data available");
            return;
        }
        
        // Filter out any duplicate or invalid entries
        const cleanedData = data.reduce((acc, curr) => {
            if (curr && curr.jurisdiction && curr.total !== undefined) {
                const existing = acc.find(d => d.jurisdiction === curr.jurisdiction);
                if (!existing || existing.total < curr.total) {
                    // Keep only the highest value for each jurisdiction
                    if (existing) {
                        acc = acc.filter(d => d.jurisdiction !== curr.jurisdiction);
                    }
                    acc.push(curr);
                }
            }
            return acc;
        }, []);

        const margin = { ...this.defaultMargin, right: 120, ...options.margin };
        const containerElement = d3.select(container);
        
        // Clear existing content
        containerElement.selectAll("*").remove();
        
        // Get container dimensions
        const rect = containerElement.node().getBoundingClientRect();
        const width = Math.max((options.width || rect.width || 600), 400) - margin.left - margin.right;
        const height = Math.max((options.height || 400), 200) - margin.top - margin.bottom;

        const svg = containerElement
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Sort data by total for better visualization
        const sortedData = cleanedData.filter(d => d.total !== undefined).sort((a, b) => b.total - a.total);

        // Scales
        const xScale = d3.scaleBand()
            .domain(sortedData.map(d => d.jurisdiction))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.total)])
            .nice()
            .range([height, 0]);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "12px");

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => this.formatNumber(d, 'thousands')))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Total Fines (2023)");

        // Add bars
        g.selectAll(".bar")
            .data(sortedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.jurisdiction))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.total))
            .attr("height", d => height - yScale(d.total))
            .attr("fill", d => this.jurisdictionColors[d.jurisdiction] || this.colors.primary)
            .style("opacity", 0.8)
            .on("mouseover", (event, d) => {
                d3.select(event.target).style("opacity", 1);
                const rank = sortedData.findIndex(x => x.jurisdiction === d.jurisdiction) + 1;
                this.showTooltip(event, d, `${d.jurisdiction}<br/>Total: ${d.total.toLocaleString()}<br/>Rank: #${rank}`);
            })
            .on("mouseout", (event) => {
                d3.select(event.target).style("opacity", 0.8);
                this.hideTooltip();
            });

        // Add value labels on bars
        g.selectAll(".label")
            .data(sortedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.jurisdiction) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.total) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text(d => this.formatNumber(d.total, 'thousands'));

        return svg.node();
    }

    createPieChart(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            this.showNoDataMessage(container, "No pie chart data available");
            return;
        }
        
        const containerElement = d3.select(container);
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = Math.max(options.width || rect.width || 400, 300);
        const height = Math.max(options.height || 400, 300);
        const radius = Math.min(width, height) / 2 - 40;

        const svg = containerElement
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${width/2},${height/2})`);

        // Color scale
        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.ageGroup))
            .range([this.colors.primary, this.colors.secondary, this.colors.success, this.colors.warning, this.colors.danger]);

        // Pie generator
        const pie = d3.pie()
            .value(d => d.totalFines)
            .sort(null);

        // Arc generators
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const labelArc = d3.arc()
            .innerRadius(radius * 0.8)
            .outerRadius(radius * 0.8);

        // Add arcs
        const arcs = g.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.ageGroup))
            .style("opacity", 0.8)
            .on("mouseover", (event, d) => {
                d3.select(event.target).style("opacity", 1);
                this.showTooltip(event, d.data, `${d.data.ageGroup}<br/>Fines: ${d.data.totalFines.toLocaleString()}<br/>Percentage: ${d.data.percentage.toFixed(1)}%`);
            })
            .on("mouseout", (event) => {
                d3.select(event.target).style("opacity", 0.8);
                this.hideTooltip();
            });

        // Add percentage labels
        arcs.append("text")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.7)")
            .text(d => `${d.data.percentage.toFixed(0)}%`);

        return svg.node();
    }

    createScatterPlot(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            this.showNoDataMessage(container, "No scatter plot data available");
            return;
        }
        
        const margin = { ...this.defaultMargin, ...options.margin };
        const containerElement = d3.select(container);
        
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = Math.max((options.width || rect.width || 600), 400) - margin.left - margin.right;
        const height = Math.max((options.height || 400), 200) - margin.top - margin.bottom;

        const svg = containerElement
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Filter valid data
        const validData = data.filter(d => d.total !== undefined && d.growth !== undefined);

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(validData, d => d.total))
            .nice()
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(validData, d => d.growth))
            .nice()
            .range([height, 0]);

        // Add grid lines
        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat("")
            )
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.3);

        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat("")
            )
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.3);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => this.formatNumber(d, 'thousands')))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 35)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Total Fines (2023)");

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => `${d.toFixed(0)}%`))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Growth Rate");

        // Add zero line for growth rate
        g.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5");

        // Add circles
        g.selectAll(".dot")
            .data(validData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.total))
            .attr("cy", d => yScale(d.growth))
            .attr("r", 6)
            .attr("fill", d => this.jurisdictionColors[d.jurisdiction] || this.colors.primary)
            .style("opacity", 0.7)
            .on("mouseover", (event, d) => {
                d3.select(event.target).attr("r", 8).style("opacity", 1);
                this.showTooltip(event, d, `${d.jurisdiction}<br/>Total: ${d.total.toLocaleString()}<br/>Growth: ${d.growth.toFixed(1)}%`);
            })
            .on("mouseout", (event) => {
                d3.select(event.target).attr("r", 6).style("opacity", 0.7);
                this.hideTooltip();
            });

        // Add labels
        g.selectAll(".label")
            .data(validData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.total))
            .attr("y", d => yScale(d.growth) - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text(d => d.jurisdiction);

        return svg.node();
    }

    createBarChart(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            this.showNoDataMessage(container, "No bar chart data available");
            return;
        }
        
        const margin = { ...this.defaultMargin, bottom: 60, ...options.margin };
        const containerElement = d3.select(container);
        
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = Math.max((options.width || rect.width || 600), 300) - margin.left - margin.right;
        const height = Math.max((options.height || 400), 200) - margin.top - margin.bottom;

        const svg = containerElement
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Sort data by total descending
        const sortedData = data.filter(d => d.total !== undefined).sort((a, b) => b.total - a.total);

        // Scales
        const xScale = d3.scaleBand()
            .domain(sortedData.map(d => d.jurisdiction))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.total)])
            .nice()
            .range([height, 0]);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "12px");

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => this.formatNumber(d, 'thousands')))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Total Fines");

        // Add bars
        g.selectAll(".bar")
            .data(sortedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.jurisdiction))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.total))
            .attr("height", d => height - yScale(d.total))
            .attr("fill", d => this.jurisdictionColors[d.jurisdiction] || this.colors.primary)
            .style("opacity", 0.8)
            .on("mouseover", (event, d) => {
                d3.select(event.target).style("opacity", 1);
                const rank = sortedData.findIndex(x => x.jurisdiction === d.jurisdiction) + 1;
                this.showTooltip(event, d, `${d.jurisdiction}<br/>Total: ${d.total.toLocaleString()}<br/>Rank: #${rank}`);
            })
            .on("mouseout", (event) => {
                d3.select(event.target).style("opacity", 0.8);
                this.hideTooltip();
            });

        // Add value labels on bars
        g.selectAll(".label")
            .data(sortedData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.jurisdiction) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.total) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text(d => this.formatNumber(d.total, 'thousands'));

        return svg.node();
    }

    // Helper methods
    showNoDataMessage(container, message) {
        const containerElement = d3.select(container);
        containerElement.selectAll("*").remove();
        
        containerElement.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("height", "200px")
            .style("background", "#f8fafc")
            .style("border-radius", "8px")
            .style("border", "1px solid #e5e7eb")
            .style("color", "#9ca3af")
            .style("font-size", "14px")
            .text(message);
    }

    formatNumber(num, type = 'default') {
        if (num === null || num === undefined || isNaN(num)) return 'N/A';
        
        switch (type) {
            case 'thousands':
                return num.toLocaleString();
            case 'percentage':
                return num.toFixed(1) + '%';
            default:
                return num.toLocaleString();
        }
    }

    showTooltip(event, data, content) {
        const tooltip = d3.select("body").append("div")
            .attr("class", "insights-map-tooltip")
            .style("opacity", 0);

        const formattedContent = `
            <strong>${data.jurisdiction}</strong><br/>
            Total: ${data.total?.toLocaleString() || 'N/A'}<br/>
            ${data.rank ? `#${data.rank}` : ''}
        `;

        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            
        tooltip.html(formattedContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    hideTooltip() {
        d3.selectAll(".insights-map-tooltip").remove();
    }

    // Method to update chart data
    updateChart(container, newData, chartType, options = {}) {
        if (!newData || !Array.isArray(newData) || newData.length === 0) {
            this.showNoDataMessage(container, `No data available for ${chartType} chart`);
            return;
        }

        const containerElement = d3.select(container);
        
        // Store current transform for smooth transition
        const currentTransform = containerElement.select('svg g').attr('transform');
        
        // Smoothly fade out current content
        containerElement.selectAll('*')
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();

        // Create new chart
        setTimeout(() => {
            switch (chartType) {
                case 'trend':
                    this.createTrendChart(container, newData, options);
                    break;
                case 'bar':
                    this.createBarChart(container, newData, options);
                    break;
                case 'pie':
                    this.createPieChart(container, newData, options);
                    break;
                case 'scatter':
                    this.createScatterPlot(container, newData, options);
                    break;
            }

            // Smoothly fade in new content
            containerElement.selectAll('*')
                .style('opacity', 0)
                .transition()
                .duration(300)
                .style('opacity', 1);

            // Restore transform if exists
            if (currentTransform) {
                containerElement.select('svg g')
                    .attr('transform', currentTransform);
            }
        }, 300);
    }

    // Export chart as SVG
    exportSVG(container, filename = 'chart.svg') {
        const svg = d3.select(container).select('svg');
        if (svg.empty()) {
            console.warn('No SVG found to export');
            return;
        }
        
        const svgString = new XMLSerializer().serializeToString(svg.node());
        
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
window.ResponsiveChartFactory = ResponsiveChartFactory;