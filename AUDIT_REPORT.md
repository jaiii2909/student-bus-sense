# Student Bus Sense — Project Audit

**Date:** 2026-10-16 · **Scope:** the full repo (React/Vite frontend, Express/Mongo/Socket.io backend)
**Focus:** user flow, workflow and appearance. These are practical fixes, not a rewrite.

Each item has a priority:
- **P0** — broken, or the app doesn't work as promised
- **P1** — clear UX gain, small effort
- **P2** — polish

---

## 0. TL;DR — the 10 things worth doing

| # | Fix | Why | Effort |
|---|-----|-----|--------|
| 1 | Driver start/stop sets the bus `status` to active/inactive | Buses an admin adds start out **inactive** and nothing can activate them, so students can never select them | S |
| 2 | Map markers update from the socket for the **selected bus only**, and the overlay updates too | Right now the map shows **every** bus (including routes the student didn't pay for), and the info card lags by up to 15s | S |
| 3 | Add an **"Add Student"** form to the Admin dashboard | The API exists, but admins can't create students from the UI | S |
| 4 | Show admin errors in the UI (toasts) instead of only `console.error` | A duplicate bus or route fails silently and the dialog just closes | S |
| 5 | Keep admin and driver logged in after a refresh | A refresh mid-trip logs the driver out and **stops location sharing** | S |
| 6 | Fix the student empty state: "Select a route" vs "No access" | Every student sees "No Bus Access" until they pick a route | XS |
| 7 | Render `<Analytics />` (and import from `@vercel/analytics/react`) | The last commit ("analytics") imports it but never renders it, so no data is collected | XS |
| 8 | Remove or deliver the "arrival estimate" promise | The landing page, role cards and meta tags promise ETAs, but none exist | XS |
| 9 | Protect admin/driver APIs (JWT is already a dependency) | Anyone can delete buses or fake a bus location with curl | M |
| 10 | Stop committing `.env` files | The Mongo URI and Maps key are in git history | XS + rotate |

---

## 1. User flow

### 1.1 Landing → role selection (`src/pages/Index.tsx`, `RoleSelection.tsx`)

- **P1 — Most users are students, but they take 3 clicks to reach login.** "Track Your Bus" goes to role selection, then Student, then login. Point "Track Your Bus" straight to `/student-login`, and keep a smaller "Driver / Admin login" link for staff.
- **P1 — "Learn More" does nothing** (`Index.tsx:70`). Make it scroll to "How It Works" or remove it.
- **P1 — The footer has placeholder content:** `tel:+1234567890`, social links with `href="#"`, and "Bus Schedule" linking to `#`. Use real values or remove them; fake links look unfinished.
- **P2 — Dead code in `Index.tsx`:** the `showLogin`/`studentData`/`LoginForm` branch can never trigger (nothing sets `showLogin`), and it renders `LoginForm` without a `role` prop. Delete it.
- **P2 — The driver card's feature list is inaccurate** ("Route management", "Student visibility"). Use something like "Pick your bus", "One-tap live sharing".
- **P2 — The "Back to Home" label on the login form actually goes to role selection.** Rename it to "Back".

### 1.2 Student flow (`StudentLogin.tsx`, `Dashboard.tsx`, `BusMap.tsx`)

- **P0 — Wrong empty state.** `Dashboard.tsx:178` shows *"No Bus Access … contact administration"* whenever `filteredBuses` is empty, and that includes the normal case where no route is picked yet. Split it into three states:
  - no route selected → "Pick a route above"
  - route has no buses → "No buses on this route yet"
  - student has zero routes → current "No access" message
- **P1 — Auto-select when there's only one option.** If the student has 1 route, select it. If that route has 1 active bus, select it too. Most students would then land directly on the map.
- **P1 — Inactive buses can't be clicked and nothing explains why.** Show "Not running right now" on the card, or allow selection and show "Driver hasn't started".
- **P1 — On mobile, the map is below the list.** After a student taps a bus they have to scroll to see it. Call `scrollIntoView()` on the map card on selection, or put the map first on small screens.
- **P1 — Too many badges.** Each card shows Active + Authorized + Live, plus a "Verified Access" badge and a "Secure Access" info card. Keep one status badge (Live / Stale / Offline) and drop the rest.
- **P1 — The raw Mongo `_id` is shown as "Bus ID"** (`Dashboard.tsx:233`). Remove it; the bus number is enough.
- **P2 — Session is stored in `localStorage` without expiry or token.** That's fine for now, but see Security §4.

### 1.3 Driver flow (`src/pages/Driver.tsx`)

- **P0 — Stopping sharing doesn't tell the server.** Students keep seeing "Live" for 5 minutes, then "Stale", and never "Driver stopped". Add `POST /api/driver/buses/:id/stop` (or a `status` field) that sets the bus inactive. Make start set it **active**. This also fixes TL;DR #1.
- **P0 — A refresh or screen lock kills sharing.** Login lives only in React state, so a refresh means re-login and the trip stops. Persist the driver session in `localStorage` (same pattern as the student flow). Also request a **Screen Wake Lock** while sharing (`navigator.wakeLock.request('screen')`, about 5 lines) so the phone doesn't sleep.
- **P1 — Failed sends are invisible to the driver.** Errors only reach `console.error` (`Driver.tsx:133`). Show a small "Last sent: 12s ago ✓" / "Sending failed — check internet" line. This matters most on bad mobile data.
- **P1 — It posts on every GPS tick.** `watchPosition` with `maximumAge: 0` can fire every second. Throttle to about one post every 5–10 seconds to save driver data and battery and reduce server load.
- **P1 — Uses `alert()`** for geolocation errors. Use the existing toast instead, with clear guidance like "Allow location access in browser settings".
- **P2 — Drop the raw lat/long display.** Drivers don't need coordinates. A big green "You're live" state is clearer.
- **P2 — Native `<select>` elements** don't match the rest of the app. Use the shadcn `Select` that the student dashboard already uses.

### 1.4 Admin flow (`src/pages/AdminDashboard.tsx`)

- **P0 — No way to add students.** `POST /api/admin/students` exists, but there's no button. Add an "Add Student" dialog (ID, name, password, routes). Without it, onboarding requires running `seed.js`.
- **P0 — Errors are swallowed.** Every `catch` only logs to the console, and some close the dialog (`handleAddBus`, `handleAddRoute`). A duplicate bus number gives a Mongo error 500, then the dialog closes with no message. Keep the dialog open and show a toast. Server side, return `409 "Bus number already exists"` for duplicate keys.
- **P0 — Renaming or deleting a route breaks data.** Buses and students reference routes **by name string**. Renaming "Kareli" leaves buses and students pointing at the old name, so students lose access silently. The simple fix is to cascade inside `updateRoute`/`deleteRoute`:
  ```js
  await Bus.updateMany({ route: oldName }, { route: newName });
  await Student.updateMany({ registeredRoutes: oldName }, { $set: { 'registeredRoutes.$': newName } });
  ```
  For delete, block it when buses still use the route ("3 buses use this route").
- **P1 — No status control.** Add an Active/Inactive toggle in the bus table, at least until the driver flow handles status automatically.
- **P1 — The admin can't see where buses are.** `GET /api/admin/locations` already exists. A small "Live fleet" map card using the existing `MapView` would make the dashboard useful day to day.
- **P1 — Login isn't persisted, and there's no Logout button.** The "Back" button goes to `/` and leaves the admin logged in only until refresh. Add a proper Logout and persist the session.
- **P1 — Uses `window.confirm()` / `alert()`.** The project already ships `AlertDialog`; use it.
- **P2 — No search on the student table.** Fine for 10 students, painful for 500. One input that filters by ID or name is enough.

---

## 2. Workflow / logic bugs

| Pri | Where | Issue | Fix |
|-----|-------|-------|-----|
| P0 | `BusMap.tsx:65` | The socket `busUpdates` replaces `markers` with **all buses system-wide**, not just the student's route | Filter incoming buses to `props.buses` IDs, or better, to `selectedBusId` only |
| P0 | `BusMap.tsx:83-88` | The map center and info overlay read from `buses` (15s poll), not the socket, so the marker moves but the "Updated…" text and center lag behind | Keep one `liveBuses` state merged from poll + socket and derive everything from it |
| P0 | `driverController.js:73-90` | The socket payload lacks `updatedAt`, so the Live/Stale badge can't use socket data | Add `updatedAt: item.updatedAt` |
| P1 | `MapView.jsx:38` | When there are no markers, it draws a **fake bus icon** at the default center (Prayagraj) | Remove that fallback marker |
| P1 | `MapView.jsx:31` | `<LoadScript>` re-mounts with the component, which reloads the Maps script and can warn "google api already loaded" | Use `useJsApiLoader` once (from the same library) |
| P1 | `BusMap.tsx:153` | "🗺️ Live GPS Tracking Active" shows even when the location is stale | Bind it to the location state or remove it |
| P1 | `Bus.js:6` | `status` defaults to `inactive` and there's no way to change it (see TL;DR #1) | Driver start/stop or an admin toggle |
| P2 | `driverController.js:73` | Each GPS ping runs `Location.find().populate()` over the whole fleet | Emit only the one updated bus |
| P2 | `Dashboard.tsx` / `BusMap.tsx` | `getLocationState` and `formatLastUpdated` are copy-pasted in both files | Move them to `src/lib/busStatus.ts` |
| P2 | `vercel.json` missing | Refreshing on `/student-login` may 404 on Vercel | Add `{"rewrites":[{"source":"/(.*)","destination":"/"}]}` |

---

## 3. Appearance / consistency

Keep shadcn + Tailwind. These are small changes that make the app look like one product.

- **P1 — One color identity.** Today student pages are blue/green, driver is green, and admin is purple, each with its own gradient. Pick one brand primary (blue already dominates) and use role colors only as small accents (icon tint, badge). Set `--primary` in `index.css` to that blue and switch buttons from `bg-blue-600 hover:bg-blue-700` to the default `Button` variant. That removes a lot of repeated classes.
- **P1 — Shared top bar.** Student has a header, driver has none, and admin has its own. A small `<AppHeader title onLogout />` (logo, page title, logout) used on all three makes navigation predictable.
- **P1 — Hero readability.** "Track **My** Bus" uses white text on a photo background (`Index.tsx:58`), and the contrast depends on the image. Add a light overlay (`bg-white/60` or a gradient) behind the hero text, or use one solid text color.
- **P1 — Loading states.** The student dashboard has no loading indicator; it shows "No Bus Access" while the first fetch runs. Add `Skeleton` cards (already in `components/ui`). The driver fleet load has none either.
- **P2 — Mixed form controls.** Native `<select>` and checkboxes (Driver, Admin bus dialog, Admin student dialog) sit next to shadcn `Select`. Use the shadcn `Select` and `Checkbox` everywhere.
- **P2 — The 404 page** uses plain gray styling. Reuse the login card layout and a "Go home" `Button`.
- **P2 — Copyright year** is hardcoded as 2025. Use `new Date().getFullYear()`.
- **P2 — Page title** has a trailing space, `"College Bus Tracker "`. The OG tags have no image, but `twitter:card` is `summary_large_image`. Add an image or use `summary`.

---

## 4. Security & hygiene (short, but don't skip)

Not a UX item, but a deployed app can't work reliably while these are open:

- **P0 — Admin API has no auth.** `/api/admin/*` (create, delete, list students) is open to anyone who knows the URL. Login only returns `{success:true}`. Issue a JWT on login (`jsonwebtoken` is already in `server/package.json`) and add a 10-line middleware on admin and driver routes.
- **P0 — Anyone can spoof a bus location** via `POST /api/driver/buses/R1/location`. The same JWT middleware fixes this.
- **P0 — `.env` and `server/.env` are committed** (see commits `6d8e535`, `3251050`). Add them to `.gitignore`, commit a `.env.example` instead, and **rotate the Mongo password**. Also restrict the Maps key to your domain in Google Cloud.
- **P1 — `/api/student/:studentId/authorized-buses` trusts any ID in the URL.** With a JWT, read the student from the token instead.
- **P1 — Raw `err.message` is returned to clients.** Return friendly messages and log details server-side.
- **P2 — The driver password silently falls back to `driver123`** when the env var is missing (`driverController.js:25`). Fail loudly in production.

---

## 5. Cleanup (low effort, less confusion)

- Root `package.json` mixes server deps (`express`, `mongoose`, `bcrypt`, `bcryptjs`, `socket.io`, `cors`, `dotenv`) into the frontend. Remove them; `server/package.json` already has them. Having both `bcrypt` and `bcryptjs` is redundant.
- About 40 unused shadcn components in `src/components/ui` (carousel, menubar, input-otp, …). They're tree-shaken, so this is just noise; delete them when convenient.
- Two toast systems are mounted (`Toaster` + `Sonner`). Pick one.
- `MapView.jsx` is the only JS file in a TS project. Rename it to `.tsx` for type safety on marker props.
- README: add the one-line frontend `.env` keys (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `VITE_GOOGLE_MAPS_API_KEY`) and a "how the 3 roles work" paragraph.

---

## 6. Suggested order

1. **Day 1 (all quick):** TL;DR 1, 2, 6, 7, 10, plus the route-rename cascade.
2. **Day 2:** Add Student dialog, admin error toasts, persisted driver/admin login + wake lock, driver "last sent" indicator.
3. **Day 3:** JWT on admin/driver routes, shared header, one brand color, loading skeletons.
4. **Later:** admin live-fleet map, simple ETA (distance ÷ average speed is fine), student search.

What's deliberately **not** recommended: state libraries, a redesign, a microservice split, or a custom routing engine. The current stack is right for this app.
