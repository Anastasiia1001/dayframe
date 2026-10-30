import { useLocal } from "../useLocal";
export function AssistantSettings({
  apiKey,
  onKey,
}: {
  apiKey: string;
  onKey: (key: string) => void;
}) {
  const [model, setModel] = useLocal("dayframe-openai-model", "gpt-4.1-mini");
  return (
    <div className="assistant-settings">
      <label>
        API-ключ OpenAI
        <input
          aria-label="API-ключ OpenAI"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => onKey(e.target.value)}
        />
      </label>
      <label>
        Модель OpenAI
        <input
          aria-label="Модель OpenAI"
          value={model}
          maxLength={100}
          onChange={(e) => setModel(e.target.value)}
        />
      </label>
      <p>
        Ключ лише в пам’яті до закриття або перезавантаження Dayframe. API
        оплачується окремо від підписки ChatGPT.
      </p>
      <a
        href="https://platform.openai.com/api-keys"
        target="_blank"
        rel="noreferrer"
      >
        Керувати ключами в OpenAI ↗
      </a>
      {apiKey && <button onClick={() => onKey("")}>Забути ключ</button>}
    </div>
  );
}
