"use strict";

const API = "https://jsonplaceholder.typicode.com/posts";

const els = {
  q: document.getElementById("q"),
  meta: document.getElementById("meta"),
  list: document.getElementById("list"),
  status: document.getElementById("status"),
  sentinel: document.getElementById("sentinel"),
};

let page = 0;
const LIMIT = 10;
let isLoading = false;
let isDone = false;

let allLoaded = [];     // store loaded items for filtering
let filterQ = "";

const observer = new IntersectionObserver((entries) => {
  const first = entries[0];
  if (first.isIntersecting) loadNextPage();
}, { rootMargin: "400px" });

observer.observe(els.sentinel);

els.q.addEventListener("input", debounce(() => {
  filterQ = els.q.value.trim().toLowerCase();
  renderFiltered();
}, 250));

// initial load
loadNextPage();

async function loadNextPage() {
  if (isLoading || isDone) return;

  isLoading = true;
  setStatusLoading();

  try {
    page += 1;

    const url = new URL(API);
    url.searchParams.set("_page", String(page));
    url.searchParams.set("_limit", String(LIMIT));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Request failed.");

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      isDone = true;
      setStatusDone();
      return;
    }

    allLoaded = allLoaded.concat(items);
    renderFiltered();

    setStatusIdle();
  } catch (err) {
    page -= 1; // roll back since this page didn't load
    setStatusError(err?.message || "Could not load data.");
  } finally {
    isLoading = false;
    updateMeta();
  }
}

function renderFiltered() {
  const q = filterQ;

  const items = q
    ? allLoaded.filter((p) => (`${p.title} ${p.body}`).toLowerCase().includes(q))
    : allLoaded;

  els.list.innerHTML = "";
  for (const p of items) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <h3 class="title">${escapeHtml(p.title)}</h3>
      <p class="body">${escapeHtml(p.body)}</p>
    `;
    els.list.appendChild(li);
  }

  // If filtering shows nothing, give feedback (but don’t mark done)
  if (items.length === 0) {
    els.status.innerHTML = `<div class="meta">No matches for "${escapeHtml(filterQ)}".</div>`;
  }
}

function updateMeta() {
  els.meta.textContent = `${allLoaded.length} loaded`;
}

function setStatusLoading() {
  els.status.innerHTML = `
    <div class="spinner">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span>Loading…</span>
    </div>
  `;
}

function setStatusIdle() {
  // Keep it minimal when idle
  if (!isDone) els.status.innerHTML = `<div class="meta">Scroll to load more…</div>`;
}

function setStatusDone() {
  els.status.innerHTML = `<div class="meta">All posts loaded ✅</div>`;
}

function setStatusError(msg) {
  els.status.innerHTML = `
    <div class="errorBox">
      <strong>Couldn’t load more posts.</strong>
      <div style="margin-top:6px">${escapeHtml(msg)}</div>
      <button id="retryBtn" type="button" style="margin-top:10px">Retry</button>
    </div>
  `;
  document.getElementById("retryBtn")?.addEventListener("click", loadNextPage);
}

function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
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