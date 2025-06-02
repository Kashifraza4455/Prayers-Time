import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function App() {
  const inputRef = useRef(null);

  const PrimaryButton = ({ children, ...props }) => (
    <button
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300"
      {...props}
    >
      {children}
    </button>
  );

  const [city, setCity] = useState("");
  const [searchedCity, setSearchedCity] = useState("");
  const [cityTimes, setCityTimes] = useState(null);
  const [pakistanTimes, setPakistanTimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError("");
    try {
      const cityResponse = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity`,
        {
          params: {
            city,
            country: "",
            method: 2,
          },
        }
      );

      const pkResponse = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity`,
        {
          params: {
            city: "Lahore",
            country: "Pakistan",
            method: 2,
          },
        }
      );

      setCityTimes({
        timings: cityResponse.data.data.timings,
        timezone: cityResponse.data.data.meta.timezone,
      });

      setPakistanTimes({
        timings: pkResponse.data.data.timings,
        timezone: pkResponse.data.data.meta.timezone,
      });

      setSearchedCity(city);
    } catch (err) {
      setError("Could not fetch prayer times. Try a different city.");
      setCityTimes(null);
      setPakistanTimes(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatTimeTo12Hour = (time24) => {
    const [hour, minute] = time24.split(":");
    const date = new Date();
    date.setHours(+hour);
    date.setMinutes(+minute);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const renderPrayerCards = (prayerTimes, title, timezone) => {
    const now = new Date();
    const localTime = now.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const localDate = now.toLocaleDateString("en-GB", {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full sm:w-[48%]">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">{title}</h2>
        <p className="text-center text-gray-600 mb-1 font-medium">🕒 Timezone: {timezone}</p>
        <p className="text-center text-gray-500 mb-4 font-medium">
          📅 Date: {localDate} | 🕓 Time: {localTime}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => (
            <div
              key={prayer}
              className="flex flex-col items-center justify-center bg-blue-50 rounded-xl py-4 px-6 shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-blue-700 mb-1">{prayer}</h3>
              <p className="text-2xl font-mono text-gray-900">
                {formatTimeTo12Hour(prayerTimes[prayer])}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 text-blue-900 drop-shadow-lg text-center">
        🕌 Prayer Times Finder
      </h1>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl mb-6">
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && city) fetchPrayerTimes();
          }}
          className="w-full px-5 py-3 rounded-lg border border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-600 text-gray-900 placeholder-gray-400 shadow-sm transition duration-300"
        />

        <PrimaryButton onClick={fetchPrayerTimes} disabled={!city || loading}>
          {loading ? "Searching..." : "Get Times"}
        </PrimaryButton>
      </div>

      {error && (
        <p className="text-red-600 mt-4 font-medium text-center max-w-xl">
          {error}
        </p>
      )}

      {cityTimes && pakistanTimes && (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8 mt-8 w-full max-w-5xl">
          {renderPrayerCards(cityTimes.timings, `🕌 ${searchedCity} Prayer Times`, cityTimes.timezone)}
          {renderPrayerCards(pakistanTimes.timings, `🇵🇰 Pakistan Prayer Times`, pakistanTimes.timezone)}
        </div>
      )}
    </div>
  );
}
