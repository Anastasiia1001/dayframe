export const plannerThemes = [
  { id: "Pastel", name: "Пастель", background: "#f7ead7", accent: "#a44e33" },
  { id: "CutePlanner", name: "Милий планер", background: "#fff0db", accent: "#a34b65" },
  { id: "Vintage", name: "Вінтаж", background: "#eaddbf", accent: "#74583b" },
  { id: "Parchment", name: "Магічний пергамент", background: "#e6cd93", accent: "#6d3429" },
];
export const isPlannerTheme = (theme: string) => plannerThemes.some(t => t.id === theme);
export const themes = [
  ...plannerThemes,
  {
    id: "Default",
    name: "Рожева ніжність",
    background: "#fff4f8",
    accent: "#a43b79",
  },
  {
    id: "Graphite",
    name: "Графітова",
    background: "#f1f2f3",
    accent: "#46515f",
  },
  { id: "Blue", name: "Блакитна", background: "#f2f6fa", accent: "#2465a7" },
  { id: "Green", name: "Зелена", background: "#f1f6f0", accent: "#347543" },
  { id: "Purple", name: "Бузкова", background: "#f6f3f9", accent: "#8042a2" },
  { id: "Warm", name: "Тепла", background: "#faf5ee", accent: "#965d22" },
  { id: "Dark", name: "Темна", background: "#1d2220", accent: "#d2a2d3" },
  { id: "Blossom", name: "Цвітіння", background: "#f8f2ff", accent: "#8043a8" },
  {
    id: "Strawberry",
    name: "Полуничне молочко",
    background: "#fff0f2",
    accent: "#b03960",
  },
  {
    id: "Pistachio",
    name: "Фісташкове печиво",
    background: "#f4f7e7",
    accent: "#5d731e",
  },
  {
    id: "Peach",
    name: "Персиковий зефір",
    background: "#fff3e9",
    accent: "#ac562d",
  },
  {
    id: "Blueberry",
    name: "Чорнична хмаринка",
    background: "#f0f1ff",
    accent: "#6650b3",
  },
  {
    id: "Lagoon",
    name: "М’ятна лагуна",
    background: "#ebfaf6",
    accent: "#227866",
  },
  {
    id: "Moonlight",
    name: "Місячна казка",
    background: "#252238",
    accent: "#d4b1f5",
  },
];
export const mascots = [
  {
    id: "bunny",
    name: "Зайчик Пух",
    description: "Майстер маленьких стрибків",
  },
  { id: "cat", name: "Киця Мур", description: "Муркотлива підтримка" },
  {
    id: "fox",
    name: "Лисичка Іскра",
    description: "Трошки хитрощів, багато тепла",
  },
  { id: "bear", name: "Ведмедик Медок", description: "Обійми між справами" },
  {
    id: "frog",
    name: "Жабка М’ята",
    description: "Стрибок назустріч хорошому",
  },
  {
    id: "star",
    name: "Зірочка Сяйка",
    description: "Твоє маленьке сузір’я радості",
  },
] as const;
export type MascotId = (typeof mascots)[number]["id"];
export function safeMascot(value: string): MascotId {
  return mascots.find((m) => m.id === value)?.id || "bunny";
}
