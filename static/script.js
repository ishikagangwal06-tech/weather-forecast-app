
const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const message = document.getElementById("message");

const currentCard = document.getElementById("current-card");
const forecastSection = document.getElementById("forecast-section");
const forecastList = document.getElementById("forecast-list");


// Return an emoji for each weather condition
function getWeatherIcon(condition) {
    if (condition.includes("Thunderstorm")) return "⛈️";
    if (condition.includes("snow") || condition.includes("Snow")) {
        return "❄️";
    }
    if (condition.includes("rain") || condition.includes("Rain")) {
        return "🌧️";
    }
    if (condition.includes("drizzle") || condition.includes("Drizzle")) {
        return "🌦️";
    }
    if (condition.includes("Fog")) return "🌫️";
    if (condition.includes("Overcast")) return "☁️";
    if (condition.includes("cloud")) return "⛅";
    if (condition.includes("cloudy")) return "⛅";
    if (condition.includes("clear") || condition.includes("Clear")) {
        return "☀️";
    }

    return "🌤️";
}


// Format a date without accidentally changing its calendar day
function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
    });
}


// Display the current weather
function displayCurrentWeather(data) {
    document.getElementById("location").textContent =
        `${data.city}, ${data.country}`;

    document.getElementById("current-date").textContent =
        `Local time: ${data.current.updated_at.replace("T", " ")}`;

    document.getElementById("current-icon").textContent =
        getWeatherIcon(data.current.condition);

    document.getElementById("condition").textContent =
        data.current.condition;

    document.getElementById("temperature").textContent =
        Math.round(data.current.temperature);

    document.getElementById("feels-like").textContent =
        Math.round(data.current.feels_like);

    document.getElementById("humidity").textContent =
        `${data.current.humidity}%`;

    document.getElementById("wind-speed").textContent =
        `${data.current.wind_speed} km/h`;

    document.getElementById("precipitation").textContent =
        `${data.current.precipitation} mm`;

    currentCard.hidden = false;
}


// Display the ten-day forecast
function displayForecast(forecast) {
    forecastList.replaceChildren();

    forecast.forEach((day, index) => {
        const row = document.createElement("div");
        row.className = "forecast-day";

        // Show Today for the first forecast day
        const dayName = index === 0
            ? "Today"
            : new Date(
                Number(day.date.slice(0, 4)),
                Number(day.date.slice(5, 7)) - 1,
                Number(day.date.slice(8, 10))
            ).toLocaleDateString("en-IN", {
                weekday: "short"
            });

        // Create the date and weekday section
        const dateBox = document.createElement("div");

        const name = document.createElement("div");
        name.className = "day-name";
        name.textContent = dayName;

        const date = document.createElement("div");
        date.className = "day-date";
        date.textContent = formatDate(day.date);

        dateBox.append(name, date);

        // Create the weather icon
        const icon = document.createElement("div");
        icon.className = "day-icon";
        icon.textContent = getWeatherIcon(day.condition);

        // Create the weather condition
        const condition = document.createElement("div");
        condition.className = "day-condition";
        condition.textContent = day.condition;

        // Create the high and low temperatures
        const temperatures = document.createElement("div");
        temperatures.className = "day-temperatures";

        const high = document.createElement("span");
        high.className = "max-temp";
        high.textContent = `${Math.round(day.max_temp)}°`;

        const low = document.createElement("span");
        low.className = "min-temp";
        low.textContent = `${Math.round(day.min_temp)}°`;

        const rain = document.createElement("div");
        rain.className = "rain-probability";

        const probability = day.rain_probability;

        rain.textContent = probability === null
            ? "Rain chance unavailable"
            : `💧 ${probability}% rain chance`;

        temperatures.append(high, low, rain);

        row.append(dateBox, icon, condition, temperatures);
        forecastList.appendChild(row);
    });

    forecastSection.hidden = false;
}


// Fetch weather when the form is submitted
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        return;
    }

    message.style.color = "#2563eb";
    message.textContent = "Loading weather and 10-day forecast...";

    currentCard.hidden = true;
    forecastSection.hidden = true;
    searchButton.disabled = true;

    try {
        // Send the request to our own Flask backend
        const response = await fetch(
            `/api/weather?city=${encodeURIComponent(city)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to get weather.");
        }

        // Update both sections using the backend response
        displayCurrentWeather(data);
        displayForecast(data.forecast);

        message.textContent = "";

    } catch (error) {
        message.style.color = "#dc2626";
        message.textContent = error.message;

    } finally {
        searchButton.disabled = false;
    }
});
