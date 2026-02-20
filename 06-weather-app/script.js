"use strict";

// Open-Meteo endpoints (no key needed)
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WX_URL = "https://api.open-meteo.com/v1/forecast";

const els = {
  form: document.getElementById("form"),
  q: document.getElementById("q"),
  panel: document.getElementById("panel"),
  btn: document.getElementById("searchBtn"),
  unitToggle: document.getElementById("unitToggle"),
};

let lastQuery = "";
let lastPlace = null; // { name, country, admin1, lat, lon }

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = (els.q.value || "").trim();
  if (!query) return;

  lastQuery = query;
  await runSearch(query);
});

els.unitToggle.addEventListener("change", async () => {
  // If we already have a place, refetch with new units.
  if (lastPlace) await fetchWeather(lastPlace);
});

async function runSearch(query) {
  setLoading(true, "Searching location…");
  try {
    const place = await geocode(query);
    lastPlace = place;
    await fetchWeather(place);
  } catch (err) {
    showError(err?.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

async function geocode(query) {
  const url = new URL(GEO_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Geocoding request failed.");
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No results for "${query}". Try adding country/state.`);
  }

  const r = data.results[0];
  return {
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone || "auto",
  };
}

async function fetchWeather(place) {
  setLoading(true, "Fetching weather…");
  hideError();

  const useC = els.unitToggle.checked;

  const url = new URL(WX_URL);
  url.searchParams.set("latitude", String(place.lat));
  url.searchParams.set("longitude", String(place.lon));
  url.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");
  url.searchParams.set("timezone", "auto");
  // Units
  url.searchParams.set("temperature_unit", useC ? "celsius" : "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Weather request failed.");
  const data = await res.json();

  if (!data.current) throw new Error("Weather data missing.");
  const cur = data.current;

  const label = codeToLabel(cur.weather_code);

  render({
    placeLabel: formatPlace(place),
    temp: cur.temperature_2m,
    tempUnit: useC ? "°C" : "°F",
    wind: cur.wind_speed_10m,
    windUnit: "mph",
    codeLabel: label,
    time: cur.time,
  });
}

function render(model) {
  els.panel.innerHTML = `
    <div class="row">
      <div>
        <div class="badge">${escapeHtml(model.placeLabel)}</div>
        <div class="big">${Math.round(model.temp)}${model.tempUnit}</div>
        <div class="kv">
          <div>Condition: <strong>${escapeHtml(model.codeLabel)}</strong></div>
          <div>Wind: <strong>${Math.round(model.wind)} ${model.windUnit}</strong></div>
          <div>Updated: <strong>${escapeHtml(model.time)}</strong></div>
        </div>
      </div>
    </div>
  `;
}

function setLoading(isLoading, text = "Loading…") {
  els.btn.disabled = isLoading;
  els.q.disabled = isLoading;

  if (isLoading) {
    els.panel.innerHTML = `<p class="muted">${escapeHtml(text)}</p>`;
  }
}

function showError(msg) {
  els.panel.innerHTML = `
    <div class="errorBox">
      <strong>Couldn’t load weather.</strong>
      <div style="margin-top:6px">${escapeHtml(msg)}</div>
      <div style="margin-top:10px">
        <button type="button" id="retryBtn">Retry</button>
      </div>
    </div>
  `;

  const retry = document.getElementById("retryBtn");
  retry?.addEventListener("click", () => {
    if (lastQuery) runSearch(lastQuery);
  });
}

function hideError() {
  // no-op because we re-render panel anyway
}

function formatPlace(p) {
  const parts = [p.name];
  if (p.admin1) parts.push(p.admin1);
  if (p.country) parts.push(p.country);
  return parts.join(", ");
}

// Open-Meteo weather codes → simple labels
function codeToLabel(code) {
  const map = new Map([
    [0, "Clear sky"],
    [1, "Mainly clear"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [48, "Depositing rime fog"],
    [51, "Light drizzle"],
    [53, "Moderate drizzle"],
    [55, "Dense drizzle"],
    [61, "Slight rain"],
    [63, "Moderate rain"],
    [65, "Heavy rain"],
    [71, "Slight snow"],
    [73, "Moderate snow"],
    [75, "Heavy snow"],
    [80, "Rain showers"],
    [81, "Moderate rain showers"],
    [82, "Violent rain showers"],
    [95, "Thunderstorm"],
  ]);
  return map.get(code) ?? `Weather code ${code}`;
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
