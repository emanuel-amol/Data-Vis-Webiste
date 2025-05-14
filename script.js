document.addEventListener("DOMContentLoaded", () => {
  // RESET functionality
  document.getElementById("reset").addEventListener("click", () => {
    // Uncheck all checkboxes
    document.querySelectorAll("#checkbox-list input[type='checkbox']").forEach(cb => {
      cb.checked = false;
    });

    // Re-check "All"
    document.querySelector("#checkbox-list input[value='All']").checked = true;

    // Reset year and detection selects
    document.getElementById("year").selectedIndex = 0;
    document.getElementById("detection").selectedIndex = 0;

    // Update selection display
    updateSelection();
  });

  // Close dropdown if clicked outside
  document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("jurisdiction-dropdown");
    const list = document.getElementById("checkbox-list");

    if (!dropdown.contains(event.target)) {
      list.style.display = "none";
    }
  });
});

// Toggle the visibility of the checkbox dropdown
function toggleDropdown() {
  const list = document.getElementById("checkbox-list");
  list.style.display = list.style.display === "block" ? "none" : "block";
}

// Handle the "All" checkbox logic
function toggleAll(checkbox) {
  const checkboxes = document.querySelectorAll("#checkbox-list input[type='checkbox']");
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
  });
  updateSelection();
}

// Update the display of selected values
function updateSelection() {
  const selected = [];
  const checkboxes = document.querySelectorAll("#checkbox-list input[type='checkbox']:not([value='All'])");
  const allBox = document.querySelector("#checkbox-list input[value='All']");
  let allChecked = true;

  checkboxes.forEach(cb => {
    if (cb.checked) {
      selected.push(cb.value);
    } else {
      allChecked = false;
    }
  });

  // Toggle "All" box state based on individual selections
  allBox.checked = allChecked;

  // Update selected output text
  const output = document.getElementById("selected-output");
  output.textContent = "Selected: " + (selected.length ? selected.join(", ") : "None");
}

