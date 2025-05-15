// Keep existing code from provided script.js

// Additional functions for the new pages
document.addEventListener("DOMContentLoaded", () => {
  // Original filter functionality (from provided script.js)
  
  // Add this new code for the tabbed interface in the visualization pages
  const tabs = document.querySelectorAll('.viz-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach(content => {
          content.style.display = 'none';
        });
        
        // Show selected tab content
        const contentId = tab.getAttribute('data-tab');
        document.getElementById(contentId).style.display = 'block';
      });
    });
    
    // Activate first tab by default
    tabs[0].click();
  }
  
  // Tooltip functionality
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', (e) => {
      const tooltipText = e.target.getAttribute('data-tooltip');
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = tooltipText;
      
      // Position tooltip
      document.body.appendChild(tooltip);
      const rect = e.target.getBoundingClientRect();
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10 + window.scrollY}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + window.scrollX}px`;
      
      // Store tooltip reference
      e.target.tooltip = tooltip;
    });
    
    element.addEventListener('mouseleave', (e) => {
      if (e.target.tooltip) {
        e.target.tooltip.remove();
        e.target.tooltip = null;
      }
    });
  });
});