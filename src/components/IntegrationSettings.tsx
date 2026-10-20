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
        Підключи робочий і особистий Outlook, а потім Календар Google та Slack.
        Jira й Confluence вимкнені.
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
                    ? "Можна підключити"
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
              <a className="primary" href={`/api/auth/${id}/connect`}>
                <Link2 size={15} />
                Підключити {name}
              </a>
            ) : (
              <span className="setup-required">
                {workspace.status
                  ? "Потрібна реєстрація OAuth-застосунку — інструкція нижче."
                  : "Потрібна серверна версія. GitHub Pages не підтримує підключення облікових записів."}
              </span>
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
      <div className="connection-help">
        <a
          href="https://render.com/deploy?repo=https://github.com/Anastasiia1001/dayframe"
          target="_blank"
          rel="noreferrer"
        >
          Розмістити серверну версію <ArrowUpRight size={14} />
        </a>
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
        <a
          href="https://github.com/Anastasiia1001/dayframe/blob/main/docs/CONNECTIONS.md"
          target="_blank"
          rel="noreferrer"
        >
          Інструкція з підключення <ArrowUpRight size={14} />
        </a>
      </div>
      <p className="connection-footnote">
        Токени облікових записів зберігаються на сервері, а не в браузері. Сеанс
        триває до 8 годин; після перезапуску сервера потрібно підключитися
        знову. Відключення видаляє токен поточного сеансу. Щоб відкликати сам
        дозвіл, видали доступ застосунку в налаштуваннях сервісу.
      </p>
    </Section>
  );
}
