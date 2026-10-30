import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLocal } from "../useLocal";
const affirmations = [
  "Я можу рухатися у власному темпі.",
  "Мій відпочинок так само важливий, як моя праця.",
  "Мені не потрібно робити все одразу. Один крок — уже рух.",
  "Я маю право змінити план і подбати про себе.",
  "Моя цінність не залежить від кількості виконаних завдань.",
  "Я можу почати з малого і поступово знайти свій ритм.",
  "Я помічаю власні зусилля, навіть коли результат ще попереду.",
  "Сьогодні я обираю доброзичливість до себе.",
];
const facts = [
  [
    "Восьминоги мають три серця: два прокачують кров через зябра, а третє — через решту тіла.",
    "https://ocean.si.edu/ocean-life/invertebrates/octopuses",
  ],
  [
    "Венера обертається навколо своєї осі повільніше, ніж навколо Сонця.",
    "https://science.nasa.gov/venus/facts/",
  ],
  [
    "Сніжинки утворюють шестикутні структури завдяки будові кристалів льоду.",
    "https://www.noaa.gov/stories/how-do-snowflakes-form-science-behind-snow",
  ],
  [
    "Місяць поступово віддаляється від Землі — це вимірюють лазерними відбивачами, залишеними астронавтами.",
    "https://science.nasa.gov/moon/facts/",
  ],
  [
    "Медоносні бджоли передають напрямок і відстань до їжі за допомогою танцю.",
    "https://www.britannica.com/science/animal-communication/The-honeybee-dance-language",
  ],
  [
    "Світло Сонця проходить шлях до Землі приблизно за вісім хвилин.",
    "https://science.nasa.gov/sun/facts/",
  ],
];
export function InspirationCard({
  kind = "affirmations",
  compact = false,
}: {
  kind?: "affirmations" | "facts";
  compact?: boolean;
}) {
  const [minutes, setMinutes] = useLocal(`dayframe-inspiration-${kind}`, 5);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!minutes) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => i + 1);
    }, minutes * 60000);
    return () => clearInterval(timer);
  }, [minutes]);
  const fact = kind === "facts",
    label = fact ? "Цікавинки" : "Афірмації";
  return (
    <article
      className={`today-card inspiration-card inspiration-${kind}`}
      aria-label={label}
    >
      <div className="weather-top">
        <h2>
          <Sparkles size={17} />
          {fact ? "Цікавинка дня" : "Трохи підтримки"}
        </h2>
        <button
          aria-label={fact ? "Наступна цікавинка" : "Наступна афірмація"}
          onClick={() => setIndex((i) => i + 1)}
        >
          <ArrowRight size={17} />
        </button>
      </div>
      <div className={compact ? "inspiration-compact" : ""}>
        <p className="inspiration-text" key={index}>
          {fact
            ? facts[index % facts.length][0]
            : affirmations[index % affirmations.length]}
        </p>
        {fact && (
          <a
            href={facts[index % facts.length][1]}
            target="_blank"
            rel="noreferrer"
          >
            Джерело факту ↗
          </a>
        )}
      </div>
      <label>
        Змінювати
        <select
          aria-label={
            fact ? "Частота зміни цікавинок" : "Частота зміни афірмацій"
          }
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          {[
            [0, "Лише вручну"],
            [1, "Щохвилини"],
            [5, "Кожні 5 хв"],
            [15, "Кожні 15 хв"],
            [30, "Кожні 30 хв"],
            [60, "Щогодини"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
