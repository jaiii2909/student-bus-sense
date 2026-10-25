# Track My Bus

Real-time college bus tracking. Drivers share live GPS from their phone, and students see their bus on a map with a rough arrival time at their stop.

**Live:** https://student-bus-sense.vercel.app

**Try it as a student:** Student ID `DEMO01`, password `demo1234`.

**Stack:** React + TypeScript (Vite, Tailwind, shadcn/ui) · Node.js + Express · MongoDB · Socket.io · Google Maps

## How it works

- **Students** log in with their student ID, pick one of their registered routes and their stop, and see the live location of a bus on that route with an ETA to their stop.
- **Drivers** log in with their own username (created by the admin), pick their route and bus, and tap *Start Sharing*. The bus shows as running until they tap *Stop*. Until the first driver account exists, the old shared driver password still works.
- Every Start to Stop is saved as a **trip** (bus, route, driver, start and end time). The admin's *Drivers & Trips* tab shows them by day. A trip with no GPS for 30 minutes is ended automatically.
- **Admins** manage buses, routes (including stops, placed on a map) and students, assign routes to students, post announcements (for one route or all), reset student passwords, and see the live fleet map.
- Admins can **import students from a CSV** (`studentId,name,password,routes`, routes separated by `;`, up to 500 rows), and set an optional **pass end date**. After that date the student can't log in, and open sessions end.
- Students can turn on an alert that fires (in the app, and as a phone/browser notification when allowed) when a bus is about 5 minutes from their stop. It works while the app is open.
- The site is **installable** (Add to Home Screen) and opens like an app.
- Admins can rename or delete students, and **export** the student list and each day's trip log as CSV (passwords are never exported). The free MongoDB Atlas tier has no automatic backups, so export regularly.
- Students and admins can change their own password. When an admin resets a student's password, that student is logged out on every device.

```
Driver phone --GPS every 5s--> Express API --> MongoDB
                                    |
                                Socket.io (one room per route)
                                    |
                       Students on that route + admins
```

**ETA** is approximate: straight-line distance to the stop x 1.3 (roads are longer than a straight line), divided by the bus's GPS speed, or 25 km/h when the speed is unknown or the bus is stopped.

**Security:** JWT login per role, bcrypt passwords, login rate limiting, CORS restricted to the frontend, and students only receive buses on their own routes.

## Frontend

- Run `npm run dev` from the root to start the Vite React app.
- Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`, `VITE_SOCKET_URL` and `VITE_GOOGLE_MAPS_API_KEY`.

## Backend

Navigate to the `server` directory and start the Node/Express service:

```bash
cd server
node server.js
# or use nodemon if installed: npx nodemon server.js
```

### Environment

Copy `server/.env.example` to `server/.env`:

```
MONGO_URI=your-mongo-uri
PORT=5001
# Long random string used to sign login tokens
JWT_SECRET=change-me
# Use either plain text (simple setup) or a bcrypt hash (recommended)
DRIVER_PASSWORD=driver123
# DRIVER_PASSWORD_HASH=$2b$12$...
```

If `JWT_SECRET` is missing the server still runs, but everyone is logged out on every restart.

Optional:

- `CORS_ORIGINS` – your frontend URL(s), comma separated. Unset means any site can call the API.
- `LOGIN_MAX_FAILED_ATTEMPTS` – failed logins allowed per IP per 15 minutes (default 20).

### Tests

API tests run against a local MongoDB (a separate `busSenseTest` database that is wiped):

```bash
cd server
npm test
```

`node seed.js` refuses to run against a remote or production database unless you add `--force`, because it deletes all data first.

### Seeding

To populate sample data (admin, routes, buses, students) run:

```bash
cd server
node seed.js
```

### API endpoints

Login endpoints return a `token`. Every other endpoint needs `Authorization: Bearer <token>` for the matching role.

#### Admin (`/api/admin`)

- `POST /login` – body `{username,password}`
- `GET /routes` – list all routes
- `POST /routes` – body `{routeName}`
- `PUT /routes/:id` – body `{routeName}` (renames the route on its buses and students too)
- `PUT /routes/:id/stops` – body `{stops:[{name,lat,lng}]}` in travel order (max 50)
- `DELETE /routes/:id` – refused while buses still use the route
- `GET /buses` – list all buses
- `POST /buses` – body `{busNumber,route}`
- `PUT /buses/:id` – body with any of `{busNumber,route,status}`
- `DELETE /buses/:id`
- `GET /students` – list students
- `POST /students` – body `{studentId,name,password,registeredRoutes,accessValidUntil?}`
- `POST /students/import` – body `{students:[{row,studentId,name,password,routes}],accessValidUntil?}`; returns `{added,skipped:[{row,studentId,reason}]}`
- `PUT /students/:id/routes` – body `{registeredRoutes,accessValidUntil?,name?}` (send `null` to remove the end date)
- `DELETE /students/:id` – removes the student and ends their sessions
- `PUT /students/:id/password` – body `{newPassword}` (min 6); logs the student out everywhere
- `POST /password` – body `{currentPassword,newPassword}` (min 8), the admin's own password
- `GET /announcements` – active announcements
- `POST /announcements` – body `{message,route|null,expiresAt}` (max 280 chars, expires within 7 days)
- `DELETE /announcements/:id`
- `GET /drivers` – driver accounts
- `POST /drivers` – body `{name,username,password}`
- `PUT /drivers/:id` – body with any of `{name,active}`
- `PUT /drivers/:id/password` – body `{newPassword}`; logs the driver out everywhere
- `GET /trips?from=ISO&to=ISO` – trips started in that range (up to 31 days)
- `GET /locations` – latest location per bus

#### Driver (`/api/driver`)

- `POST /login` – body `{username,password}`; `{password}` alone is the old shared password and only works while no driver accounts exist
- `POST /buses/:busId/location` – body `{latitude,longitude,speedKmh?}`; marks the bus as running
- `POST /buses/:busId/stop` – marks the bus as not running

#### Student (`/api/student`)

- `POST /login` – body `{studentId,password}`
- `GET /:studentId/authorized-buses` – buses on the student's routes with their latest location, plus each route's stops and active announcements
- `POST /password` – body `{currentPassword,newPassword}` (min 6); returns a new `token`

#### Live updates (Socket.io)

Connect with `{ auth: { token } }`. Students receive `busUpdate` events for buses on their own routes; admins receive all of them. Students also receive `announcement` and `announcementDeleted` events for their routes and all-route messages.

---
