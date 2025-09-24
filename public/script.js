const cardsEl = document.getElementById("cards");
const lastUpdatedEl = document.getElementById("last-updated");

const WMO_WEATHER = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Light freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ light hail",
  99: "Thunderstorm w/ heavy hail"
};

function weatherLabel(code) {
  if (code == null) return "—";
  return WMO_WEATHER[code] ?? `Code ${code}`;
}

function windDir(deg) {
  if (deg == null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

function render(cities, updatedAtUTC) {
  lastUpdatedEl.textContent = `Updated: ${new Date(updatedAtUTC).toLocaleString()} (UTC)`;
  cardsEl.innerHTML = "";

  cities.forEach(city => {
    const c = city.weather;
    const temp = c?.temperatureC != null ? `${Math.round(c.temperatureC)}°C` : "—";
    const ws = c?.windspeedKmh != null ? `${Math.round(c.windspeedKmh)} km/h ${windDir(c.windDirectionDeg)}` : "—";
    const cond = weatherLabel(c?.weatherCode);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h2>${city.name}</h2>
      <div class="sub">${city.country} • <span class="badge">${city.timezone}</span></div>

      <div class="row">
        <div class="k">Local time</div>
        <div class="v">${city.localTime}</div>
      </div>
      <div class="row">
        <div class="k">Local date</div>
        <div class="v">${city.localDate}</div>
      </div>

      <div class="row">
        <div class="k">Temperature</div>
        <div class="v">${temp}</div>
      </div>
      <div class="row">
        <div class="k">Conditions</div>
        <div class="v">${cond}</div>
      </div>
      <div class="row">
        <div class="k">Wind</div>
        <div class="v">${ws}</div>
      </div>
      <div class="row">
        <div class="k">Weather time (local)</div>
        <div class="v">${c?.observedAtLocal ?? "—"}</div>
      </div>
    `;
    cardsEl.appendChild(card);
  });
}

async function load() {
  try {
    const res = await fetch("/api/cities");
    const data = await res.json();
    render(data.cities, data.updatedAtUTC);
  } catch (e) {
    lastUpdatedEl.textContent = "Failed to load data. Check server logs.";
  }
}

load();
setInterval(load, 60_000);
