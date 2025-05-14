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

  // Close dropdowns if clicked outside
  document.addEventListener("click", function (event) {
    const jurisdictionDropdown = document.getElementById("jurisdiction-dropdown");
    const jurisdictionList = document.getElementById("checkbox-list");
    const yearDropdown = document.getElementById("year-dropdown");
    const yearList = document.getElementById("year-checkbox-list");
    const detectionDropdown = document.getElementById("detection-dropdown");
    const detectionList = document.getElementById("detection-checkbox-list");

    // Close jurisdiction dropdown
    if (!jurisdictionDropdown.contains(event.target)) {
      jurisdictionList.style.display = "none";
    }

    // Close year dropdown
    if (!yearDropdown.contains(event.target)) {
      yearList.style.display = "none";
    }

    // Close detection dropdown
    if (!detectionDropdown.contains(event.target)) {
      detectionList.style.display = "none";
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

// Toggle the visibility of the year checkbox dropdown
function toggleYearDropdown() {
    const list = document.getElementById("year-checkbox-list");
    list.style.display = list.style.display === "block" ? "none" : "block";
}

// Handle the "All" checkbox logic for years
function toggleAllYears(checkbox) {
    const checkboxes = document.querySelectorAll("#year-checkbox-list input[type='checkbox']");
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateYearSelection();
}

// Update the display of selected years
function updateYearSelection() {
    const selected = [];
    const checkboxes = document.querySelectorAll("#year-checkbox-list input[type='checkbox']:not([value='All'])");
    const allBox = document.querySelector("#year-checkbox-list input[value='All']");
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
    const output = document.getElementById("year-selected-output");
    output.textContent = "Selected: " + (selected.length ? selected.join(", ") : "None");
}

// Toggle the visibility of the detection method checkbox dropdown
function toggleDetectionDropdown() {
    const list = document.getElementById("detection-checkbox-list");
    list.style.display = list.style.display === "block" ? "none" : "block";
}

// Handle the "All" checkbox logic for detection methods
function toggleAllDetection(checkbox) {
    const checkboxes = document.querySelectorAll("#detection-checkbox-list input[type='checkbox']");
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateDetectionSelection();
}

// Update the display of selected detection methods
function updateDetectionSelection() {
    const selected = [];
    const checkboxes = document.querySelectorAll("#detection-checkbox-list input[type='checkbox']:not([value='All'])");
    const allBox = document.querySelector("#detection-checkbox-list input[value='All']");
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
    const output = document.getElementById("detection-selected-output");
    output.textContent = "Selected: " + (selected.length ? selected.join(", ") : "None");
}

