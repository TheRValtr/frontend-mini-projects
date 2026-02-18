"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openModalBtn");
  const backdrop = document.getElementById("backdrop");
  const modal = document.getElementById("modal");
  const closeBtn = document.getElementById("closeModalBtn");
  const primaryBtn = document.getElementById("primaryBtn");
  const secondaryBtn = document.getElementById("secondaryBtn");

  if (!openBtn || !backdrop || !modal || !closeBtn || !primaryBtn || !secondaryBtn) {
    // If this happens, one of your IDs doesn't match the HTML.
    console.error("Modal setup failed: missing element(s). Check IDs in HTML.");
    return;
  }

  let lastFocused = null;

  function isOpen() {
    return backdrop.hidden === false;
  }

  function getFocusable(root) {
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ];
    return Array.from(root.querySelectorAll(selectors.join(",")));
  }

  function openModal() {
    lastFocused = document.activeElement;

    backdrop.hidden = false;

    // Focus the first focusable element inside the modal (close button usually)
    const focusable = getFocusable(modal);
    (focusable[0] || modal).focus();
  }

  function closeModal() {
    backdrop.hidden = true;

    // Return focus to opener safely
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    } else {
      openBtn.focus();
    }
  }

  // Open
  openBtn.addEventListener("click", openModal);

  // Close buttons
  closeBtn.addEventListener("click", closeModal);
  secondaryBtn.addEventListener("click", closeModal);

  // Confirm example
  primaryBtn.addEventListener("click", () => {
    alert("Confirmed!");
    closeModal();
  });

  // Backdrop click: close ONLY when clicking outside the modal box
  backdrop.addEventListener("mousedown", (e) => {
    const clickedInsideModal = e.target.closest("#modal");
    if (!clickedInsideModal) closeModal();
  });

  // Esc to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeModal();
  });
});
