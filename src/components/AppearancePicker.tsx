import { ThemePreview } from "./ThemePreview";
import { useRef } from "react";
import { Palette, X, Check } from "lucide-react";
import { themes } from "../appearance";
const curated = [
  "Autumn",
  "Halloween",
  "Pastel",
  "Blossom",
  "Lagoon",
  "Moonlight",
  "Vintage",
  "NeonAzure",
];
export function AppearancePicker({
  theme,
  onTheme,
}: {
  theme: string;
  onTheme: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const choices = (items: typeof themes) => (
    <div className="appearance-gallery">
      {items.map((t) => (
        <button
          key={t.id}
          data-theme-id={t.id}
          aria-pressed={theme === t.id}
          onClick={() => {
            onTheme(t.id);
            dialog.current?.close();
          }}
        >
          <ThemePreview id={t.id} />
          <strong>{t.name}</strong>
          {theme === t.id && <Check size={15} />}
        </button>
      ))}
    </div>
  );
  return (
    <>
      <button
        aria-label="Оформлення планера"
        title="Обрати тему"
        onClick={() => dialog.current?.showModal()}
      >
        <Palette size={18} />
      </button>
      <dialog
        ref={dialog}
        className="appearance-dialog"
        aria-label="Теми оформлення"
        onClick={(e) => {
          if (e.currentTarget === e.target) dialog.current?.close();
        }}
      >
        <header>
          <div>
            <small>ТВІЙ ПРОСТІР</small>
            <h2>Оформлення</h2>
          </div>
          <button
            aria-label="Закрити теми"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        {choices(themes.filter((t) => curated.includes(t.id)))}
        <details>
          <summary>Усі теми · {themes.length}</summary>
          {choices(themes.filter((t) => !curated.includes(t.id)))}
        </details>
      </dialog>
    </>
  );
}
