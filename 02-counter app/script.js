"use strict";

const els = {
  count: document.getElementById("count"),
  hint: document.getElementById("hint"),
  inc: document.getElementById("incBtn"),
  dec: document.getElementById("decBtn"),
  reset: document.getElementById("resetBtn"),
};

let value = 0;
render();

els.inc.addEventListener("click", () => {
  value += 1;
  render();
});

els.dec.addEventListener("click", () => {
  value = Math.max(0, value - 1);
  render();
});

els.reset.addEventListener("click", () => {
  value = 0;
  render();
});

function render() {
  els.count.textContent = String(value);

  // UX: disable decrement at 0 (requirement: can't go below 0)
  els.dec.disabled = value === 0;

  // Message logic
  if (value === 0) {
    els.hint.textContent = "Click + to begin.";
  } else if (value < 10) {
    els.hint.textContent = "Keep going…";
  } else if (value === 10) {
    els.hint.textContent = "Nice! Double digits 🎉";
  } else {
    els.hint.textContent = "Now you’re cooking 🔥";
  }
}
