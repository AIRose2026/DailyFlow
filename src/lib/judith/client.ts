const LANGDOCK_API_BASE = process.env.LANGDOCK_API_BASE_URL ?? "https://api.langdock.com";

interface JudithPromptPayload {
  outlookFlagId: string | null;
  subject: string;
  sender: string;
  preview: string | null;
  prompt: string;
}

/**
 * Calls the Langdock Judith agent with the mail context and the user's
 * spoken/typed reply instruction. Judith creates a draft reply in Outlook,
 * removes the flag, and (via its own scheduled sync / webhook) marks the
 * matching DailyFlow task as done.
 *
 * Requires LANGDOCK_API_KEY and LANGDOCK_JUDITH_AGENT_ID to be configured.
 */
export async function sendPromptToJudith(payload: JudithPromptPayload) {
  const apiKey = process.env.LANGDOCK_API_KEY;
  const agentId = process.env.LANGDOCK_JUDITH_AGENT_ID;

  if (!apiKey || !agentId) {
    throw new Error(
      "Langdock ist nicht konfiguriert. LANGDOCK_API_KEY und LANGDOCK_JUDITH_AGENT_ID setzen."
    );
  }

  const response = await fetch(`${LANGDOCK_API_BASE}/agent/${agentId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        instruction: payload.prompt,
        email: {
          outlookFlagId: payload.outlookFlagId,
          subject: payload.subject,
          sender: payload.sender,
          preview: payload.preview,
        },
        action: "draft_reply",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Langdock-Anfrage fehlgeschlagen (${response.status}): ${text}`);
  }

  return response.json().catch(() => ({}));
}
