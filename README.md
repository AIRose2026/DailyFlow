# DailyFlow

Mobile-first Web-App für persönliches Aufgaben- und Zeitmanagement: To-dos,
wiederkehrende Aufgaben und per Flag markierte Outlook-Mails (über den
Langdock-Agenten **Judith**) an einem Ort.

Dark-Theme-UI mit neonartigem Türkis als Akzentfarbe, Glow-/Glassmorphism-
Effekten, Bottom-Tab-Navigation und Wischgesten zum Abhaken — gebaut für
iPhone/iPad.

## Tech-Stack

- **Next.js 16** (App Router, TypeScript) auf **Vercel**
- **Supabase** (Postgres, Auth, Realtime)
- **Tailwind CSS** + **framer-motion** für Micro-Interaktionen
- **Langdock-Agent Judith** für die Outlook-Integration (kein direkter
  Microsoft-Graph-Zugriff der App)

## Features (MVP)

1. **Login** (Supabase Auth, E-Mail/Passwort)
2. **Dashboard** — Heute / Überfällig, Kategorie-Filter, Wochenübersicht der
   Routinen, Hochrechnung der heute verplanten Zeit
3. **Wiederkehrende Aufgaben** — Abhaken pro Tag, geplante Dauer je Aufgabe
4. **E-Mail-Aufgaben** — Anzeige der von Judith angelegten Aufgaben inkl.
   Kontext; Spracheingabe (oder Text) eines Antwort-Prompts, der über
   `/api/judith/prompt` an Judith (Langdock-API) geschickt wird
5. Mobile-first Design, Wischgesten zum Abhaken (Dashboard-Aufgaben)

Apple-Erinnerungen-Integration ist bewusst **nicht** Teil des MVP (siehe
Projekt-Briefing) und kann später ergänzt werden.

## Loslegen

```bash
npm install
cp .env.example .env.local   # Werte eintragen, siehe unten
npm run dev
```

Die App läuft dann unter `http://localhost:3000` (leitet auf `/dashboard`
weiter; nicht angemeldete Nutzer werden zu `/login` umgeleitet).

### 1. Supabase einrichten

Siehe [`supabase/README.md`](./supabase/README.md) für Schema-Migration,
RLS-Policies und die Anbindung von Judith. Kurzfassung:

1. Supabase-Projekt anlegen.
2. `supabase/migrations/0001_init.sql` anwenden.
3. Nutzer (Henrik) unter Authentication → Users anlegen.
4. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   eintragen.

### 2. Judith / Langdock einrichten

`LANGDOCK_API_KEY` und `LANGDOCK_JUDITH_AGENT_ID` in `.env.local` (bzw. als
Vercel-Umgebungsvariablen) setzen — siehe `.env.example`. Diese Werte werden
ausschließlich serverseitig in `src/app/api/judith/prompt/route.ts`
verwendet und nie an den Client ausgeliefert.

Auf Judiths Seite (Langdock, nicht Teil dieses Repos):

- Bestehende 8:15-Uhr-Routine erweitern, damit geflaggte Outlook-Mails per
  Service-Role-Key als `tasks` (+ `email_tasks`) in Supabase angelegt werden.
- Nach Anlage eines Antwortentwurfs: Flag in Outlook entfernen und die
  zugehörige `tasks`-Zeile auf `status = 'done'` setzen (Zuordnung über
  `email_tasks.outlook_flag_id`).

### 3. Deployment (Vercel)

Repo mit einem Vercel-Projekt verknüpfen und dieselben Umgebungsvariablen
wie in `.env.example` in den Vercel-Projekteinstellungen hinterlegen. Builds
laufen automatisch über `next build`.

## Projektstruktur

```
src/
  app/                 # Next.js App Router Routen
    dashboard/         # Heute/Überfällig-Ansicht
    recurring/         # Wiederkehrende Aufgaben
    emails/            # E-Mail-Aufgaben + Judith-Prompt
    settings/          # Konto/Logout
    login/             # Auth
    api/judith/prompt/ # Server-Route → Langdock
  components/          # UI-, Task-, Recurring-, Email- und Layout-Komponenten
  lib/
    supabase/          # Client-/Server-Supabase-Clients + Typen
    hooks/             # Datenzugriff (useTasks, useRecurringTasks, useEmailTasks, …)
    judith/            # Langdock-API-Client
    auth/              # AuthProvider (Client-Context)
    utils/             # Datum/Zeit-Helfer
supabase/
  migrations/          # SQL-Schema inkl. RLS
```

## Design-System

- Dark-Theme als Basis (`bg-base-950`), neonartiges Türkis (`accent-400`,
  `#2dfbe0`) als durchgängige Akzentfarbe.
- Glow-Schatten (`shadow-glow*`) auf Buttons, aktiven Nav-Items und Karten.
- Glassmorphism (`glass-card`) für Karten und Bottom-Sheets.
- Bottom-Tab-Navigation statt Sidebar, große Touch-Ziele (min. 44px).
- Wischgesten (`SwipeableTaskCard`, framer-motion) zum Abhaken von Aufgaben
  im Dashboard, mit Glow-Reveal-Animation.

## Bekannte Einschränkungen

- Die Web-Speech-API (Spracheingabe) wird von iOS Safari nicht unterstützt;
  die Prompt-Eingabe fällt dort automatisch auf ein Textfeld zurück.
- `src/lib/supabase/types.ts` ist von Hand gepflegt und sollte nach dem
  Verlinken des Supabase-Projekts durch generierte Typen ersetzt werden
  (`supabase gen types typescript`).
