export type WeatherKind = "sun" | "cloud" | "fog" | "rain" | "snow" | "storm";
export function weatherKind(code: number): WeatherKind {
  if (code === 0 || code === 1) return "sun";
  if (code === 2 || code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if (code >= 95) return "storm";
  return "rain";
}
export const weatherLabels: Record<WeatherKind, string> = {
  sun: "Сонячно",
  cloud: "Хмарно",
  fog: "Туман",
  rain: "Дощ",
  snow: "Сніг",
  storm: "Гроза",
};
export type WeatherData = {
  temperature: number;
  feels: number;
  code: number;
  isDay: boolean;
  at: number;
};
export function parseWeather(value: unknown): WeatherData {
  const c = (value as { current?: Record<string, unknown> })?.current;
  if (
    !c ||
    !["temperature_2m", "apparent_temperature", "weather_code", "is_day"].every(
      (k) => typeof c[k] === "number" && Number.isFinite(c[k]),
    ) ||
    Number(c.weather_code) < 0 ||
    Number(c.weather_code) > 99
  )
    throw Error("weather");
  return {
    temperature: Number(c.temperature_2m),
    feels: Number(c.apparent_temperature),
    code: Number(c.weather_code),
    isDay: c.is_day === 1,
    at: Date.now(),
  };
}
