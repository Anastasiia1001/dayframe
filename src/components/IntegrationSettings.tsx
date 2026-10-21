import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Link2, RefreshCw, Unplug } from "lucide-react";
import { Section, Source } from "./Primitives";
import { live, type IntegrationId } from "../data/live";
import {
  connectDirect,
  directIds,
  directRedirect,
  saveDirectIds,
  warmDirectLogin,
  type DirectId,
} from "../data/browserConnections";
import type { useWorkspace } from "../useWorkspace";
export function IntegrationSettings({
  workspace,
}: {
  workspace: ReturnType<typeof useWorkspace>;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [draft, setDraft] = useState(workspace.channels);
  const [clientIds, setClientIds] = useState(directIds);
  const [saved, setSaved] = useState(false);
  useEffect(() => warmDirectLogin(), []);
  const connect = async (id: DirectId) => {
    setBusy(id);
    setError("");
    try {
      await connectDirect(id);
      workspace.setMode("live");
      await workspace.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося увійти.");
    } finally {
      setBusy("");
    }
  };
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
          "jira",
        ] as IntegrationId[]
      ).map((id) => {
        const c = workspace.status?.providers.find((p) => p.id === id),
          name = id.startsWith("outlook-")
            ? id === "outlook-work"
              ? "Outlook · Робочий"
              : "Outlook · Особистий"
            : id === "google"
              ? "Календар Google"
              : id === "jira"
                ? "Jira"
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
              {id === "jira"
                ? "Твої активні завдання. Дедлайни відображаються в календарі; завдання без дати можна запланувати в розділі «Робота»."
                : id === "slack"
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
            ) : c?.configured && c.transport === "browser" ? (
              <button
                className="primary"
                disabled={!!busy}
                onClick={() => void connect(id as DirectId)}
              >
                <Link2 size={15} />
                {busy === id ? "Входимо…" : `Увійти через ${name}`}
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
                    ? id === "slack" || id === "jira"
                      ? `${name} потребує одноразової реєстрації застосунку для читання даних.`
                      : "Додай публічний Client ID нижче — події завантажуватимуться прямо в календар."
                    : id === "slack" || id === "jira"
                      ? `Для ${name} потрібен налаштований офіційний застосунок.`
                      : "Прямий вхід працює без сервера після одноразової активації нижче."}
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
        {["Confluence"].map((s) => (
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
      <details className="connection-direct-setup">
        <summary>Активація прямого входу в календарі · один раз</summary>
        <p>
          Це публічні ідентифікатори Dayframe, не паролі та не секрети. Після
          активації — лише звичайний вхід Microsoft або Google. Сервер для
          календарів не потрібен.
        </p>
        <label>
          Microsoft Application (client) ID
          <input
            value={clientIds.microsoft}
            onChange={(e) => {
              setClientIds({ ...clientIds, microsoft: e.target.value });
              setSaved(false);
            }}
            autoComplete="off"
          />
        </label>
        <label>
          Google Client ID
          <input
            value={clientIds.google}
            onChange={(e) => {
              setClientIds({ ...clientIds, google: e.target.value });
              setSaved(false);
            }}
            autoComplete="off"
          />
        </label>
        <button
          className="secondary"
          onClick={() => {
            try {
              saveDirectIds(clientIds);
              warmDirectLogin();
              setError("");
              setSaved(true);
              void workspace.refresh();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Не вдалося зберегти налаштування.",
              );
            }
          }}
        >
          Зберегти прямий вхід
        </button>
        {saved && (
          <p role="status">
            Налаштування збережено. Тепер натисни «Увійти» біля календаря.
          </p>
        )}
        <p>
          <a
            href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
            target="_blank"
            rel="noreferrer"
          >
            Microsoft: реєстрація застосунку
          </a>{" "}
          → робочі й особисті акаунти → платформа Single-page application →
          Calendars.Read. Адреса повернення:
        </p>
        <input
          aria-label="Адреса повернення прямого входу"
          readOnly
          value={directRedirect()}
          onFocus={(e) => e.currentTarget.select()}
        />
        <p>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
          >
            Google: OAuth Web client
          </a>{" "}
          → увімкни Calendar API. Authorized JavaScript origin:{" "}
          <code>{location.origin}</code>. Додай свій акаунт до тестових
          користувачів, якщо застосунок у тестовому режимі.
        </p>
      </details>
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
          .filter((c) => !c.configured && c.transport !== "browser")
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
                                : id === "jira"
                                  ? "https://developer.atlassian.com/console/myapps/"
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
                              : id === "jira"
                                ? "read:jira-work, offline_access"
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
        Прямі підключення календарів тримають токени лише в пам’яті вкладки;
        після перезавантаження сторінки потрібно увійти знову. Для серверних
        підключень сеанс триває до 8 годин; після перезапуску сервера потрібно
        підключитися знову. Відключення видаляє токен поточного сеансу. Щоб
        відкликати сам дозвіл, видали доступ застосунку в налаштуваннях сервісу.
      </p>
    </Section>
  );
}
