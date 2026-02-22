"use strict";

/**
 * Theme strategy:
 * 1) If user saved a theme in localStorage, use it.
 * 2) Otherwise use system preference (prefers-color-scheme).
 * 3) Persist any user changes.
 */

const STORAGE_KEY = "theme_preference"; // "light" | "dark"

const toggle = document.getElementById("themeToggle");
const statusText = document.getElementById("statusText");

const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const saved = localStorage.getItem(STORAGE_KEY);
const initialTheme = saved || (systemPrefersDark ? "dark" : "light");

applyTheme(initialTheme);
toggle.checked = initialTheme === "dark";
renderStatus(initialTheme);

toggle.addEventListener("change", () => {
  const next = toggle.checked ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
  renderStatus(next);
});

function applyTheme(theme) {
  // store theme in a data attribute so CSS can react
  document.documentElement.setAttribute("data-theme", theme);
}

function renderStatus(theme) {
  const source = localStorage.getItem(STORAGE_KEY) ? "Saved preference" : "System preference";
  statusText.textContent = `${source}: ${theme}`;
}