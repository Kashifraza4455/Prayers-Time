import React, { useState } from "react";
import axios from "axios";
import { DateTime } from "luxon";

export default function App() {
  const [city, setCity] = useState("");
  const [searchedCity, setSearchedCity] = useState("");
  const [cityTimes, setCityTimes] = useState(null);
  const [pakistanFajrTime, setPakistanFajrTime] = useState(null);
  const [cityTimezone, setCityTimezone] = useState("");
  const [dateReadable, setDateReadable] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PrimaryButton = ({ children, ...props }) => (
    <button
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300"
      {...props}
    >
      {children}
    </button>
  );

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
    setDateReadable("");

    const data = await fetchPrayerTimes(city);
    if (!data) {
      setError("City not found. Please check the spelling or try another city.");
      setLoading(false);
      return;
    }

    setCityTimes(data.timings);
    setCityTimezone(data.meta.timezone);
    setSearchedCity(city);
    setDateReadable(data.date.readable);

    try {
      const fajrTimeStr = data.timings.Fajr; 
      const dateStr = data.date.readable; 
      const [day, monthShort, year] = dateStr.split(" ");
      const month = DateTime.fromFormat(monthShort, "LLL").month;

      const fajrDateInCity = DateTime.fromObject(
        {
          year: parseInt(year),
          month: month,
          day: parseInt(day),
          hour: parseInt(fajrTimeStr.split(":")[0]),
          minute: parseInt(fajrTimeStr.split(":")[1]),
        },
        { zone: data.meta.timezone }
      );

      const fajrDateInPakistan = fajrDateInCity.setZone("Asia/Karachi");
      setPakistanFajrTime(fajrDateInPakistan);
    } catch {
      setPakistanFajrTime(null);
    }

    setLoading(false);
  };

  const formatPrayerTime = (timeStr, timezone, dateStr) => {
    if (!timeStr || !timezone || !dateStr) return "";

    const [day, monthShort, year] = dateStr.split(" ");
    const month = DateTime.fromFormat(monthShort, "LLL").month;

    const [hour, minute] = timeStr.split(":").map(Number);

    const dt = DateTime.fromObject(
      { year: parseInt(year), month, day: parseInt(day), hour, minute },
      { zone: timezone }
    );

    return dt.toLocaleString(DateTime.TIME_SIMPLE); 
  };

  const formatTime12 = (dateTime) => {
    if (!dateTime) return "";
    const jsDate = dateTime.toJSDate();
    return jsDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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

        <PrimaryButton onClick={fetchTimes} disabled={!city || loading}>
          {loading ? "Searching..." : "Get Times"}
        </PrimaryButton>
      </div>

      {error && (
        <p className="text-red-600 mt-4 font-medium text-center max-w-xl">{error}</p>
      )}

      {cityTimes && (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8 mt-8 w-full max-w-5xl">
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
                  <p className="text-2xl font-mono text-gray-900">
                    {formatPrayerTime(cityTimes[prayer], cityTimezone, dateReadable)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {cityTimezone !== "Asia/Karachi" && pakistanFajrTime && (
            <div className="bg-white rounded-3xl shadow-xl p-6 w-full sm:w-[48%] flex flex-col justify-center items-center text-center text-lg font-semibold text-gray-900">
              <p>
                Jab <span className="font-bold text-blue-700">{searchedCity}</span> mein {" "}
                <span className="font-mono text-blue-700 text-xl">{formatPrayerTime(cityTimes.Fajr, cityTimezone, dateReadable)}</span> ho raha
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
