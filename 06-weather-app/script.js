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
  let q = (query || "").trim().replace(/\s+/g, " ");
  q = q.replace(/^['"]+|['"]+$/g, "");

  // Parse "City, State/Country" style input
  const parts = q.split(",").map(s => s.trim()).filter(Boolean);
  const city = parts[0] || q;
  const qualifiers = parts.slice(1); // e.g. ["Florida"] or ["California"] or ["Texas"]

  // 1) Try full query first
  let results = await geocodeRequest(q);

  // 2) If that fails, fall back to city-only search
  if (results.length === 0) {
    results = await geocodeRequest(city);
    if (results.length === 0) {
      throw new Error(`No results for "${q}". Try just the city name or separete them with ( , )`);
    }
  }

  // 3) Score candidates using qualifiers + city tokens
  const tokens = [
    ...city.toLowerCase().split(/\s+/).filter(Boolean),
    ...qualifiers.flatMap(x => x.toLowerCase().split(/\s+/).filter(Boolean)),
  ];

  // Expand common US state abbreviations to full names (helps "Miami, FL", "Paris, TX", "San Jose, CA")
  const US_STATES = {
    AL:"alabama", AK:"alaska", AZ:"arizona", AR:"arkansas", CA:"california", CO:"colorado", CT:"connecticut",
    DE:"delaware", FL:"florida", GA:"georgia", HI:"hawaii", ID:"idaho", IL:"illinois", IN:"indiana",
    IA:"iowa", KS:"kansas", KY:"kentucky", LA:"louisiana", ME:"maine", MD:"maryland", MA:"massachusetts",
    MI:"michigan", MN:"minnesota", MS:"mississippi", MO:"missouri", MT:"montana", NE:"nebraska", NV:"nevada",
    NH:"new hampshire", NJ:"new jersey", NM:"new mexico", NY:"new york", NC:"north carolina", ND:"north dakota",
    OH:"ohio", OK:"oklahoma", OR:"oregon", PA:"pennsylvania", RI:"rhode island", SC:"south carolina",
    SD:"south dakota", TN:"tennessee", TX:"texas", UT:"utah", VT:"vermont", VA:"virginia", WA:"washington",
    WV:"west virginia", WI:"wisconsin", WY:"wyoming"
  };

  const expandedTokens = [];
  for (const t of tokens) {
    expandedTokens.push(t);
    const up = t.toUpperCase();
    if (US_STATES[up]) expandedTokens.push(US_STATES[up]);
    if (t === "usa" || t === "us" || t === "united" || t === "states") {
      expandedTokens.push("united");
      expandedTokens.push("states");
      expandedTokens.push("united states");
      expandedTokens.push("usa");
      expandedTokens.push("us");
    }
  }

  const scored = results.map((r) => {
    const hay = [
      r.name,
      r.admin1,
      r.admin2,
      r.admin3,
      r.country,
      r.country_code
    ].filter(Boolean).join(" ").toLowerCase();

    let score = 0;

    // Strongly prefer city name match
    if ((r.name || "").toLowerCase() === city.toLowerCase()) score += 10;

    // Qualifier matches (state/country) matter a lot
    for (const t of expandedTokens) {
      if (t.length < 2) continue;
      if (hay.includes(t)) score += 3;
    }

    // Prefer higher population if available
    if (typeof r.population === "number") {
      score += Math.min(5, Math.log10(r.population + 1));
    }

    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].r;

  return {
    name: best.name,
    country: best.country,
    admin1: best.admin1,
    lat: best.latitude,
    lon: best.longitude,
    timezone: best.timezone || "auto",
  };
}

async function geocodeRequest(name) {
  const url = new URL(GEO_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Geocoding request failed.");
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

async function fetchWeather(place) {
  setLoading(true, "Fetching weather…");
  try {
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

    render({
      placeLabel: formatPlace(place),
      temp: cur.temperature_2m,
      tempUnit: useC ? "°C" : "°F",
      wind: cur.wind_speed_10m,
      windUnit: "mph",
      codeLabel: codeToLabel(cur.weather_code),
      time: cur.time,
    });
  } catch (err) {
    showError(err?.message || "Couldn’t load weather.");
  } finally {
    setLoading(false);
  }
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
