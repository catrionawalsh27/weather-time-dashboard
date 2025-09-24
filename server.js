import express from "express";
import { DateTime } from "luxon";

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public folder
app.use(express.static("public"));

// Define city metadata including location and time zone
const CITIES = [
  {
    id: "manchester",
    name: "Manchester",
    country: "UK",
    lat: 53.4808,
    lon: -2.2426,
    tz: "Europe/London"
  },
  {
    id: "perth",
    name: "Perth",
    country: "Australia",
    lat: -31.9523,
    lon: 115.8613,
    tz: "Australia/Perth"
  },
  {
    id: "adelaide",
    name: "Adelaide",
    country: "Australia",
    lat: -34.9285,
    lon: 138.6007,
    tz: "Australia/Adelaide"
  }
];

/**
 * Fetch current weather for a given latitude and longitude using Open-Meteo.
 * Open-Meteo doesn’t require an API key and returns current weather data.
 *
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise<Object|null>} Current weather data or null on failure
 */
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data?.current_weather ?? null;
}

/**
 * Route to get city data including local time/date and current weather.
 * It iterates over each city, fetching weather and computing local time.
 */
app.get("/api/cities", async (req, res) => {
  try {
    const results = await Promise.all(
      CITIES.map(async (city) => {
        let weather = null;
        try {
          weather = await fetchWeather(city.lat, city.lon);
        } catch (e) {
          // Swallow weather errors; weather will be null
          weather = null;
        }

        const nowLocal = DateTime.now().setZone(city.tz);
        return {
          id: city.id,
          name: city.name,
          country: city.country,
          timezone: city.tz,
          localTime: nowLocal.toFormat("HH:mm:ss"),
          localDate: nowLocal.toFormat("cccc, d LLLL yyyy"),
          weather: weather
            ? {
                temperatureC: weather.temperature,
                windspeedKmh: weather.windspeed,
                windDirectionDeg: weather.winddirection,
                weatherCode: weather.weathercode,
                observedAtLocal: DateTime.fromISO(weather.time, { zone: "UTC" })
                  .setZone(city.tz)
                  .toFormat("HH:mm"),
              }
            : null,
        };
      })
    );
    res.json({
      updatedAtUTC: DateTime.utc().toISO(),
      cities: results,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Basic health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
