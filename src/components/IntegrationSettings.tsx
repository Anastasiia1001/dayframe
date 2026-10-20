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
      setError(e instanceof Error ? e.message : "Could not disconnect.");
    } finally {
      setBusy("");
    }
  };
  return (
    <Section
      title="Your connections"
      eyebrow="READ-ONLY · YOUR ACCOUNTS, YOUR CHOICE"
    >
      <p className="section-description">
        Connect work and personal Outlook accounts, then Google Calendar and
        Slack. Jira and Confluence are disabled.
      </p>
      <div className="connection-mode">
        <div>
          <strong>
            {workspace.mode === "live" ? "Live workspace" : "Demo workspace"}
          </strong>
          <p>
            {workspace.mode === "live"
              ? "Only connected accounts appear in your dashboard."
              : "Sample calendar and Slack activity. No accounts are connected by demo mode."}
          </p>
        </div>
        <button
          className="secondary"
          onClick={() =>
            workspace.setMode(workspace.mode === "live" ? "demo" : "live")
          }
        >
          {workspace.mode === "live" ? "Try demo" : "Use live data"}
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
              ? "Outlook · Work"
              : "Outlook · Personal"
            : id === "google"
              ? "Google Calendar"
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
                  ? "Connected"
                  : c?.configured
                    ? "Ready to connect"
                    : "Not connected"}
              </span>
            </div>
            <p>
              {id === "slack"
                ? "Read direct mentions and the channels you choose. No messages are sent."
                : "Read calendar events, meeting details and attendees. No events are changed."}
            </p>
            {c?.connected ? (
              <button
                className="secondary"
                disabled={busy === id}
                onClick={() => void disconnect(id)}
              >
                <Unplug size={15} />
                {busy === id ? "Disconnecting…" : "Disconnect"}
              </button>
            ) : c?.configured ? (
              <a className="primary" href={`/api/auth/${id}/connect`}>
                <Link2 size={15} />
                Connect {name}
              </a>
            ) : (
              <span className="setup-required">
                {workspace.status
                  ? "Account app registration required — see setup guide below."
                  : "Requires the hosted workspace. GitHub Pages cannot run account connections."}
              </span>
            )}
            {c?.configured && workspace.mode === "demo" && (
              <small>Switch to live data to see your connected account.</small>
            )}
          </div>
        );
      })}
      <div className="disabled-connections">
        {["Jira", "Confluence"].map((s) => (
          <div key={s}>
            <Source name={s} />
            <span>{s}</span>
            <strong>Disabled · no access</strong>
          </div>
        ))}
      </div>
      <div className="slack-preferences">
        <label htmlFor="slack-channels">
          <strong>Your Slack channels</strong>
          <small>
            Up to 5 channel names, separated by commas. Direct mentions are
            included automatically.
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
                  "Enter up to five channel names using letters, numbers, hyphens or underscores.",
                );
                return;
              }
              setError("");
              workspace.setChannels(names.join(","));
              setDraft(names.join(","));
            }}
          >
            <Check size={15} />
            Save
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
          Deploy live workspace <ArrowUpRight size={14} />
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
          Refresh connections
        </button>
        <a
          href="https://github.com/Anastasiia1001/dayframe/blob/main/docs/CONNECTIONS.md"
          target="_blank"
          rel="noreferrer"
        >
          Connection setup guide <ArrowUpRight size={14} />
        </a>
      </div>
      <p className="connection-footnote">
        Your account tokens stay on the server, never in browser storage.
        Sessions last up to 8 hours; a server restart requires reconnecting.
        Disconnect removes this session’s token; revoke app access in the
        provider’s settings to revoke the permission itself.
      </p>
    </Section>
  );
}
