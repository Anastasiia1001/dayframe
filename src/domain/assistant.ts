export type AssistantMessage = { role: "user" | "assistant"; content: string };
export async function askAssistant({
  apiKey,
  model,
  messages,
  mode,
  signal,
}: {
  apiKey: string;
  model: string;
  messages: AssistantMessage[];
  mode: "planning" | "care";
  signal?: AbortSignal;
}): Promise<string> {
  if (!apiKey.trim())
    throw Error("Додай свій API-ключ OpenAI у налаштуваннях цього чату.");
  if (!/^[a-zA-Z0-9_.:-]{1,100}$/.test(model))
    throw Error("Перевір назву моделі.");
  const instructions =
    mode === "care"
      ? "Відповідай українською, тепло, уважно й без осуду. Ти помічник самопідтримки, а не ліцензований психотерапевт. Не приписуй собі професійної кваліфікації, не встановлюй діагнозів і не призначай лікування. Відобрази почуття користувача, постав не більше одного доречного відкритого запитання. Пропонуй невеликі добровільні кроки, без тиску продуктивності. Не починай кожну відповідь однаковими застереженнями. Якщо користувач описує нагальну небезпеку для себе, заохоть звернутися по негайну допомогу до близької людини або місцевих екстрених служб."
      : "Ти уважний особистий помічник у діджитал-планері Dayframe. Відповідай українською, конкретно й доброзичливо. Допомагай ділити задачі на невеликі кроки та залишати простір для відпочинку. Ти бачиш лише повідомлення цього чату: не вигадуй доступу до календаря, здоров’я або приватних нотаток. Не стверджуй, що створив завдання чи нагадування, якщо ти лише описав їх текстом.";
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: messages
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) })),
        max_output_tokens: 1000,
        store: false,
      }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw Error("Відповідь зупинено.");
    throw Error(
      "Не вдалося з’єднатися з OpenAI. Перевір інтернет і повтори запит.",
    );
  }
  if (!response.ok)
    throw Error(
      response.status === 401
        ? "Ключ OpenAI не прийнято. Перевір його в налаштуваннях чату."
        : response.status === 429
          ? "OpenAI обмежив запит. Перевір API-баланс або спробуй пізніше."
          : response.status === 403
            ? "Цей API-проєкт не має доступу. Перевір дозволи в OpenAI Platform."
            : response.status === 404
              ? "Модель недоступна для твого API-проєкту. Вкажи іншу модель."
              : "OpenAI не зміг обробити запит. Спробуй ще раз.",
    );
  const data = await response.json();
  const output = Array.isArray(data.output)
    ? data.output
        .filter((item: { type?: string }) => item.type === "message")
        .flatMap((item: { content?: unknown[] }) =>
          Array.isArray(item.content) ? item.content : [],
        )
        .filter(
          (part: any) =>
            part?.type === "output_text" && typeof part.text === "string",
        )
        .map((part: any) => part.text)
        .join("\n")
    : "";
  if (!output.trim())
    throw Error(
      "OpenAI повернув порожню відповідь. Спробуй інше запитання або модель.",
    );
  return output;
}
