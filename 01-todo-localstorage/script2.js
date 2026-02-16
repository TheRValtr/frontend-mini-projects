const STORAGE_KEY = "todo_v1_items";

(function initTodoApp() {
    // Helpers
    const uid = () =>
        (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    const safeParse = (s, fallback) => {
        try { return JSON.parse(s); } catch { return fallback; }
    };
    let saveTimer = null;
    const debouncedSave = (items) => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveItems(items), 150);
    };

    // Elements
    const els = {
        form: document.getElementById("todoForm"),
        input: document.getElementById("todoInput"),
        list: document.getElementById("todoList"),
        count: document.getElementById("countText"),
        clearCompleted: document.getElementById("clearCompletedBtn"),
    };
    if (!els.form || !els.input || !els.list || !els.count || !els.clearCompleted) return;

    // State
    let items = loadItems();
    render();

    // Events
    els.form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = (els.input.value || "").trim();
        if (!text) return;
        items.unshift({ id: uid(), text, done: false, createdAt: Date.now() });
        els.input.value = "";
        debouncedSave(items);
        render();
    });

    els.clearCompleted.addEventListener("click", () => {
        items = items.filter((t) => !t.done);
        saveItems(items);
        render();
    });

    els.list.addEventListener("click", (e) => {
        const row = e.target.closest("li[data-id]");
        if (!row) return;
        const id = row.dataset.id;

        if (e.target.closest("[data-action='delete']")) {
            items = items.filter((t) => t.id !== id);
            saveItems(items);
            render();
            return;
        }

        if (e.target.matches("input[type='checkbox']") || e.target.closest("label")) {
            const idx = items.findIndex((t) => t.id === id);
            if (idx === -1) return;
            items[idx].done = !items[idx].done;
            debouncedSave(items);
            render();
        }
    });

    // Render and DOM helpers
    function createItemElement(t) {
        const li = document.createElement("li");
        li.className = "item";
        if (t.done) li.classList.add("done");
        li.dataset.id = t.id;

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!t.done;
        cb.setAttribute("aria-label", "Mark complete");

        const label = document.createElement("label");
        const span = document.createElement("span");
        span.className = "text";
        span.textContent = t.text;
        label.appendChild(span);

        const btn = document.createElement("button");
        btn.className = "icon-btn";
        btn.dataset.action = "delete";
        btn.setAttribute("aria-label", "Delete task");
        btn.textContent = "✕";

        li.appendChild(cb);
        li.appendChild(label);
        li.appendChild(btn);
        return li;
    }

    function render() {
        els.list.innerHTML = "";
        const frag = document.createDocumentFragment();
        for (const t of items) frag.appendChild(createItemElement(t));
        els.list.appendChild(frag);

        const total = items.length;
        const done = items.filter((t) => t.done).length;
        els.count.textContent = `${total} item${total === 1 ? "" : "s"} • ${done} done`;

        els.clearCompleted.disabled = done === 0;
        els.clearCompleted.style.opacity = done === 0 ? "0.5" : "1";
    }

    // Persistence
    function loadItems() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = safeParse(raw, []);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((x) => x && typeof x.id === "string" && typeof x.text === "string")
                .map((x) => ({ id: x.id, text: x.text, done: !!x.done, createdAt: x.createdAt || 0 }));
        } catch {
            return [];
        }
    }

    function saveItems(next) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
            // storage full or disabled -- could show a UI warning
            console.error("Failed to save items:", err);
        }
    }
})();