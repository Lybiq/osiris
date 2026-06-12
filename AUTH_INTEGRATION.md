# OSIRIS — Auth, User Management & Map Views (portiert aus dem Legacy-GIM-Projekt)

Diese Erweiterung bringt drei Funktionsblöcke aus dem alten PHP-Projekt (`api.php` +
`index.html`) in die Next.js-App — neu implementiert in TypeScript, ohne neue
npm-Dependencies (nur Node `crypto`).

## 1. Login-Page + Auth-Gate
- `src/lib/auth.ts` — JWT (HS256), Passwort-Hashing (scrypt), dateibasierter User-Store.
- `src/app/api/auth/login/route.ts` — `POST /api/auth/login`
- `src/app/api/auth/verify/route.ts` — `GET /api/auth/verify`
- `src/lib/authClient.tsx` — React-Context (`useAuth`, `authFetch`), Token im `localStorage`.
- `src/components/LoginScreen.tsx` — Login-Overlay im OSIRIS-Theme.
- `src/components/AuthGate.tsx` — umschließt die App in `layout.tsx`; zeigt den Login,
  bis ein gültiges Token vorliegt.

## 2. User Management (Admin)
- `src/app/api/users/route.ts` — `GET` (Liste, Admin) / `POST` (anlegen, Admin)
- `src/app/api/users/[username]/route.ts` — `DELETE`, `PATCH` (Passwort/Rolle/Umbenennen)
- `src/components/UserManagementPanel.tsx` — Admin-Modal (anlegen, löschen, Rolle
  toggeln, Passwort zurücksetzen). Aufruf über das Users-Icon oben rechts (nur Admins).

Server-seitig identische Schutzlogik wie im PHP-Original: `requireAuth` + Admin-Check
direkt im Route-Handler.

## 3. Verschiedene Kartenansichten
- `src/lib/basemaps.ts` — Katalog (Dark, Satellit, Street, Terrain — ESRI, Google,
  OSM, OpenTopoMap, CARTO, USGS).
- `src/components/BasemapSwitcher.tsx` — gruppiertes Auswahl-Panel.
- `OsirisMap.tsx` — Style-Switch nimmt jetzt eine beliebige Raster-XYZ-URL statt nur
  hartkodiertem Satellit. `'dark'` = die bestehende CARTO-Vektor-Basis.
- Button unten links ("MAP VIEWS") öffnet den Switcher.

## Wichtig: Persistenz (Docker)
`users.json` und `secret.key` liegen unter `OSIRIS_DATA_DIR` (Default: `./data` →
im Container `/app/data`). Ohne Volume gehen User & Secret bei jedem Rebuild verloren.

In `docker-compose.yml` beim `osiris`-Service ergänzen:

```yaml
    environment:
      - OSIRIS_DATA_DIR=/app/data
    volumes:
      - ./data:/app/data
```

Der Container läuft als User `nextjs` (uid 1001) — der Host-Ordner muss beschreibbar
sein, z. B. `mkdir -p data && sudo chown 1001:1001 data`.

## Erststart
Wenn keine `users.json` existiert, wird automatisch ein Admin angelegt:
**admin / admin** (bzw. `OSIRIS_ADMIN_PASSWORD`). Direkt nach dem ersten Login über
User Management ändern.

## Hinweis zur Reichweite des Logins
Der Login schützt — wie im alten Projekt — das UI (Client-Gate). Die öffentlichen
Daten-Feeds (`/api/flights`, `/api/cctv`, …) bleiben unverändert offen. Nur
`/api/auth/*` und `/api/users/*` sind server-seitig token-/rollengeschützt. Sollen die
Daten-Routes ebenfalls hinter Login, kann `requireAuth` dort analog ergänzt werden.
