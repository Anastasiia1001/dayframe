import type { SlackDigestItem } from "../types";
export const mockSlack: SlackDigestItem[] = [
  {
    id: "s1",
    group: "Direct mentions",
    channel: "ui-team",
    author: "Maya Chen",
    summary:
      "Мая просить переглянути оновлений сценарій нагород перед обговоренням дизайну.",
    why: "Тебе згадали особисто. Обговорення почнеться об 11:00.",
    time: "32 хв тому",
  },
  {
    id: "s2",
    group: "My team",
    channel: "gamepoint-ui",
    author: "Sam Rivera",
    summary: "Команда погодила легший стиль анімацій для наступного випуску.",
    why: "Це стосується анімації нагород, над якою ти працюєш.",
    time: "1 год тому",
  },
  {
    id: "s3",
    group: "My projects",
    channel: "release-builds",
    author: "Nina Park",
    summary:
      "Новий журнал збірки може допомогти знайти причину проблеми з Addressables.",
    why: "Стосується завдання GAME-89322, призначеного тобі.",
    time: "2 год тому",
  },
  {
    id: "s4",
    group: "Everyone / important",
    channel: "announcements",
    author: "Команда турботи про працівників",
    summary:
      "П’ятниця — день зосередженої роботи. Внутрішні зустрічі необов’язкові.",
    why: "Корисно врахувати під час планування решти тижня.",
    time: "3 год тому",
  },
  {
    id: "s5",
    group: "Potentially useful",
    channel: "design-systems",
    author: "Elena Brooks",
    summary:
      "В оновлених рекомендаціях із доступності є нові приклади контрастності.",
    why: "Може знадобитися під час наступного обговорення інтерфейсу.",
    time: "4 год тому",
  },
  {
    id: "s6",
    group: "Could help here",
    channel: "gamepoint-ui",
    author: "Alex Morgan",
    summary:
      "Алекс досліджує проблему маскування інтерфейсу, схожу на ту, яку ти нещодавно розв’язала.",
    why: "Твій досвід може заощадити команді час.",
    time: "48 хв тому",
  },
];
