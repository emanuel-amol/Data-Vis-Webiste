// Fixed D3 Australia Map Visualization for Insights Dashboard
// File: js/insights/d3-responsive-map-visualization.js

class AustraliaMapVisualization {
    constructor() {
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
        
        this.selectedJurisdiction = null;
        this.onJurisdictionSelect = null;
        this.svg = null;
        this.mapGroup = null;
        
        // Improved coordinates for Australian jurisdictions with better proportions
        this.jurisdictionCoordinates = {
            'WA': { x: 50, y: 180, width: 200, height: 240 },
            'NT': { x: 250, y: 100, width: 160, height: 180 },
            'QLD': { x: 410, y: 60, width: 180, height: 320 },
            'SA': { x: 250, y: 280, width: 160, height: 140 },
            'NSW': { x: 410, y: 280, width: 140, height: 160 },
            'VIC': { x: 360, y: 420, width: 120, height: 100 },
            'TAS': { x: 420, y: 540, width: 80, height: 80 },
            'ACT': { x: 520, y: 360, width: 30, height: 30 }
        };
    }

    create(container, data, options = {}) {
        try {
            const containerElement = d3.select(container);
            containerElement.selectAll("*").remove();
            
            const rect = containerElement.node().getBoundingClientRect();
            const width = Math.max(options.width || rect.width || 600, 400);
            const height = Math.max(options.height || rect.height || 500, 300);
            
            // Create SVG
            this.svg = containerElement
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("background", "#f8fafc")
                .style("border-radius", "8px");

            // Create map group with proper scaling
            this.mapGroup = this.svg.append("g")
                .attr("class", "map-group");

            // Calculate scale factor based on container size
            const baseWidth = 600;
            const baseHeight = 650;
            const scaleX = width / baseWidth;
            const scaleY = height / baseHeight;
            const scale = Math.min(scaleX, scaleY) * 0.85; // 85% to leave margin

            // Center the map
            const offsetX = (width - baseWidth * scale) / 2;
            const offsetY = (height - baseHeight * scale) / 2;

            this.mapGroup.attr("transform", `translate(${offsetX}, ${offsetY}) scale(${scale})`);

            // Create data lookup for quick access
            const dataLookup = new Map();
            if (Array.isArray(data)) {
                data.forEach(d => {
                    if (d && d.jurisdiction) {
                        dataLookup.set(d.jurisdiction, d);
                    }
                });
            }

            // Create color scale based on data values
            const validData = data.filter(d => d && d.total !== undefined);
            const maxValue = validData.length > 0 ? d3.max(validData, d => d.total) : 100000;
            const minValue = validData.length > 0 ? d3.min(validData, d => d.total) : 0;

            // Create jurisdiction shapes
            Object.entries(this.jurisdictionCoordinates).forEach(([jurisdiction, coords]) => {
                const jurisdictionData = dataLookup.get(jurisdiction);
                const fineCount = jurisdictionData ? jurisdictionData.total : 0;
                
                // Create jurisdiction group
                const jurisdictionGroup = this.mapGroup.append("g")
                    .attr("class", `jurisdiction jurisdiction-${jurisdiction}`)
                    .style("cursor", "pointer");

                // Calculate opacity based on data value
                const baseOpacity = 0.7;
                const dataOpacity = fineCount > 0 ? 
                    baseOpacity + (0.3 * (fineCount - minValue) / (maxValue - minValue)) : 
                    baseOpacity;

                // Create the jurisdiction shape (rounded rectangle)
                const shape = jurisdictionGroup.append("rect")
                    .attr("x", coords.x)
                    .attr("y", coords.y)
                    .attr("width", coords.width)
                    .attr("height", coords.height)
                    .attr("fill", this.jurisdictionColors[jurisdiction] || '#6b7280')
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 3)
                    .attr("rx", 8)
                    .attr("ry", 8)
                    .style("opacity", dataOpacity)
                    .style("transition", "all 0.3s ease");

                // Add jurisdiction label
                const labelFontSize = Math.min(coords.width, coords.height) / 6;
                jurisdictionGroup.append("text")
                    .attr("x", coords.x + coords.width / 2)
                    .attr("y", coords.y + coords.height / 2 - 5)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-weight", "bold")
                    .style("font-size", `${Math.max(labelFontSize, 12)}px`)
                    .style("fill", "white")
                    .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.8)")
                    .style("pointer-events", "none")
                    .text(jurisdiction);

                // Add value label if data exists
                if (jurisdictionData && jurisdictionData.total > 0) {
                    const valueFontSize = Math.min(coords.width, coords.height) / 8;
                    jurisdictionGroup.append("text")
                        .attr("x", coords.x + coords.width / 2)
                        .attr("y", coords.y + coords.height / 2 + 15)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .style("font-size", `${Math.max(valueFontSize, 10)}px`)
                        .style("font-weight", "600")
                        .style("fill", "white")
                        .style("text-shadow", "1px 1px 3px rgba(0,0,0,0.8)")
                        .style("pointer-events", "none")
                        .text(this.formatValue(fineCount));
                }

                // Add rank indicator if available
                if (jurisdictionData && jurisdictionData.rank) {
                    const rankSize = Math.min(coords.width, coords.height) / 10;
                    jurisdictionGroup.append("circle")
                        .attr("cx", coords.x + coords.width - 15)
                        .attr("cy", coords.y + 15)
                        .attr("r", Math.max(rankSize, 8))
                        .attr("fill", "#ffffff")
                        .attr("stroke", this.jurisdictionColors[jurisdiction])
                        .attr("stroke-width", 2)
                        .style("opacity", 0.9);

                    jurisdictionGroup.append("text")
                        .attr("x", coords.x + coords.width - 15)
                        .attr("y", coords.y + 15)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .style("font-size", `${Math.max(rankSize, 8)}px`)
                        .style("font-weight", "bold")
                        .style("fill", this.jurisdictionColors[jurisdiction])
                        .style("pointer-events", "none")
                        .text(jurisdictionData.rank);
                }

                // Add interaction handlers
                jurisdictionGroup
                    .on("mouseover", (event) => this.handleMouseOver(event, jurisdiction, jurisdictionData))
                    .on("mouseout", (event) => this.handleMouseOut(event))
                    .on("click", () => this.handleClick(jurisdiction, jurisdictionData));
            });

            // Add title
            this.svg.append("text")
                .attr("x", width / 2)
                .attr("y", 25)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("fill", "#374151")
                .text("Road Safety Enforcement by Jurisdiction (2023)");

            // Add legend
            this.addLegend(width, height, maxValue, minValue);
            
            console.log('Map visualization created successfully');
            return this.svg.node();
            
        } catch (error) {
            console.error('Error creating map visualization:', error);
            this.showErrorState(container);
            return null;
        }
    }

    addLegend(width, height, maxValue, minValue) {
        if (!this.svg) return;

        const legend = this.svg.append("g")
            .attr("class", "map-legend")
            .attr("transform", `translate(20, ${height - 120})`);

        // Legend background
        legend.append("rect")
            .attr("x", -10)
            .attr("y", -10)
            .attr("width", 200)
            .attr("height", 100)
            .attr("fill", "white")
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1)
            .attr("rx", 6)
            .style("opacity", 0.95);

        // Legend title
        legend.append("text")
            .attr("x", 0)
            .attr("y", 5)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#374151")
            .text("Total Fines");

        // Legend scale
        const legendScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([0, 150]);

        const legendAxis = d3.axisBottom(legendScale)
            .tickSize(10)
            .tickFormat(d => this.formatValue(d));

        legend.append("g")
            .attr("transform", "translate(0, 30)")
            .call(legendAxis);

        // Color gradient
        const gradient = this.svg.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#e5e7eb")
            .attr("stop-opacity", 0.7);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#1e40af")
            .attr("stop-opacity", 1);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 15)
            .attr("width", 150)
            .attr("height", 15)
            .attr("fill", "url(#legendGradient)")
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 1);
    }

    formatValue(value) {
        return value?.toLocaleString() || 'N/A';
    }

    showTooltip(event, jurisdiction, data) {
        const tooltip = d3.select("body").append("div")
            .attr("class", "insights-map-tooltip");

        const content = data ? `
            <strong>${jurisdiction}</strong><br/>
            Total: ${data.total?.toLocaleString() || 'N/A'}<br/>
            ${data.rank ? `#${data.rank}` : ''}
        ` : `
            <strong>${jurisdiction}</strong><br/>
            No data available
        `;

        tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("opacity", 0.9);
    }

    hideTooltip() {
        d3.selectAll(".insights-map-tooltip").remove();
    }

    updateData(newData) {
        if (!newData || !Array.isArray(newData)) {
            console.warn('Invalid data provided to updateData');
            return;
        }

        const dataLookup = new Map(newData.map(d => [d.jurisdiction, d]));
        
        // Update jurisdiction fill colors and labels
        Object.keys(this.jurisdictionCoordinates).forEach(jurisdiction => {
            const jurisdictionData = dataLookup.get(jurisdiction);
            const group = d3.select(`.jurisdiction-${jurisdiction}`);
            
            if (jurisdictionData && group && !group.empty()) {
                // Update value label
                const valueText = group.select("text:last-child");
                if (!valueText.empty()) {
                    valueText.text(this.formatValue(jurisdictionData.total || 0));
                }
            }
        });
    }

    setJurisdictionSelectCallback(callback) {
        this.onJurisdictionSelect = callback;
    }

    selectJurisdiction(jurisdiction) {
        // Find data for this jurisdiction if available
        const data = null; // Would need to be passed or retrieved from current data
        this.handleClick(jurisdiction, data);
    }

    showErrorState(container) {
        const containerElement = d3.select(container);
        containerElement.selectAll("*").remove();
        
        containerElement.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("height", "400px")
            .style("background", "#fee2e2")
            .style("border-radius", "8px")
            .style("border", "1px solid #fecaca")
            .style("color", "#dc2626")
            .style("font-size", "14px")
            .style("text-align", "center")
            .html(`
                <div>
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <div style="font-weight: 600;">Map Visualization Error</div>
                    <div style="margin-top: 8px;">Unable to render interactive map</div>
                </div>
            `);
    }

    // Responsive resize method
    resize(newWidth, newHeight) {
        if (!this.svg) {
            console.warn('Cannot resize: SVG not initialized');
            return;
        }
        
        try {
            this.svg
                .attr("width", newWidth)
                .attr("height", newHeight);

            // Recalculate scale and position
            const baseWidth = 600;
            const baseHeight = 650;
            const scaleX = newWidth / baseWidth;
            const scaleY = newHeight / baseHeight;
            const scale = Math.min(scaleX, scaleY) * 0.85;

            const offsetX = (newWidth - baseWidth * scale) / 2;
            const offsetY = (newHeight - baseHeight * scale) / 2;

            if (this.mapGroup) {
                this.mapGroup.attr("transform", `translate(${offsetX}, ${offsetY}) scale(${scale})`);
            }
            
            // Update title position
            this.svg.select("text")
                .attr("x", newWidth / 2);

            // Update legend position
            this.svg.select(".map-legend")
                .attr("transform", `translate(20, ${newHeight - 120})`);
                
        } catch (error) {
            console.error('Error resizing map:', error);
        }
    }

    // Cleanup method
    destroy() {
        if (this.svg) {
            this.svg.remove();
            this.svg = null;
            this.mapGroup = null;
        }
        this.selectedJurisdiction = null;
        this.onJurisdictionSelect = null;
    }

    handleMouseOver(event, jurisdiction, data) {
        // Highlight jurisdiction
        d3.select(event.currentTarget)
            .selectAll('rect')
            .style('opacity', 1)
            .style('stroke-width', 4);

        // Show tooltip
        this.showTooltip(event, jurisdiction, data);
    }

    handleMouseOut(event) {
        // Reset jurisdiction appearance
        d3.select(event.currentTarget)
            .selectAll('rect')
            .style('opacity', 0.8)
            .style('stroke-width', 3);

        // Hide tooltip
        this.hideTooltip();
    }

    handleClick(jurisdiction, data) {
        if (typeof this.onJurisdictionSelect === 'function') {
            this.onJurisdictionSelect(jurisdiction, data);
        }
    }
}

// Export for use in other modules
window.AustraliaMapVisualization = AustraliaMapVisualization;