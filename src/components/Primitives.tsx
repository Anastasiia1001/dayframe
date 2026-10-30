import type { ReactNode, CSSProperties } from "react";
export function Source({ name }: { name: string }) {
  return (
    <span className={`source source-${name.toLowerCase()}`}>
      {name === "Slack"
        ? "#"
        : name === "Jira"
          ? "◆"
          : name === "Confluence"
            ? "›‹"
            : name === "Google"
              ? "G"
              : name === "Outlook"
                ? "O"
                : "✓"}
    </span>
  );
}
export function Section({
  title,
  eyebrow,
  action,
  children,
  className = "",
  style,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section style={style} className={`card ${className}`}>
      <div className="section-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
