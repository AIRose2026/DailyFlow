# Backlog

Ideen, die bewusst noch nicht umgesetzt sind.

## Push-Benachrichtigungen

PWAs können Push-Notifications senden — auch auf iOS (ab 16.4, für zum
Home-Bildschirm hinzugefügte Apps, was bei DailyFlow bereits der Fall ist).

Würde z. B. ermöglichen:
- "3 Aufgaben sind heute fällig"
- "Routine X ist noch offen"
- Tägliche Zusammenfassung morgens
- Erinnerung bei neu überfälligen Aufgaben

Braucht:
1. Service Worker (aktuell noch keiner vorhanden)
2. Nutzer-Erlaubnis (Permission-Dialog, kein automatisches Opt-in)
3. VAPID-Schlüsselpaar
4. Neue Supabase-Tabelle für Push-Subscriptions pro Nutzer/Gerät
5. Ein Sende-Trigger (z. B. Vercel Cron oder Supabase Edge Function), der
   fällige/überfällige Aufgaben prüft und die Push-Nachricht auslöst

Dazu passend, deutlich einfacher: die **Badging API** (ebenfalls ab iOS
16.4) für eine kleine Zahl direkt auf dem App-Icon (z. B. Anzahl offener
Aufgaben) — unabhängig von echten Push-Notifications.
