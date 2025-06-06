// D3 Responsive Map Visualization for Australian Jurisdictions
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
        
        // Simplified coordinates for Australian jurisdictions (relative positioning)
        this.jurisdictionCoordinates = {
            'WA': { x: 100, y: 200, width: 180, height: 220 },
            'NT': { x: 280, y: 120, width: 140, height: 160 },
            'QLD': { x: 420, y: 80, width: 160, height: 280 },
            'SA': { x: 280, y: 280, width: 140, height: 120 },
            'NSW': { x: 420, y: 280, width: 120, height: 140 },
            'VIC': { x: 380, y: 400, width: 100, height: 80 },
            'TAS': { x: 440, y: 500, width: 60, height: 60 },
            'ACT': { x: 500, y: 340, width: 20, height: 20 }
        };
    }

    create(container, data, options = {}) {
        const containerElement = d3.select(container);
        containerElement.selectAll("*").remove();
        
        const rect = containerElement.node().getBoundingClientRect();
        const width = options.width || rect.width || 600;
        const height = options.height || 500;
        
        // Create SVG
        const svg = containerElement
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "#f8fafc")
            .style("border-radius", "8px");

        // Create map group with proper scaling
        const mapGroup = svg.append("g")
            .attr("class", "map-group");

        // Calculate scale factor based on container size
        const baseWidth = 600;
        const baseHeight = 500;
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin

        // Center the map
        const offsetX = (width - baseWidth * scale) / 2;
        const offsetY = (height - baseHeight * scale) / 2;

        mapGroup.attr("transform", `translate(${offsetX}, ${offsetY}) scale(${scale})`);

        // Create color scale based on data
        const maxValue = d3.max(data, d => d.total);
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, maxValue]);

        // Create data lookup
        const dataLookup = new Map(data.map(d => [d.jurisdiction, d]));

        // Create jurisdiction shapes (simplified rectangles representing states)
        Object.entries(this.jurisdictionCoordinates).forEach(([jurisdiction, coords]) => {
            const jurisdictionData = dataLookup.get(jurisdiction);
            const fineCount = jurisdictionData ? jurisdictionData.total : 0;
            
            // Create jurisdiction group
            const jurisdictionGroup = mapGroup.append("g")
                .attr("class", `jurisdiction jurisdiction-${jurisdiction}`)
                .style("cursor", "pointer");

            // Create the shape (simplified rectangle for now)
            const shape = jurisdictionGroup.append("rect")
                .attr("x", coords.x)
                .attr("y", coords.y)
                .attr("width", coords.width)
                .attr("height", coords.height)
                .attr("fill", this.jurisdictionColors[jurisdiction])
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2)
                .attr("rx", 4)
                .style("opacity", 0.8)
                .style("transition", "all 0.3s ease");

            // Add jurisdiction label
            jurisdictionGroup.append("text")
                .attr("x", coords.x + coords.width / 2)
                .attr("y", coords.y + coords.height / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("font-weight", "bold")
                .style("font-size", `${Math.min(coords.width, coords.height) / 8}px`)
                .style("fill", "white")
                .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.7)")
                .style("pointer-events", "none")
                .text(jurisdiction);

            // Add value label if data exists
            if (jurisdictionData) {
                jurisdictionGroup.append("text")
                    .attr("x", coords.x + coords.width / 2)
                    .attr("y", coords.y + coords.height / 2 + 15)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", "10px")
                    .style("fill", "white")
                    .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.7)")
                    .style("pointer-events", "none")
                    .text(`${(fineCount / 1000).toFixed(0)}K`);
            }

            // Add interaction handlers
            jurisdictionGroup
                .on("mouseover", (event) => this.handleMouseOver(event, jurisdiction, jurisdictionData))
                .on("mouseout", () => this.handleMouseOut())
                .on("click", () => this.handleClick(jurisdiction, jurisdictionData));
        });

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#374151")
            .text("Australian Road Safety Enforcement by Jurisdiction (2023)");

        this.svg = svg;
        this.mapGroup = mapGroup;
        
        return svg.node();
    }

    handleMouseOver(event, jurisdiction, data) {
        // Highlight the jurisdiction
        d3.select(`.jurisdiction-${jurisdiction} rect`)
            .style("opacity", 1)
            .style("transform", "scale(1.05)")
            .style("filter", "drop-shadow(0 0 8px rgba(0,0,0,0.3))");

        // Show tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "insights-map-tooltip")
            .style("opacity", 0);

        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);

        const content = data ? `
            <strong>${jurisdiction}</strong><br/>
            Total Fines: ${data.total.toLocaleString()}<br/>
            Rank: #${data.rank || 'N/A'}<br/>
            Growth: ${data.growth ? data.growth.toFixed(1) + '%' : 'N/A'}
        ` : `
            <strong>${jurisdiction}</strong><br/>
            No data available
        `;

        tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    handleMouseOut() {
        // Remove highlight from all jurisdictions
        d3.selectAll(".jurisdiction rect")
            .style("opacity", 0.8)
            .style("transform", "scale(1)")
            .style("filter", "none");

        // Remove tooltip
        d3.selectAll(".insights-map-tooltip").remove();
    }

    handleClick(jurisdiction, data) {
        // Update selection
        this.selectedJurisdiction = jurisdiction;
        
        // Update visual selection
        d3.selectAll(".jurisdiction").classed("selected", false);
        d3.select(`.jurisdiction-${jurisdiction}`).classed("selected", true);
        
        // Update selected jurisdiction styling
        d3.selectAll(".jurisdiction rect")
            .style("stroke-width", 2);
            
        d3.select(`.jurisdiction-${jurisdiction} rect`)
            .style("stroke-width", 4)
            .style("stroke", "#fbbf24");

        // Call callback if provided
        if (this.onJurisdictionSelect) {
            this.onJurisdictionSelect(jurisdiction, data);
        }
    }

    updateData(newData) {
        const dataLookup = new Map(newData.map(d => [d.jurisdiction, d]));
        
        // Update jurisdiction fill colors and labels
        Object.keys(this.jurisdictionCoordinates).forEach(jurisdiction => {
            const jurisdictionData = dataLookup.get(jurisdiction);
            const group = d3.select(`.jurisdiction-${jurisdiction}`);
            
            if (jurisdictionData) {
                // Update value label
                group.select("text:last-child")
                    .text(`${(jurisdictionData.total / 1000).toFixed(0)}K`);
            }
        });
    }

    setJurisdictionSelectCallback(callback) {
        this.onJurisdictionSelect = callback;
    }

    selectJurisdiction(jurisdiction) {
        const data = null; // Would need to be passed or retrieved
        this.handleClick(jurisdiction, data);
    }

    // Method to create a more detailed SVG path-based map (for future enhancement)
    createDetailedMap(container, data, options = {}) {
        // This would contain actual SVG path data for Australian states
        // For now, using simplified rectangular representation
        return this.create(container, data, options);
    }

    // Responsive resize method
    resize(newWidth, newHeight) {
        if (!this.svg) return;
        
        this.svg
            .attr("width", newWidth)
            .attr("height", newHeight);

        // Recalculate scale and position
        const baseWidth = 600;
        const baseHeight = 500;
        const scaleX = newWidth / baseWidth;
        const scaleY = newHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        const offsetX = (newWidth - baseWidth * scale) / 2;
        const offsetY = (newHeight - baseHeight * scale) / 2;

        this.mapGroup.attr("transform", `translate(${offsetX}, ${offsetY}) scale(${scale})`);
        
        // Update title position
        this.svg.select("text")
            .attr("x", newWidth / 2);
    }
}

// Export for use in other modules
window.AustraliaMapVisualization = AustraliaMapVisualization;