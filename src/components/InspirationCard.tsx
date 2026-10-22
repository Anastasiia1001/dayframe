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
export function InspirationCard() {
  const [prefs, setPrefs] = useLocal("dayframe-inspiration", {
    kind: "mixed",
    minutes: 5,
  });
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => i + 1);
  useEffect(() => {
    if (!prefs.minutes) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => i + 1);
    }, prefs.minutes * 60000);
    return () => clearInterval(timer);
  }, [prefs.minutes, prefs.kind]);
  const fact =
    prefs.kind === "facts" || (prefs.kind === "mixed" && index % 2 === 1);
  const contentIndex = prefs.kind === "mixed" ? Math.floor(index / 2) : index;
  const content = fact
    ? facts[contentIndex % facts.length][0]
    : affirmations[contentIndex % affirmations.length];
  return (
    <article
      className="today-card inspiration-card"
      aria-label="Афірмації та цікаві факти"
    >
      <div className="weather-top">
        <h2>
          <Sparkles size={17} /> {fact ? "Цікавий факт" : "Трохи підтримки"}
        </h2>
        <button aria-label="Наступна афірмація або факт" onClick={next}>
          <ArrowRight size={17} />
        </button>
      </div>
      <p className="inspiration-text" key={`${prefs.kind}:${index}`}>
        {content}
      </p>
      {fact && (
        <a
          href={facts[contentIndex % facts.length][1]}
          target="_blank"
          rel="noreferrer"
        >
          Джерело факту ↗
        </a>
      )}
      <div className="inspiration-controls">
        <label>
          Що показувати
          <select
            aria-label="Що показувати"
            value={prefs.kind}
            onChange={(e) => {
              setPrefs({ ...prefs, kind: e.target.value });
              setIndex(0);
            }}
          >
            <option value="mixed">Афірмації та факти</option>
            <option value="affirmations">Лише афірмації</option>
            <option value="facts">Лише факти</option>
          </select>
        </label>
        <label>
          Змінювати
          <select
            aria-label="Частота зміни афірмацій і фактів"
            value={prefs.minutes}
            onChange={(e) =>
              setPrefs({ ...prefs, minutes: Number(e.target.value) })
            }
          >
            {[
              [0, "Лише вручну"],
              [1, "Щохвилини"],
              [5, "Кожні 5 хв"],
              [15, "Кожні 15 хв"],
              [30, "Кожні 30 хв"],
              [60, "Щогодини"],
            ].map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  );
}
