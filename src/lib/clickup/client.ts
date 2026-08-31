const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

interface FeedbackPayload {
  message: string;
  page: string;
  userEmail: string | null;
}

/**
 * Creates a task in the configured ClickUp list from an in-app feedback
 * submission. Requires CLICKUP_API_TOKEN and CLICKUP_LIST_ID to be
 * configured (server-side only, see src/app/api/feedback/route.ts).
 */
export async function sendFeedbackToClickUp(payload: FeedbackPayload) {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!token || !listId) {
    throw new Error(
      "ClickUp ist nicht konfiguriert. CLICKUP_API_TOKEN und CLICKUP_LIST_ID setzen."
    );
  }

  const title = payload.message.length > 80 ? `${payload.message.slice(0, 77)}…` : payload.message;

  const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `💡 ${title}`,
      description: [
        payload.message,
        "",
        "---",
        `Seite: ${payload.page}`,
        `Von: ${payload.userEmail ?? "unbekannt"}`,
        `Gesendet: ${new Date().toISOString()}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ClickUp-Anfrage fehlgeschlagen (${response.status}): ${text}`);
  }

  return response.json().catch(() => ({}));
}
