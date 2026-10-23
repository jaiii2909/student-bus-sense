# Track My Bus

Real-time college bus tracking. Drivers share live GPS from their phone, and students see their bus on a map with a rough arrival time at their stop.

**Live:** https://student-bus-sense.vercel.app

**Try it as a student:** Student ID `DEMO01`, password `demo1234`.

**Stack:** React + TypeScript (Vite, Tailwind, shadcn/ui) · Node.js + Express · MongoDB · Socket.io · Google Maps

## How it works

- **Students** log in with their student ID, pick one of their registered routes and their stop, and see the live location of a bus on that route with an ETA to their stop.
- **Drivers** log in with the shared driver password, pick their route and bus, and tap *Start Sharing*. The bus shows as running until they tap *Stop*.
- **Admins** manage buses, routes (including stops, placed on a map) and students, assign routes to students, and see the live fleet map.

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
- `POST /students` – body `{studentId,name,password,registeredRoutes}`
- `PUT /students/:id/routes` – body `{registeredRoutes}`
- `GET /locations` – latest location per bus

#### Driver (`/api/driver`)

- `POST /login` – body `{password}` (common secret)
- `POST /buses/:busId/location` – body `{latitude,longitude,speedKmh?}`; marks the bus as running
- `POST /buses/:busId/stop` – marks the bus as not running

#### Student (`/api/student`)

- `POST /login` – body `{studentId,password}`
- `GET /:studentId/authorized-buses` – buses on the student's routes with their latest location, plus each route's stops

#### Live updates (Socket.io)

Connect with `{ auth: { token } }`. Students receive `busUpdate` events for buses on their own routes; admins receive all of them.

---
