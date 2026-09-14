import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { hashApiToken } from "@/lib/tokens/apiTokens";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * DailyFlow's MCP server — lets a Langdock agent (or any other MCP client)
 * decide for itself when to create a task, a routine, or a flagged-email
 * task, instead of a fixed Langdock automation having to hardcode which
 * fields go where. Auth reuses the exact same personal API tokens as
 * /api/ingest/* (Settings → "API-Token für Langdock") — this is really the
 * same capability, offered through a second, agent-friendly protocol
 * alongside the plain REST routes.
 */
function userIdFrom(authInfo: { extra?: Record<string, unknown> } | undefined) {
  const userId = authInfo?.extra?.userId;
  return typeof userId === "string" ? userId : null;
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "create_task",
      {
        title: "Aufgabe anlegen",
        description:
          "Legt eine einmalige Aufgabe (To-do) in DailyFlow an. Ohne due_date gilt sie nur heute als 'Heute' und wird ab morgen automatisch überfällig, bis sie erledigt wird.",
        inputSchema: z.object({
          title: z.string().min(1).describe("Titel der Aufgabe"),
          description: z.string().optional().describe("Optionale Notiz/Beschreibung"),
          category: z.string().optional().describe("Optionale Kategorie, z. B. 'Vertrieb'"),
          due_date: z
            .string()
            .optional()
            .describe("Optionales Fälligkeitsdatum im Format YYYY-MM-DD"),
        }),
      },
      async ({ title, description, category, due_date }, ctx) => {
        const userId = userIdFrom(ctx.http?.authInfo);
        if (!userId) {
          return { content: [{ type: "text", text: "Nicht authentifiziert." }], isError: true };
        }

        const supabase = createServiceClient();
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title,
            description: description ?? null,
            category: category ?? null,
            due_date: due_date ?? null,
            status: "open",
            source: "manual",
          })
          .select("id")
          .single();

        if (error || !data) {
          return {
            content: [{ type: "text", text: `Fehler: ${error?.message ?? "unbekannt"}` }],
            isError: true,
          };
        }

        return { content: [{ type: "text", text: `Aufgabe "${title}" angelegt.` }] };
      }
    );

    server.registerTool(
      "create_recurring_task",
      {
        title: "Routine anlegen",
        description:
          "Legt eine wiederkehrende Routine in DailyFlow an — täglich oder nur an bestimmten Wochentagen.",
        inputSchema: z.object({
          title: z.string().min(1).describe("Titel der Routine"),
          category: z.string().optional().describe("Optionale Kategorie"),
          estimated_minutes: z
            .number()
            .min(0)
            .optional()
            .describe("Geplante Dauer in Minuten, Standard 15"),
          weekdays: z
            .array(z.number().min(1).max(7))
            .optional()
            .describe(
              "ISO-Wochentage, an denen die Routine gilt: 1=Montag .. 7=Sonntag. Weglassen oder leeres Array = jeden Tag."
            ),
        }),
      },
      async ({ title, category, estimated_minutes, weekdays }, ctx) => {
        const userId = userIdFrom(ctx.http?.authInfo);
        if (!userId) {
          return { content: [{ type: "text", text: "Nicht authentifiziert." }], isError: true };
        }

        const supabase = createServiceClient();
        const { data, error } = await supabase
          .from("recurring_tasks")
          .insert({
            user_id: userId,
            title,
            category: category ?? null,
            estimated_minutes: estimated_minutes ?? 15,
            weekdays: weekdays ?? [],
            active: true,
          })
          .select("id")
          .single();

        if (error || !data) {
          return {
            content: [{ type: "text", text: `Fehler: ${error?.message ?? "unbekannt"}` }],
            isError: true,
          };
        }

        return { content: [{ type: "text", text: `Routine "${title}" angelegt.` }] };
      }
    );

    server.registerTool(
      "create_email_task",
      {
        title: "E-Mail-Aufgabe anlegen",
        description:
          "Legt eine Aufgabe aus einer geflaggten E-Mail an (voller Judith-Workflow) — für ein eigenes, per Outlook-Flag ausgelöstes Automatisierungsszenario, nicht für einfache To-dos.",
        inputSchema: z.object({
          subject: z.string().min(1).describe("Betreff der E-Mail"),
          sender: z.string().min(1).describe("Absender der E-Mail"),
          preview: z.string().optional().describe("Kurzer Vorschautext der E-Mail"),
          outlook_flag_id: z
            .string()
            .optional()
            .describe("ID des Outlook-Flags, zur späteren Zuordnung beim Abschließen"),
        }),
      },
      async ({ subject, sender, preview, outlook_flag_id }, ctx) => {
        const userId = userIdFrom(ctx.http?.authInfo);
        if (!userId) {
          return { content: [{ type: "text", text: "Nicht authentifiziert." }], isError: true };
        }

        const supabase = createServiceClient();
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title: subject,
            status: "open",
            source: "email",
          })
          .select("id")
          .single();

        if (taskError || !task) {
          return {
            content: [
              { type: "text", text: `Fehler: ${taskError?.message ?? "unbekannt"}` },
            ],
            isError: true,
          };
        }

        const { error: emailTaskError } = await supabase.from("email_tasks").insert({
          task_id: task.id,
          email_subject: subject,
          email_sender: sender,
          email_preview: preview ?? null,
          outlook_flag_id: outlook_flag_id ?? null,
        });

        if (emailTaskError) {
          return {
            content: [{ type: "text", text: `Fehler: ${emailTaskError.message}` }],
            isError: true,
          };
        }

        return { content: [{ type: "text", text: `E-Mail-Aufgabe "${subject}" angelegt.` }] };
      }
    );

    server.registerTool(
      "complete_email_task",
      {
        title: "E-Mail-Aufgabe abschließen",
        description:
          "Markiert die zu einer outlook_flag_id gehörende E-Mail-Aufgabe als erledigt, z. B. nachdem ein Antwortentwurf erstellt und das Flag entfernt wurde.",
        inputSchema: z.object({
          outlook_flag_id: z.string().min(1),
        }),
      },
      async ({ outlook_flag_id }, ctx) => {
        const userId = userIdFrom(ctx.http?.authInfo);
        if (!userId) {
          return { content: [{ type: "text", text: "Nicht authentifiziert." }], isError: true };
        }

        const supabase = createServiceClient();
        const { data: emailTask } = await supabase
          .from("email_tasks")
          .select("id, task_id")
          .eq("outlook_flag_id", outlook_flag_id)
          .maybeSingle();

        if (!emailTask) {
          return {
            content: [{ type: "text", text: "E-Mail-Aufgabe nicht gefunden." }],
            isError: true,
          };
        }

        const { data: updatedTask } = await supabase
          .from("tasks")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .eq("id", emailTask.task_id)
          .eq("user_id", userId)
          .select("id")
          .maybeSingle();

        if (!updatedTask) {
          return {
            content: [{ type: "text", text: "Nicht gefunden oder kein Zugriff." }],
            isError: true,
          };
        }

        await supabase.from("email_tasks").update({ responded: true }).eq("id", emailTask.id);

        return { content: [{ type: "text", text: "Als erledigt markiert." }] };
      }
    );
  },
  { serverInfo: { name: "dailyflow", version: "1.0.0" } }
);

const authenticatedHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined;

    const supabase = createServiceClient();
    const { data } = await supabase
      .from("api_tokens")
      .select("id, user_id")
      .eq("token_hash", hashApiToken(bearerToken))
      .maybeSingle();

    if (!data) return undefined;

    // Bookkeeping only — don't let a failure here block the actual request.
    void supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return {
      token: bearerToken,
      clientId: data.user_id,
      scopes: [],
      extra: { userId: data.user_id },
    };
  },
  { required: true }
);

export { authenticatedHandler as DELETE, authenticatedHandler as GET, authenticatedHandler as POST };
