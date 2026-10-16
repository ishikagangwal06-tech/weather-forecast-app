
from flask import Flask, render_template, request, jsonify
import requests

# Create the Flask application
app = Flask(__name__)

# Open-Meteo API URLs
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


# Convert weather codes into readable descriptions
def get_weather_description(code):
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Foggy",
        51: "Light drizzle",
        53: "Drizzle",
        55: "Heavy drizzle",
        56: "Freezing drizzle",
        57: "Freezing drizzle",
        61: "Light rain",
        63: "Rain",
        65: "Heavy rain",
        66: "Freezing rain",
        67: "Freezing rain",
        71: "Light snow",
        73: "Snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Rain showers",
        81: "Rain showers",
        82: "Heavy rain showers",
        85: "Snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
    }

    return descriptions.get(code, "Unknown conditions")


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Backend endpoint for weather searches
@app.route("/api/weather")
def get_weather():
    city = request.args.get("city", "").strip()

    # Validate the city input
    if not city:
        return jsonify({
            "error": "Please enter a city name."
        }), 400

    try:
        # STEP 1: Find the city's latitude and longitude
        geo_response = requests.get(
            GEOCODING_URL,
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            },
            timeout=10
        )

        geo_response.raise_for_status()
        geo_data = geo_response.json()

        locations = geo_data.get("results", [])

        # Check if the city exists
        if not locations:
            return jsonify({
                "error": "City not found. Please try another city."
            }), 404

        location = locations[0]
        latitude = location["latitude"]
        longitude = location["longitude"]

        # STEP 2: Request current weather and a 10-day forecast
        weather_response = requests.get(
            WEATHER_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "apparent_temperature,"
                    "is_day,"
                    "precipitation,"
                    "weather_code,"
                    "wind_speed_10m"
                ),
                "daily": (
                    "weather_code,"
                    "temperature_2m_max,"
                    "temperature_2m_min,"
                    "precipitation_probability_max"
                ),
                "forecast_days": 10,
                "timezone": "auto"
            },
            timeout=10
        )

        weather_response.raise_for_status()
        weather_data = weather_response.json()

        current = weather_data["current"]
        daily = weather_data["daily"]

        # STEP 3: Prepare the current weather information
        current_weather = {
            "temperature": current["temperature_2m"],
            "feels_like": current["apparent_temperature"],
            "humidity": current["relative_humidity_2m"],
            "wind_speed": current["wind_speed_10m"],
            "precipitation": current["precipitation"],
            "condition": get_weather_description(
                current["weather_code"]
            ),
            "is_day": current["is_day"],
            "updated_at": current["time"]
        }

        # STEP 4: Prepare the daily forecast list
        forecast = []

        for i in range(len(daily["time"])):
            forecast.append({
                "date": daily["time"][i],
                "condition": get_weather_description(
                    daily["weather_code"][i]
                ),
                "max_temp": daily["temperature_2m_max"][i],
                "min_temp": daily["temperature_2m_min"][i],
                "rain_probability": (
                    daily["precipitation_probability_max"][i]
                )
            })

        # STEP 5: Return everything as JSON
        result = {
            "city": location["name"],
            "country": location.get("country", ""),
            "current": current_weather,
            "forecast": forecast
        }

        return jsonify(result)

    except requests.RequestException:
        return jsonify({
            "error": (
                "Could not connect to the weather service. "
                "Check your internet and try again."
            )
        }), 502

    except (KeyError, TypeError, ValueError):
        return jsonify({
            "error": "Unexpected data received from the weather service."
        }), 502


# Start the development server
if __name__ == "__main__":
    app.run(debug=True)
