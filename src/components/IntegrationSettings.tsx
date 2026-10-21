import { useState } from "react";
import { ArrowUpRight, Check, Link2, RefreshCw, Unplug } from "lucide-react";
import { Section, Source } from "./Primitives";
import { live, type IntegrationId } from "../data/live";
import type { useWorkspace } from "../useWorkspace";
export function IntegrationSettings({
  workspace,
}: {
  workspace: ReturnType<typeof useWorkspace>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [draft, setDraft] = useState(workspace.channels);
  const disconnect = async (id: IntegrationId) => {
    setBusy(id);
    setError("");
    try {
      await live.disconnect(id);
      await workspace.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не вдалося відключити обліковий запис.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <Section
      title="Твої підключення"
      eyebrow="ЛИШЕ ЧИТАННЯ · ТВОЇ ОБЛІКОВІ ЗАПИСИ, ТВІЙ ВИБІР"
    >
      <p className="section-description">
        Обери сервіс, увійди у свій акаунт і підтвердь читання даних. Пароль
        вводиться лише на офіційній сторінці сервісу.
      </p>
      <div className="connection-mode">
        <div>
          <strong>
            {workspace.mode === "live" ? "Власні дані" : "Демопростір"}
          </strong>
          <p>
            {workspace.mode === "live"
              ? "На головній сторінці відображаються лише дані підключених облікових записів."
              : "Приклади календарних подій і повідомлень Slack. Деморежим не підключає облікові записи."}
          </p>
        </div>
        <button
          className="secondary"
          onClick={() =>
            workspace.setMode(workspace.mode === "live" ? "demo" : "live")
          }
        >
          {workspace.mode === "live"
            ? "Спробувати деморежим"
            : "Використовувати власні дані"}
        </button>
      </div>
      {(
        [
          "outlook-work",
          "outlook-personal",
          "google",
          "slack",
        ] as IntegrationId[]
      ).map((id) => {
        const c = workspace.status?.providers.find((p) => p.id === id),
          name = id.startsWith("outlook-")
            ? id === "outlook-work"
              ? "Outlook · Робочий"
              : "Outlook · Особистий"
            : id === "google"
              ? "Календар Google"
              : "Slack";
        return (
          <div className="connection-card" key={id}>
            <div className="connection-title">
              <Source
                name={
                  id.startsWith("outlook-")
                    ? "Outlook"
                    : id === "google"
                      ? "Google"
                      : name
                }
              />
              <strong>{name}</strong>
              <span
                className={`connection-state ${c?.connected ? "is-connected" : ""}`}
              >
                {c?.connected
                  ? "Підключено"
                  : c?.configured
                    ? "Готовий до входу"
                    : "Не підключено"}
              </span>
            </div>
            <p>
              {id === "slack"
                ? "Читання прямих згадок і вибраних каналів. Повідомлення не надсилаються."
                : "Читання подій, подробиць зустрічей і списків учасників. Події не змінюються."}
            </p>
            {c?.connected ? (
              <button
                className="secondary"
                disabled={busy === id}
                onClick={() => void disconnect(id)}
              >
                <Unplug size={15} />
                {busy === id ? "Відключаємо…" : "Відключити"}
              </button>
            ) : c?.configured ? (
              <a
                className="primary"
                href={`/api/auth/${id}/connect`}
                onClick={() => {
                  workspace.setMode("live");
                  sessionStorage.setItem("dayframe-login-return", "settings");
                }}
              >
                <Link2 size={15} />
                Увійти через {name}
              </a>
            ) : (
              <div className="connection-unavailable">
                <button className="secondary" disabled>
                  Увійти через {name}
                </button>
                <span className="setup-required">
                  {workspace.status
                    ? "Вхід ще не активовано: на сервері бракує налаштувань цього сервісу."
                    : "Вхід доступний у серверній версії Dayframe."}
                </span>
              </div>
            )}
            {c?.configured && workspace.mode === "demo" && (
              <small>
                Перемкнися на власні дані, щоб побачити підключений обліковий
                запис.
              </small>
            )}
          </div>
        );
      })}
      <div className="disabled-connections">
        {["Jira", "Confluence"].map((s) => (
          <div key={s}>
            <Source name={s} />
            <span>{s}</span>
            <strong>Вимкнено · немає доступу</strong>
          </div>
        ))}
      </div>
      <div className="slack-preferences">
        <label htmlFor="slack-channels">
          <strong>Твої канали Slack</strong>
          <small>
            До 5 назв каналів через кому. Прямі згадки додаються автоматично.
          </small>
        </label>
        <div>
          <input
            id="slack-channels"
            placeholder="ui-team, design-systems"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            className="secondary"
            onClick={() => {
              const names = draft
                .split(",")
                .map((s) => s.trim().replace(/^#/, ""))
                .filter(Boolean);
              if (
                names.length > 5 ||
                names.some((n) => !/^[-_a-zA-Z0-9]+$/.test(n))
              ) {
                setError(
                  "Укажи до п’яти назв каналів: латинські літери, цифри, дефіси або підкреслення.",
                );
                return;
              }
              setError("");
              workspace.setChannels(names.join(","));
              setDraft(names.join(","));
            }}
          >
            <Check size={15} />
            Зберегти
          </button>
        </div>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!workspace.status && (
        <p className="connection-server-link">
          <a className="primary" href="https://dayframe-q62m.onrender.com/">
            Відкрити Dayframe з входом <ArrowUpRight size={14} />
          </a>
          <small>
            Завдання в цьому браузері зберігаються окремо для кожної адреси
            сайту.
          </small>
        </p>
      )}
      <div className="connection-help">
        <button
          className="text-button"
          disabled={workspace.loading}
          onClick={() => void workspace.refresh()}
        >
          <RefreshCw
            size={15}
            className={workspace.loading ? "spinning" : ""}
          />
          Оновити підключення
        </button>
      </div>
      <details className="connection-admin">
        <summary>Технічні налаштування підключень</summary>
        {workspace.status?.providers
          .filter((c) => !c.configured)
          .map((c) => {
            const id = c.id,
              name = c.name;
            return (
              <div key={id}>
                {c && !c.configured && (
                  <details className="connection-setup">
                    <summary>Налаштувати {name}</summary>
                    <ol>
                      <li>
                        <a
                          href={
                            id.startsWith("outlook-")
                              ? "https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                              : id === "google"
                                ? "https://console.cloud.google.com/apis/credentials"
                                : "https://api.slack.com/apps"
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Відкрити реєстрацію застосунку {name}
                        </a>
                        {id.startsWith("outlook-") && (
                          <p>
                            Обери підтримку робочих і особистих облікових
                            записів Microsoft. Для обох Outlook використовується
                            один застосунок із двома адресами повернення.
                          </p>
                        )}
                      </li>
                      <li>
                        <label>
                          Адреса повернення для {name}
                          <input
                            readOnly
                            value={c.redirectUri}
                            onFocus={(e) => e.currentTarget.select()}
                          />
                        </label>
                      </li>
                      <li>
                        Дозволи лише для читання:{" "}
                        <code>
                          {id.startsWith("outlook-")
                            ? "Calendars.Read, offline_access"
                            : id === "google"
                              ? "calendar.events.readonly"
                              : "search:read, users:read (User Token Scopes)"}
                        </code>
                        .
                      </li>
                      <li>
                        Додай у захищені змінні середовища хостингу:{" "}
                        <code>{c.missing.join(", ")}</code>. Потім перезапусти
                        сервер і натисни «Оновити підключення».
                      </li>
                    </ol>
                    <p>
                      Не вставляй секрети в Dayframe або в чат.
                      {id === "google" &&
                        " Спершу ввімкни Google Calendar API та додай себе до тестових користувачів OAuth."}
                    </p>
                  </details>
                )}
              </div>
            );
          })}
        <div className="connection-help">
          <a
            href="https://github.com/Anastasiia1001/dayframe/blob/main/docs/CONNECTIONS.md"
            target="_blank"
            rel="noreferrer"
          >
            Інструкція з підключення <ArrowUpRight size={14} />
          </a>
        </div>
      </details>
      <p className="connection-footnote">
        Токени облікових записів зберігаються на сервері, а не в браузері. Сеанс
        триває до 8 годин; після перезапуску сервера потрібно підключитися
        знову. Відключення видаляє токен поточного сеансу. Щоб відкликати сам
        дозвіл, видали доступ застосунку в налаштуваннях сервісу.
      </p>
    </Section>
  );
}
