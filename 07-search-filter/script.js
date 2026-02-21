"use strict";

/**
 * Search & Filter demo
 * - Debounced input
 * - Role filter
 * - Highlight matching tokens
 */

const els = {
  q: document.getElementById("q"),
  role: document.getElementById("role"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),
  count: document.getElementById("count"),
};

// Fake dataset (120 rows)
const roles = ["Engineer", "Designer", "Marketer", "Ops"];
const cities = ["Miami", "Austin", "New York", "San Jose", "Denver", "Seattle", "Orlando", "Chicago", "Boston", "Dallas"];
const first = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Avery", "Cameron", "Drew"];
const last = ["Nguyen", "Smith", "Garcia", "Kim", "Brown", "Lopez", "Patel", "Johnson", "Martinez", "Lee"];

const data = Array.from({ length: 120 }, (_, i) => {
  const f = first[i % first.length];
  const l = last[(i * 3) % last.length];
  const role = roles[(i * 7) % roles.length];
  const city = cities[(i * 5) % cities.length];
  return {
    id: String(i + 1),
    name: `${f} ${l}`,
    role,
    city,
    email: `${f.toLowerCase()}.${l.toLowerCase()}${i}@example.com`,
  };
});

let state = {
  query: "",
  role: "all",
};

const applyDebounced = debounce(applyFilters, 300);

els.q.addEventListener("input", () => {
  state.query = els.q.value.trim();
  applyDebounced();
});

els.role.addEventListener("change", () => {
  state.role = els.role.value;
  applyFilters(); // role change can be immediate
});

renderList(data, "");

function applyFilters() {
  const q = state.query.toLowerCase();
  const role = state.role;

  const tokens = q.split(/\s+/).filter(Boolean);

  let filtered = data;

  if (role !== "all") {
    filtered = filtered.filter((x) => x.role === role);
  }

  if (tokens.length > 0) {
    filtered = filtered.filter((x) => {
      const hay = `${x.name} ${x.role} ${x.city} ${x.email}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }

  els.count.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  renderList(filtered, q);
}

function renderList(items, q) {
  els.list.innerHTML = "";

  if (items.length === 0) {
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  for (const x of items) {
    const li = document.createElement("li");
    li.className = "item";

    li.innerHTML = `
      <div class="top">
        <div class="name"></div>
        <div class="meta"></div>
      </div>
      <div class="meta email"></div>
    `;

    li.querySelector(".name").innerHTML = highlight(x.name, tokens);
    li.querySelector(".top .meta").innerHTML = highlight(`${x.role} • ${x.city}`, tokens);
    li.querySelector(".email").innerHTML = highlight(x.email, tokens);

    els.list.appendChild(li);
  }
}

function highlight(text, tokens) {
  if (!tokens || tokens.length === 0) return escapeHtml(text);

  // Highlight all tokens (case-insensitive)
  let safe = escapeHtml(text);
  for (const t of tokens) {
    if (!t) continue;
    const re = new RegExp(escapeRegExp(t), "ig");
    safe = safe.replace(re, (m) => `<span class="hl">${m}</span>`);
  }
  return safe;
}

function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}