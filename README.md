## Medi-Connect

Medi-Connect is a full-stack healthcare mobile application built with **Expo (React Native) + Expo Router** and a **Node.js/Express + MongoDB** backend. It supports two roles—**Patient** and **Doctor**—with appointments, chat (real-time via Socket.IO), notifications, reports, prescriptions, and profile management.

### Key features

- **Authentication & roles**
  - Doctor & patient registration/login
  - JWT-based authentication
  - Password reset flow via email
- **Appointments**
  - Browse doctors and view availability
  - Book, reschedule, cancel, and complete appointments
  - Email notifications for appointment events
- **Chat**
  - Real-time messaging using Socket.IO
  - Typing indicators and read receipts
- **Medical records**
  - Reports upload/view (PDF support in app)
  - Notes and prescriptions
- **Dashboards & analytics**
  - Role-based dashboards
  - Doctor analytics screens (UI + backend endpoints present)

### Tech stack

- **Mobile app**: Expo SDK 53, React Native, TypeScript, Expo Router, Axios, AsyncStorage
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO, Nodemailer, Multer

### Repository layout

- **`app/`**: Expo Router screens (file-based routing)
  - **`app/startup/`**: onboarding/signin/signup/forgot-password flow
  - **`app/patient/`**: patient dashboard, appointments, chat, reports, receipts, profile
  - **`app/doctor/`**: doctor dashboard, calendar, patients, chat, analytics, feedback, profile
- **`services/`**: frontend API clients (Axios) + chat client (Socket.IO)
- **`backend/`**: Express API + MongoDB models + Socket.IO server

### Prerequisites

- **Node.js** (LTS recommended)
- **MongoDB** (local or hosted, e.g. MongoDB Atlas)
- **Android Studio emulator** (recommended for local dev) or a physical device
- (Optional) **Expo Application Services (EAS)** if you plan to build distributables

## Quick start (recommended)

### 1) Backend setup

From `backend/`:

```bash
cd backend
npm install
```

Create `backend/.env` with at least:

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mediconnect
JWT_SECRET=change-me

# Optional but used by forgot-password + appointment emails
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

Start the backend:

```bash
npm run dev
```

The API will be available at:

- `http://localhost:5000/` (health message)
- `http://localhost:5000/api/*` (API routes)

### 2) Mobile app setup

From the repo root:

```bash
npm install
npm run start
```

Then run on your preferred target:

```bash
npm run android
# or
npm run ios
# or
npm run web
```

## API base URLs (important)

The frontend currently targets the backend using **Android emulator loopback**:

- REST API base URL: `http://10.0.2.2:5000/api` (see `services/api.js`)
- Socket.IO URL: `http://10.0.2.2:5000` (see `services/chatService.ts`)

### If you are using a physical device

Replace `10.0.2.2` with your machine’s **LAN IP** (example `192.168.1.50`) in:

- `services/api.js`
- `services/chatService.ts`

Your phone and your dev machine must be on the same network, and port `5000` must be reachable.

### If you are using the iOS simulator

You can usually use `http://localhost:5000` instead of `10.0.2.2`.

## Available scripts

### Mobile app (root `package.json`)

- **`npm run start`**: start Expo dev server
- **`npm run android`**: start + open Android
- **`npm run ios`**: start + open iOS
- **`npm run web`**: start web target
- **`npm run lint`**: run Expo lint

### Backend (`backend/package.json`)

- **`npm run dev`**: start with nodemon
- **`npm run start`**: start with node

## Backend API overview (route groups)

The backend mounts these route groups under `/api`:

- **`/api/auth`**: registration/login/token validation/password reset
- **`/api/dashboard`**, **`/api/analytics`**
- **`/api/appointments`**
- **`/api/feedback`**
- **`/api/prescriptions`**
- **`/api/details`**
- **`/api/notes`**
- **`/api/reports`**
- **`/api/chats`**

## File uploads

Reports are uploaded on the backend and stored under `backend/src/uploads/` (see backend report routes + Multer usage). If you deploy the backend, ensure the upload directory is writable and consider using object storage (S3/GCS) for production.

## Security notes

- **Do not commit secrets**: ensure `backend/.env` and any credentials files (for example `backend/src/services/credentials.json`) are excluded from version control for real deployments.
- **JWT secret**: set a strong `JWT_SECRET` in production.

## Troubleshooting

### Mobile app can’t reach the backend

- Android emulator: use `10.0.2.2` (not `localhost`)
- Physical device: use your LAN IP and ensure both devices are on the same network
- Confirm the backend is running on port `5000`

### Socket.IO connects but messages don’t update

- Confirm `JWT_SECRET` is set and the token is valid
- Ensure the socket URL matches the same host as your API URL

## License

Add your license here (e.g. MIT) or remove this section if not applicable.
