"use strict";

/**
 * Todo v1 (LocalStorage)
 * Features:
 * - Add
 * - Toggle complete
 * - Delete
 * - Clear completed
 * - Persist with localStorage
 */

const STORAGE_KEY = "todo_v1_items";

const els = {
  form: document.getElementById("todoForm"),
  input: document.getElementById("todoInput"),
  list: document.getElementById("todoList"),
  count: document.getElementById("countText"),
  clearCompleted: document.getElementById("clearCompletedBtn"),
};

let items = loadItems();
render();

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = (els.input.value || "").trim();
  if (!text) return;

  items.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text,
    done: false,
    createdAt: Date.now(),
  });

  els.input.value = "";
  saveItems(items);
  render();
});

els.clearCompleted.addEventListener("click", () => {
  items = items.filter((t) => !t.done);
  saveItems(items);
  render();
});

// Event delegation for toggle/delete
els.list.addEventListener("click", (e) => {
  const row = e.target.closest("li[data-id]");
  if (!row) return;

  const id = row.dataset.id;

  // Delete
  if (e.target.closest("[data-action='delete']")) {
    items = items.filter((t) => t.id !== id);
    saveItems(items);
    render();
    return;
  }

  // Toggle when clicking checkbox or label/text area
  if (e.target.matches("input[type='checkbox']") || e.target.closest("label")) {
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) return;
    items[idx].done = !items[idx].done;
    saveItems(items);
    render();
  }
});

function render() {
  els.list.innerHTML = "";

  for (const t of items) {
    const li = document.createElement("li");
    li.className = "item" + (t.done ? " done" : "");
    li.dataset.id = t.id;

    li.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""} aria-label="Mark complete" />
      <label>
        <span class="text"></span>
      </label>
      <button class="icon-btn" data-action="delete" aria-label="Delete task">✕</button>
    `;

    li.querySelector(".text").textContent = t.text;

    els.list.appendChild(li);
  }

  const total = items.length;
  const done = items.filter((t) => t.done).length;
  els.count.textContent = `${total} item${total === 1 ? "" : "s"} • ${done} done`;

  els.clearCompleted.disabled = done === 0;
  els.clearCompleted.style.opacity = done === 0 ? "0.5" : "1";
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string" && typeof x.text === "string")
      .map((x) => ({ id: x.id, text: x.text, done: !!x.done, createdAt: x.createdAt || 0 }));
  } catch {
    return [];
  }
}

function saveItems(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
