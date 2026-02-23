"use strict";

const tablist = document.querySelector(".tabs");
const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = new Map(
  tabs.map((t) => [t.id, document.getElementById(t.getAttribute("aria-controls"))])
);

tablist.addEventListener("click", (e) => {
  const tab = e.target.closest("[role='tab']");
  if (!tab) return;
  activateTab(tab, true);
});

tablist.addEventListener("keydown", (e) => {
  const current = document.activeElement.closest("[role='tab']");
  if (!current) return;

  const i = tabs.indexOf(current);
  if (i === -1) return;

  let nextIndex = null;

  if (e.key === "ArrowLeft") nextIndex = (i - 1 + tabs.length) % tabs.length;
  if (e.key === "ArrowRight") nextIndex = (i + 1) % tabs.length;
  if (e.key === "Home") nextIndex = 0;
  if (e.key === "End") nextIndex = tabs.length - 1;

  if (nextIndex === null) return;

  e.preventDefault();
  activateTab(tabs[nextIndex], true);
});

function activateTab(tab, focus = false) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    t.tabIndex = selected ? 0 : -1;

    const panel = document.getElementById(t.getAttribute("aria-controls"));
    if (panel) panel.hidden = !selected;
  });

  if (focus) tab.focus();
}