const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

interface FeedbackPayload {
  message: string;
  page: string;
  userEmail: string | null;
}

export interface FeedbackEntry {
  id: string;
  message: string;
  page: string | null;
  sentAt: string | null;
  status: string;
  url: string;
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

/**
 * Reconstructs the structured fields (message/page/from/sent) out of the
 * plain-text description sendFeedbackToClickUp() built — there's no
 * separate custom-field storage on the ClickUp side, so the description
 * itself is the only place this round-trips through.
 */
function parseFeedbackDescription(description: string) {
  const [messagePart, metaPart] = description.split("\n\n---\n");
  const meta: Record<string, string> = {};
  if (metaPart) {
    for (const line of metaPart.split("\n")) {
      const separatorIndex = line.indexOf(": ");
      if (separatorIndex === -1) continue;
      meta[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 2);
    }
  }
  return {
    message: (messagePart ?? description).trim(),
    page: meta["Seite"] ?? null,
    fromEmail: meta["Von"] ?? null,
    sentAt: meta["Gesendet"] ?? null,
  };
}

/**
 * Lists this user's own feedback submissions back out of the configured
 * ClickUp list, matched by the "Von: <email>" line each one was created
 * with — there's no local DailyFlow table for feedback, ClickUp is the
 * only store, so reading it back means asking ClickUp.
 */
export async function fetchFeedbackForEmail(email: string): Promise<FeedbackEntry[]> {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!token || !listId) {
    throw new Error(
      "ClickUp ist nicht konfiguriert. CLICKUP_API_TOKEN und CLICKUP_LIST_ID setzen."
    );
  }

  const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task?include_closed=true`, {
    headers: { Authorization: token },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ClickUp-Anfrage fehlgeschlagen (${response.status}): ${text}`);
  }

  const data = await response.json().catch(() => ({ tasks: [] }));
  const tasks: unknown[] = Array.isArray(data?.tasks) ? data.tasks : [];
  const normalizedEmail = email.trim().toLowerCase();

  return tasks
    .map((raw): (FeedbackEntry & { fromEmail: string | null }) | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const task = raw as Record<string, unknown>;
      const id = typeof task.id === "string" ? task.id : null;
      const description = typeof task.description === "string" ? task.description : "";
      const url = typeof task.url === "string" ? task.url : "";
      if (!id || !description) return null;

      const parsed = parseFeedbackDescription(description);
      const status =
        typeof task.status === "object" && task.status !== null
          ? (task.status as Record<string, unknown>).status
          : undefined;
      const dateCreated = typeof task.date_created === "string" ? task.date_created : null;

      return {
        id,
        message: parsed.message,
        page: parsed.page,
        sentAt: parsed.sentAt ?? (dateCreated ? new Date(Number(dateCreated)).toISOString() : null),
        status: typeof status === "string" ? status : "offen",
        url,
        fromEmail: parsed.fromEmail,
      };
    })
    .filter(
      (entry): entry is FeedbackEntry & { fromEmail: string | null } =>
        entry !== null && entry.fromEmail?.toLowerCase() === normalizedEmail
    )
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""))
    .map(({ fromEmail: _fromEmail, ...entry }) => entry);
}
