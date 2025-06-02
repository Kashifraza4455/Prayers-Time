import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function App() {
  const inputRef = useRef(null);

  const InputField = ({ ...props }) => (
    <input
      ref={inputRef}
      className="w-full px-5 py-3 rounded-lg border border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-600 text-gray-900 placeholder-gray-400 shadow-sm transition duration-300"
      {...props}
    />
  );

  const PrimaryButton = ({ children, ...props }) => (
    <button
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300"
      {...props}
    >
      {children}
    </button>
  );

  const [city, setCity] = useState("");
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity`,
        {
          params: {
            city,
            country: "",
            method: 2,
          },
        }
      );
      setPrayerTimes(response.data.data.timings);
    } catch (err) {
      setError("Could not fetch prayer times. Try a different city.");
      setPrayerTimes(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-5xl font-extrabold mb-10 text-blue-900 drop-shadow-lg">
        🕌 Prayer Times Finder
      </h1>

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl">
        <input
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
        <p className="text-red-600 mt-6 font-medium text-center max-w-xl">
          {error}
        </p>
      )}

      {prayerTimes && (
        <div className="mt-12 w-full max-w-xl bg-white rounded-3xl shadow-2xl p-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => (
            <div
              key={prayer}
              className="flex flex-col items-center justify-center bg-blue-50 rounded-2xl py-6 px-8 shadow-md hover:shadow-lg transition-shadow duration-300 select-none"
            >
              <h2 className="text-2xl font-semibold text-blue-800 mb-3">
                {prayer}
              </h2>
              <p className="text-3xl font-mono text-gray-900">
                {prayerTimes[prayer]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
