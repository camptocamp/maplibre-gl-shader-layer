import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { weatherDemo } from "./demos/weather";
import { dummyDemo } from "./demos/dummy";
import { weatherDayNightDemo } from "./demos/weatherdaynight";

const demos = {
  dummy: () => {
    dummyDemo();
  },

  temperature: () => {
    weatherDemo("temperature_2m");
  },

  windspeed: () => {
    weatherDemo("wind_speed_10m");
  },

  "temperature-day-night": () => {
    weatherDayNightDemo("temperature_2m")
  },

  "windspeed-day-night": () => {
    weatherDayNightDemo("wind_speed_10m");
  },
} as const;


(() => {

  const params = new URLSearchParams(window.location.search);
  const demoNameParam = params.get("demo");

  if (demoNameParam && demoNameParam in demos) {
    demos[demoNameParam as keyof typeof demos]();
  } else {
    location.href = "?demo=temperature"
  }

  const demoListContainer = document.getElementById("demo-list") as HTMLDivElement;

  for (const demoName in demos) {
    const demoLink = document.createElement("a") as HTMLAnchorElement;
    demoLink.href = `?demo=${demoName}`;
    demoLink.innerText = demoName;
    demoListContainer.append(demoLink);

    if (demoNameParam === demoName) {
      demoLink.classList.add("selected-demo");
    }
  }

})()