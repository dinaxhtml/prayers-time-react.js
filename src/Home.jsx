import React, { useMemo, useEffect, useState } from "react";
import Header from "./components/Header";
import Prayer from "./components/Prayer";
import duhr from "./assets/icons/sun.png";
import fajr from "./assets/icons/sunrise.png";
import shorouq from "./assets/icons/shorouq.png";
import maghrib from "./assets/icons/sunset.png";
import isha from "./assets/icons/moon.png";
import asr from "./assets/icons/asr.png";
import axios from "axios";
import countries from "./countries.json";
import moment from "moment";
import "moment/dist/locale/ar-dz";
moment.locale("ar");

export default function Home() {
  const [date, setDate] = useState(null);
  const [timings, setTimings] = useState({
    Fajr: "",
    Sunrise: "",
    Dhuhr: "",
    Asr: "",
    Maghrib: "",
    Isha: "",
  });
  const [nextPrayerIndex, setNextPrayerIndex] = useState("");
  const [remainingTime, setRemainingTime] = useState("00:00:00");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState({
    displayName: "",
    apiName: "",
  });

  const normalizeArabic = (text) =>
    text.replace(/أ|إ|آ/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) =>
      normalizeArabic(a.country_ar).localeCompare(
        normalizeArabic(b.country_ar),
        "ar",
        { sensitivity: "base" }
      )
    );
  }, []);

  const sortedCities = useMemo(() => {
    if (!selectedCountry) return [];
    return selectedCountry.cities_en
      .map((city, index) => ({
        en: city,
        ar: selectedCountry.cities_ar[index],
      }))
      .sort((a, b) =>
        normalizeArabic(a.ar).localeCompare(normalizeArabic(b.ar), "ar")
      );
  }, [selectedCountry]);

  const prayersArray = [
    { key: "Fajr", displayName: "الفجر" },
    { key: "Sunrise", displayName: "الشروق" },
    { key: "Dhuhr", displayName: "الظهر" },
    { key: "Asr", displayName: "العصر" },
    { key: "Maghrib", displayName: "المغرب" },
    { key: "Isha", displayName: "العشاء" },
  ];

  const getTimings = async () => {
    if (!selectedCountry || !selectedCity.apiName) return;
    try {
      const response = await axios.get(
        `https://api.aladhan.com/v1/timingsByCity?country=${selectedCountry.iso2}&city=${selectedCity.apiName}`
      );
      setTimings(response.data.data.timings);
      setDate(response.data.data.date);
    } catch (error) {
      console.error("Error fetching timings:", error);
    }
  };

  useEffect(() => {
    const savedCountry = localStorage.getItem("selectedCountry");
    const savedCity = localStorage.getItem("selectedCity");

    if (savedCountry) {
      setSelectedCountry(JSON.parse(savedCountry));
    }
    if (savedCity) {
      setSelectedCity(JSON.parse(savedCity));
    }
  }, []);

  useEffect(() => {
    getTimings();
  }, [selectedCountry, selectedCity]);

  const setupTimeCounter = () => {
    if (!timings.Fajr || !timings.Isha) return;

    const momentNow = moment();
    let prayerIndex = 0;

    try {
      if (
        momentNow.isAfter(moment(timings["Fajr"], "HH:mm")) &&
        momentNow.isBefore(moment(timings["Sunrise"], "HH:mm"))
      ) {
        prayerIndex = 1;
      } else if (
        momentNow.isAfter(moment(timings["Sunrise"], "HH:mm")) &&
        momentNow.isBefore(moment(timings["Dhuhr"], "HH:mm"))
      ) {
        prayerIndex = 2;
      } else if (
        momentNow.isAfter(moment(timings["Dhuhr"], "HH:mm")) &&
        momentNow.isBefore(moment(timings["Asr"], "HH:mm"))
      ) {
        prayerIndex = 3;
      } else if (
        momentNow.isAfter(moment(timings["Asr"], "HH:mm")) &&
        momentNow.isBefore(moment(timings["Maghrib"], "HH:mm"))
      ) {
        prayerIndex = 4;
      } else if (
        momentNow.isAfter(moment(timings["Maghrib"], "HH:mm")) &&
        momentNow.isBefore(moment(timings["Isha"], "HH:mm"))
      ) {
        prayerIndex = 5;
      } else {
        prayerIndex = 0;
      }

      setNextPrayerIndex(prayerIndex);

      const nextPrayerObj = prayersArray[prayerIndex];
      const nextPrayerTime = timings[nextPrayerObj.key];
      const nextPrayerTimeMoment = moment(nextPrayerTime, "HH:mm");

      let remainingTime = nextPrayerTimeMoment.diff(momentNow);

      if (remainingTime < 0) {
        const midnightDiff = moment("23:59:59", "HH:mm:ss").diff(momentNow);
        const fajrToMidnightDiff = nextPrayerTimeMoment.diff(
          moment("00:00:00", "HH:mm:ss")
        );
        remainingTime = midnightDiff + fajrToMidnightDiff;
      }

      const durationRemainingTime = moment.duration(remainingTime);

      setRemainingTime(
        `${String(durationRemainingTime.seconds()).padStart(2, "0")} : ${String(
          durationRemainingTime.minutes()
        ).padStart(2, "0")} : ${String(durationRemainingTime.hours()).padStart(
          2,
          "0"
        )}`
      );
    } catch (error) {
      console.error("Invalid timing format", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setupTimeCounter();
    }, 1000);

    return () => clearInterval(interval);
  }, [timings]);

  const handleCountryChange = (e) => {
    const countryObject = countries.find((c) => c.iso2 === e.target.value);
    setSelectedCountry(countryObject);
    setSelectedCity({ displayName: "", apiName: "" });
    localStorage.setItem("selectedCountry", JSON.stringify(countryObject));
  };

  const handleCityChange = (e) => {
    const cityApi = e.target.value;
    const cityDisplay = sortedCities.find((city) => city.en === cityApi)?.ar;

    const selected = {
      apiName: cityApi,
      displayName: cityDisplay,
    };

    setSelectedCity(selected);
    localStorage.setItem("selectedCity", JSON.stringify(selected));
  };

  return (
    <div className="tables">
      <div className="container">
        <Header />
        <section className="main-table">
          <div className="table">
            <div className="info">
              <div className="time">
                <h2 className="city-name">{selectedCity.displayName}</h2>
                <p className="date">
                  {date
                    ? `${date.hijri.day} ${date.hijri.month.ar} ${date.hijri.year} هـ | ${date.hijri.weekday.ar}`
                    : ""}
                </p>
              </div>
              <div className="next-prayer">
                <p>
                  متبقي على اذان{" "}
                  {prayersArray[nextPrayerIndex]
                    ? prayersArray[nextPrayerIndex].displayName
                    : ""}
                </p>
                <h2>{remainingTime}</h2>
              </div>
            </div>
            <div className="times">
              <Prayer name="الفجر" time={timings.Fajr} icon={fajr} />
              <Prayer name="الشروق" time={timings.Sunrise} icon={shorouq} />
              <Prayer name="الظهر" time={timings.Dhuhr} icon={duhr} />
              <Prayer name="العصر" time={timings.Asr} icon={asr} />
              <Prayer name="المغرب" time={timings.Maghrib} icon={maghrib} />
              <Prayer name="العشاء" time={timings.Isha} icon={isha} />
            </div>
          </div>
          <div className="city">
            <label htmlFor="country">اختر الدولة:</label>
            <select
              id="country"
              onChange={handleCountryChange}
              value={selectedCountry?.iso2 || ""}
            >
              <option value="">-- اختر الدولة --</option>
              {sortedCountries.map((country) => (
                <option key={country.iso2} value={country.iso2}>
                  {country.country_ar}
                </option>
              ))}
            </select>

            {selectedCountry && (
              <>
                <label htmlFor="city">اختر المدينة:</label>
                <select
                  id="city"
                  onChange={handleCityChange}
                  value={selectedCity.apiName}
                >
                  <option value="">-- اختر المدينة --</option>
                  {sortedCities.map((city, idx) => (
                    <option key={idx} value={city.en}>
                      {city.ar}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
