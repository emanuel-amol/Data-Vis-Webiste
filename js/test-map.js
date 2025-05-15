// Save this as js/test-map.js
document.addEventListener('DOMContentLoaded', function() {
  console.log("D3 test script running");
  console.log("D3 version:", d3.version);
  
  // Create a simple test SVG
  d3.select('#jurisdiction-map')
    .append('svg')
    .attr('width', 300)
    .attr('height', 200)
    .append('rect')
    .attr('width', 100)
    .attr('height', 100)
    .attr('fill', 'blue');
});