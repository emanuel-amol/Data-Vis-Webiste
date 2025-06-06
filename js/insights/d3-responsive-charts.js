// D3 Responsive Charts for Insights Dashboard
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
        if (!Array.isArray(data) || data.length === 0) return;
        
        const margin = { ...this.defaultMargin, right: 120, ...options.margin };
        const containerElement = d3.select(container);
        
        // Clear existing content
        containerElement.selectAll("*").remove();
        
        // Get container dimensions
        const rect = containerElement.node().getBoundingClientRect();
        const width = (options.width || rect.width || 600) - margin.left - margin.right;
        const height = (options.height || 400) - margin.top - margin.bottom;

        // Create SVG
        const svg = containerElement
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total)])
            .nice()
            .range([height, 0]);

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.total))
            .curve(d3.curveMonotoneX);

        // Group data by jurisdiction
        const nested = d3.group(data, d => d.jurisdiction);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 35)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Year");

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => `${d/1000}K`))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Total Fines");

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

        // Add lines
        nested.forEach((values, jurisdiction) => {
            const sortedValues = values.sort((a, b) => a.year - b.year);
            
            g.append("path")
                .datum(sortedValues)
                .attr("fill", "none")
                .attr("stroke", this.jurisdictionColors[jurisdiction] || this.colors.muted)
                .attr("stroke-width", 2.5)
                .attr("d", line)
                .style("opacity", 0.8);

            // Add dots
            g.selectAll(`.dot-${jurisdiction}`)
                .data(sortedValues)
                .enter().append("circle")
                .attr("class", `dot-${jurisdiction}`)
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.total))
                .attr("r", 3)
                .attr("fill", this.jurisdictionColors[jurisdiction] || this.colors.muted);
        });

        // Add legend
        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + 20}, 20)`);

        const jurisdictions = Array.from(nested.keys()).sort();
        
        legend.selectAll(".legend-item")
            .data(jurisdictions)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`)
            .each(function(d) {
                const item = d3.select(this);
                
                item.append("line")
                    .attr("x1", 0)
                    .attr("x2", 15)
                    .attr("y1", 0)
                    .attr("y2", 0)
                    .attr("stroke", this.jurisdictionColors[d] || this.colors.muted)
                    .attr("stroke-width", 2);
                
                item.append("text")
                    .attr("x", 20)
                    .attr("y", 4)
                    .text(d)
                    .style("font-size", "12px")
                    .attr("fill", "black");
            }.bind(this));

        // Add tooltip
        this.addTooltip(g, data, xScale, yScale);

        return svg.node();
    }

    createBarChart(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) return;
        
        const margin = { ...this.defaultMargin, bottom: 60, ...options.margin };
        const containerElement = d3.select(container);
        
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = (options.width || rect.width || 600) - margin.left - margin.right;
        const height = (options.height || 400) - margin.top - margin.bottom;

        const svg = containerElement
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.jurisdiction))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total)])
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
            .call(d3.axisLeft(yScale).tickFormat(d => `${d/1000}K`))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Total Fines (2023)");

        // Add bars
        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.jurisdiction))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.total))
            .attr("height", d => height - yScale(d.total))
            .attr("fill", d => this.jurisdictionColors[d.jurisdiction] || this.colors.primary)
            .style("opacity", 0.8)
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 1);
                
                const tooltip = d3.select("body").append("div")
                    .attr("class", "insights-map-tooltip")
                    .style("opacity", 0);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                    
                tooltip.html(`
                    <strong>${d.jurisdiction}</strong><br/>
                    Total Fines: ${d.total.toLocaleString()}<br/>
                    Rank: #${data.findIndex(x => x.jurisdiction === d.jurisdiction) + 1}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.8);
                d3.selectAll(".insights-map-tooltip").remove();
            });

        // Add value labels on bars
        g.selectAll(".label")
            .data(data)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.jurisdiction) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.total) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text(d => `${(d.total/1000).toFixed(0)}K`);

        return svg.node();
    }

    createPieChart(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) return;
        
        const containerElement = d3.select(container);
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = options.width || rect.width || 400;
        const height = options.height || 400;
        const radius = Math.min(width, height) / 2 - 20;

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

        // Arc generator
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
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 1);
                
                const tooltip = d3.select("body").append("div")
                    .attr("class", "insights-map-tooltip")
                    .style("opacity", 0);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                    
                tooltip.html(`
                    <strong>${d.data.ageGroup}</strong><br/>
                    Fines: ${d.data.totalFines.toLocaleString()}<br/>
                    Percentage: ${d.data.percentage.toFixed(1)}%
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.8);
                d3.selectAll(".insights-map-tooltip").remove();
            });

        // Add labels
        arcs.append("text")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text(d => `${d.data.percentage.toFixed(0)}%`);

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(20, 20)`);

        const legendItems = legend.selectAll(".legend-item")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => color(d.ageGroup));

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d.ageGroup)
            .style("font-size", "12px");

        return svg.node();
    }

    createScatterPlot(container, data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) return;
        
        const margin = { ...this.defaultMargin, ...options.margin };
        const containerElement = d3.select(container);
        
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = (options.width || rect.width || 600) - margin.left - margin.right;
        const height = (options.height || 400) - margin.top - margin.bottom;

        const svg = containerElement
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "white");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.total))
            .nice()
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.growth))
            .nice()
            .range([height, 0]);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => `${d/1000}K`))
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
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.total))
            .attr("cy", d => yScale(d.growth))
            .attr("r", 6)
            .attr("fill", d => this.jurisdictionColors[d.jurisdiction] || this.colors.primary)
            .style("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 8).style("opacity", 1);
                
                const tooltip = d3.select("body").append("div")
                    .attr("class", "insights-map-tooltip")
                    .style("opacity", 0);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                    
                tooltip.html(`
                    <strong>${d.jurisdiction}</strong><br/>
                    Total Fines: ${d.total.toLocaleString()}<br/>
                    Growth Rate: ${d.growth.toFixed(1)}%
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 6).style("opacity", 0.7);
                d3.selectAll(".insights-map-tooltip").remove();
            });

        // Add labels
        g.selectAll(".label")
            .data(data)
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

    addTooltip(g, data, xScale, yScale) {
        // Create invisible overlay for mouse events
        const overlay = g.append("rect")
            .attr("class", "overlay")
            .attr("width", xScale.range()[1])
            .attr("height", yScale.range()[0])
            .style("fill", "none")
            .style("pointer-events", "all");

        // Create tooltip elements
        const focus = g.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", yScale.range()[0]);

        focus.append("line")
            .attr("class", "y-hover-line hover-line")
            .attr("x1", 0)
            .attr("x2", xScale.range()[1]);

        focus.append("circle")
            .attr("r", 4);

        overlay
            .on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => focus.style("display", "none"))
            .on("mousemove", function(event) {
                const [mouseX] = d3.pointer(event);
                const x0 = xScale.invert(mouseX);
                
                // Find closest data point
                const bisectYear = d3.bisector(d => d.year).left;
                const i = bisectYear(data, x0, 1);
                const d0 = data[i - 1];
                const d1 = data[i];
                const d = d1 && (x0 - d0.year > d1.year - x0) ? d1 : d0;

                if (d) {
                    focus.attr("transform", `translate(${xScale(d.year)},${yScale(d.total)})`);
                    focus.select(".x-hover-line").attr("y2", yScale.range()[0] - yScale(d.total));
                    focus.select(".y-hover-line").attr("x2", -xScale(d.year));
                }
            });

        // Style hover lines
        g.selectAll(".hover-line")
            .style("stroke", "#999")
            .style("stroke-width", "1px")
            .style("stroke-dasharray", "3,3");

        focus.select("circle")
            .style("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", "2px");
    }

    // Utility method to make charts responsive
    makeResponsive(chartFunction, container, data, options = {}) {
        const resizeHandler = () => {
            chartFunction.call(this, container, data, options);
        };

        // Initial render
        resizeHandler();

        // Add resize listener
        window.addEventListener('resize', resizeHandler);

        // Return cleanup function
        return () => window.removeEventListener('resize', resizeHandler);
    }

    // Method to update chart data
    updateChart(container, newData, chartType, options = {}) {
        const containerElement = d3.select(container);
        
        // Fade out current chart
        containerElement.transition()
            .duration(200)
            .style('opacity', 0.3)
            .end()
            .then(() => {
                // Render new chart
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
                    default:
                        console.warn('Unknown chart type:', chartType);
                }
                
                // Fade in new chart
                containerElement.transition()
                    .duration(300)
                    .style('opacity', 1);
            });
    }

    // Export chart as SVG
    exportSVG(container, filename = 'chart.svg') {
        const svg = d3.select(container).select('svg');
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

    // Format numbers for display
    formatNumber(num, type = 'default') {
        switch (type) {
            case 'thousands':
                return `${(num / 1000).toFixed(0)}K`;
            case 'millions':
                return `${(num / 1000000).toFixed(1)}M`;
            case 'percentage':
                return `${num.toFixed(1)}%`;
            case 'currency':
                return `$${num.toLocaleString()}`;
            default:
                return num.toLocaleString();
        }
    }
}

// Export for use in other modules
window.ResponsiveChartFactory = ResponsiveChartFactory;