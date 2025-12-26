// Keys similar to Swift code
const STORAGE_KEY = "student_feedback_responses";
const SORT_KEY = "student_feedback_sort_mode";

// State
let responses = [];
let currentRating = 5;
let sortMode = "studentId";

// Elements
const studentIdInput = document.getElementById("studentIdInput");
const ratingStars = document.getElementById("ratingStars");
const submitBtn = document.getElementById("submitBtn");
const listContainer = document.getElementById("listContainer");
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");
const sortButtons = document.querySelectorAll(".segment-btn");

// ----- Initialize -----
init();

function init() {
  renderStars();
  loadState();
  applySortButtonState();
  renderList();
  bindEvents();
  updateDisabled();
}

// ----- Rendering -----
function renderStars() {
  ratingStars.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement("span");
    span.innerHTML = i <= currentRating ? "★" : "☆";
    span.style.color = i <= currentRating ? "gold" : "gray";
    span.addEventListener("click", () => {
      currentRating = i;
      renderStars();
    });
    ratingStars.appendChild(span);
  }
}

function renderList() {
  listContainer.innerHTML = "";

  const sorted = getSortedResponses();

  sorted.forEach((resp) => {
    const row = document.createElement("div");
    row.className = "row";

    const userDiv = document.createElement("div");
    userDiv.className = "user";
    userDiv.innerHTML = `
      <strong>${resp.studentId}</strong>
      <span class="date">${formatDate(resp.date)}</span>
    `;

    const starsDiv = document.createElement("div");
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement("span");
      s.innerHTML = i <= resp.rating ? "★" : "☆";
      s.style.color = i <= resp.rating ? "gold" : "gray";
      starsDiv.appendChild(s);
    }

    row.appendChild(userDiv);
    row.appendChild(starsDiv);
    listContainer.appendChild(row);
  });
}

// ----- Sorting -----
function getSortedResponses() {
  const data = [...responses];

  if (sortMode === "studentId") {
    data.sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true, sensitivity: "base" }));
  } else {
    data.sort((a, b) => {
      if (b.rating === a.rating) {
        return a.studentId.localeCompare(b.studentId, undefined, { numeric: true, sensitivity: "base" });
      }
      return b.rating - a.rating;
    });
  }
  return data;
}

function applySortButtonState() {
  sortButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sort === sortMode);
  });
}

// ----- Events -----
function bindEvents() {
  submitBtn.addEventListener("click", onSubmit);
  exportBtn.addEventListener("click", exportCSV);
  resetBtn.addEventListener("click", resetAll);

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sortMode = btn.dataset.sort;
      saveSortMode();
      applySortButtonState();
      renderList();
    });
  });

  studentIdInput.addEventListener("input", updateDisabled);
}

// ----- Actions -----
function onSubmit() {
  const trimmed = studentIdInput.value.trim();
  if (!trimmed) return;

  const existingIndex = responses.findIndex((r) => r.studentId === trimmed);

  if (existingIndex >= 0) {
    responses[existingIndex].rating = currentRating;
    responses[existingIndex].date = new Date().toISOString();
  } else {
    responses.push({
      id: crypto.randomUUID(),
      studentId: trimmed,
      rating: currentRating,
      date: new Date().toISOString()
    });
  }

  saveResponses();
  studentIdInput.value = "";
  currentRating = 5;
  renderStars();
  renderList();
  updateDisabled();

  alert("Rating saved.");
}

function resetAll() {
  if (!responses.length) return;

  const ok = confirm("Reset all saved data?");
  if (!ok) return;

  responses = [];
  saveResponses();
  renderList();
  updateDisabled();
  alert("All entries deleted.");
}

// ----- Persistence -----
function saveResponses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    responses = JSON.parse(saved);
  }

  const savedSort = localStorage.getItem(SORT_KEY);
  if (savedSort) {
    sortMode = savedSort;
  }
}

function saveSortMode() {
  localStorage.setItem(SORT_KEY, sortMode);
}

// ----- CSV Export -----
function exportCSV() {
  if (!responses.length) return;

  const sorted = getSortedResponses();

  let csv = "UserId,rating,date\n";

  sorted.forEach((r) => {
    csv += `${r.studentId},${r.rating},${toISOWithTimeZone(r.date)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Feedback.csv";
  a.click();

  URL.revokeObjectURL(url);
  alert("CSV saved successfully.");
}

// ----- Utilities -----
function updateDisabled() {
  submitBtn.disabled = !studentIdInput.value.trim();
  exportBtn.disabled = responses.length === 0;
  resetBtn.disabled = responses.length === 0;
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString();
}

// ISO8601 with current timezone offset
function toISOWithTimeZone(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hrs = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());

  const tzOffset = -d.getTimezoneOffset();
  const sign = tzOffset >= 0 ? "+" : "-";
  const offHrs = pad(Math.floor(Math.abs(tzOffset) / 60));
  const offMin = pad(Math.abs(tzOffset) % 60);

  return `${year}-${month}-${day}T${hrs}:${mins}:${secs}${sign}${offHrs}:${offMin}`;
}

