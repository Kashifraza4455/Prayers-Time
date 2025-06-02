import React, { useState } from "react";
import axios from "axios";
import { DateTime } from "luxon";

export default function App() {
  const [city, setCity] = useState("");
  const [searchedCity, setSearchedCity] = useState("");
  const [cityTimes, setCityTimes] = useState(null);
  const [pakistanFajrTime, setPakistanFajrTime] = useState(null);
  const [cityTimezone, setCityTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPrayerTimes = async (cityName) => {
    try {
      const res = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity?city=${cityName}&country=&method=2`
      );
      return res.data.data;
    } catch {
      return null;
    }
  };

  const fetchTimes = async () => {
    if (!city) return;
    setLoading(true);
    setError("");
    setCityTimes(null);
    setPakistanFajrTime(null);

    const data = await fetchPrayerTimes(city);
    if (!data) {
      setError("City not found. Please check the spelling or try another city.");
      setLoading(false);
      return;
    }

    setCityTimes(data.timings);
    setCityTimezone(data.meta.timezone);
    setSearchedCity(city);

    // Parse the date string from API (like "02 Jun 2025")
    const dateStr = data.date.readable; // e.g. "02 Jun 2025"

    // Parse Fajr time string (like "03:50")
    const fajrTimeStr = data.timings.Fajr;

    // Combine date and time in city timezone using Luxon
    const fajrDateTimeInCity = DateTime.fromFormat(
      `${dateStr} ${fajrTimeStr}`,
      "dd LLL yyyy HH:mm",
      { zone: data.meta.timezone }
    );

    if (!fajrDateTimeInCity.isValid) {
      setError("Invalid fajr date/time from API.");
      setLoading(false);
      return;
    }

    // Convert fajr time from city timezone to Pakistan timezone
    const fajrInPakistan = fajrDateTimeInCity.setZone("Asia/Karachi");

    setPakistanFajrTime(fajrInPakistan);
    setLoading(false);
  };

  const formatTime12 = (dateTime) => {
    if (!dateTime) return "";
    return dateTime.toLocaleString(DateTime.TIME_SIMPLE);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 text-blue-900 drop-shadow-lg text-center">
        🕌 Prayer Times Finder
      </h1>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl mb-6">
        <input
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && city) fetchTimes();
          }}
          className="w-full px-5 py-3 rounded-lg border border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-600 text-gray-900 placeholder-gray-400 shadow-sm transition duration-300"
        />

        <button
          onClick={fetchTimes}
          disabled={!city || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300"
        >
          {loading ? "Searching..." : "Get Times"}
        </button>
      </div>

      {error && (
        <p className="text-red-600 mt-4 font-medium text-center max-w-xl">{error}</p>
      )}

      {cityTimes && (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8 mt-8 w-full max-w-5xl">
          {/* Left side - Prayer times */}
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full sm:w-[48%]">
            <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
              🕌 {searchedCity} Prayer Times
            </h2>
            <p className="text-center text-gray-600 mb-1 font-medium">
              🕒 Timezone: {cityTimezone}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => (
                <div
                  key={prayer}
                  className="flex flex-col items-center justify-center bg-blue-50 rounded-xl py-4 px-6 shadow hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-semibold text-blue-700 mb-1">{prayer}</h3>
                  <p className="text-2xl font-mono text-gray-900">{cityTimes[prayer]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Show only if city is NOT Pakistan timezone */}
          {cityTimezone !== "Asia/Karachi" && (
            <div className="bg-white rounded-3xl shadow-xl p-6 w-full sm:w-[48%] flex flex-col justify-center items-center text-center text-lg font-semibold text-gray-900">
              <p>
                Jab <span className="font-bold text-blue-700">{searchedCity}</span> mein Fajr{" "}
                <span className="font-mono text-blue-700 text-xl">{cityTimes.Fajr}</span> ho raha
                ho, to Pakistan mein 🕓{" "}
                <span className="font-mono text-blue-700 text-xl">
                  {formatTime12(pakistanFajrTime)}
                </span>{" "}
                ho raha hoga.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
