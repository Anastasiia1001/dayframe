export function providerConfig(env = process.env) {
  const tenant = env.MICROSOFT_TENANT_ID || "common";
  if (!/^[a-zA-Z0-9.-]+$/.test(tenant))
    throw new Error("Некоректний MICROSOFT_TENANT_ID");
  return {
    "outlook-work": {
      name: "Outlook · Робочий",
      clientId: env.MICROSOFT_CLIENT_ID,
      secret: env.MICROSOFT_CLIENT_SECRET,
      authorize: `https://login.microsoftonline.com/${tenant === "common" ? "organizations" : tenant}/oauth2/v2.0/authorize`,
      token: `https://login.microsoftonline.com/${tenant === "common" ? "organizations" : tenant}/oauth2/v2.0/token`,
      scope: "offline_access https://graph.microsoft.com/Calendars.Read",
      pkce: true,
      required: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
    },
    "outlook-personal": {
      name: "Outlook · Особистий",
      clientId: env.MICROSOFT_CLIENT_ID,
      secret: env.MICROSOFT_CLIENT_SECRET,
      authorize: `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize`,
      token: `https://login.microsoftonline.com/consumers/oauth2/v2.0/token`,
      scope: "offline_access https://graph.microsoft.com/Calendars.Read",
      pkce: true,
      required: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
    },
    google: {
      name: "Календар Google",
      clientId: env.GOOGLE_CLIENT_ID,
      secret: env.GOOGLE_CLIENT_SECRET,
      authorize: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/calendar.events.readonly",
      pkce: true,
      required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    },
    jira: {
      name: "Jira",
      clientId: env.ATLASSIAN_CLIENT_ID,
      secret: env.ATLASSIAN_CLIENT_SECRET,
      authorize: "https://auth.atlassian.com/authorize",
      token: "https://auth.atlassian.com/oauth/token",
      scope: "read:jira-work offline_access",
      pkce: false,
      required: ["ATLASSIAN_CLIENT_ID", "ATLASSIAN_CLIENT_SECRET"],
    },
    slack: {
      name: "Slack",
      clientId: env.SLACK_CLIENT_ID,
      secret: env.SLACK_CLIENT_SECRET,
      authorize: "https://slack.com/oauth/v2/authorize",
      token: "https://slack.com/api/oauth.v2.access",
      scope: "search:read,users:read",
      pkce: false,
      required: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],
    },
  };
}
