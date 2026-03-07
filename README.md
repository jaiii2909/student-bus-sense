MERN built with vite 

## Frontend

- Run `npm run dev` from the root to start the Vite React app.

## Backend

Navigate to the `server` directory and start the Node/Express service:

```bash
cd server
node server.js
# or use nodemon if installed: npx nodemon server.js
```

### Environment

Make sure `.env` contains:

```
MONGO_URI=your-mongo-uri
PORT=5001
# Use either plain text (simple setup) or a bcrypt hash (recommended)
DRIVER_PASSWORD=driver123
# DRIVER_PASSWORD_HASH=$2b$12$...
```

### Seeding

To populate sample data (admin, routes, buses, students) run:

```bash
cd server
node seed.js
```

### API endpoints

#### Admin (`/api/admin`)

- `POST /login` – body `{username,password}` (used by admin dashboard login)
- `GET /routes` – list all routes
- `POST /routes` – body `{routeName}`
- `DELETE /routes/:id`
- `GET /buses` – list all buses
- `POST /buses` – body `{busNumber,route}`
- `DELETE /buses/:id`
- `POST /students` – body `{studentId,name,password,registeredRoutes}`
- `GET /locations` – view latest location per bus

#### Driver (`/api/driver`)

- `POST /login` – body `{password}` (common secret)
- `POST /buses/:busId/location` – body `{latitude,longitude}` (upserts latest location)

#### Student (`/api/student`)

- `POST /login` – body `{studentId,password}`
- `GET /buses` – returns locations populated with bus information

---
