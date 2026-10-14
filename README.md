# Smart Doctor Appointment System

A web application for patients to find doctors, book appointments, pay through Stripe, and communicate with doctors. The repository contains a patient website, a combined admin/doctor dashboard, an Express API, and an optional legacy FastAPI disease-prediction service.

> **Project status:** This README describes the source code in this repository. It is a development guide, not a claim that every integration has been deployed or verified in a production environment. Review the [Known limitations](#known-limitations) section before deployment.

## Contents

- [Applications and technology](#applications-and-technology)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Configuration](#configuration)
- [Run the applications](#run-the-applications)
- [Patient guide](#patient-guide)
- [Doctor guide](#doctor-guide)
- [Admin guide](#admin-guide)
- [API overview](#api-overview)
- [Data and business rules](#data-and-business-rules)
- [Optional legacy AI service](#optional-legacy-ai-service)
- [Checks](#checks)
- [Known limitations](#known-limitations)

## Applications and technology

| Part | Directory | Main technologies | Purpose |
|---|---|---|---|
| Backend API | `Backend/` | Node.js, Express, MongoDB/Mongoose, JWT | Accounts, doctor and appointment management, payments, email, chat, AI endpoint |
| Patient website | `Frontend/` | React, Vite, React Router | Doctor discovery, patient account, appointment and payment screens, AI and doctor chat |
| Admin and doctor dashboard | `Admin/` | React, Vite, React Router | Admin controls and doctor workspace |
| Legacy AI service | `DiseasePredictionAI/` | Python, FastAPI, scikit-learn assets | Older, optional prediction API; the main backend mounts Gemini chat instead |

The backend listens on port `4000` when configured accordingly. The patient Vite app is set to port `3000`; the Admin Vite app is configured for port `5174`. Both browser applications read their API origin from `VITE_BACKEND_URL` in their local Vite environment file.

## Repository layout

```text
Backend/
  app.js, server.js             Express app and HTTP/Socket.IO server
  config/                       MongoDB, Cloudinary and local environment config
  controllers/                  API business logic
  middlewares/                  Role authentication, upload and verified-email checks
  models/                       Mongoose schemas
  routes/                       User, doctor, admin, chat and AI routes
  services/                     Booking and restriction rules
  test/                         Node test files
Frontend/
  src/pages/                    Patient-facing pages
  src/components/               Shared UI, chat and AI widgets
  src/context/                  Patient session and doctor data state
Admin/
  src/pages/Admin/              Admin pages
  src/pages/Doctor/             Doctor pages
  src/context/                  Admin, doctor and shared dashboard state
DiseasePredictionAI/            Optional FastAPI service and model files
```

## Requirements

- Node.js and npm (use a current Node.js LTS release).
- MongoDB, local or hosted.
- Credentials for the integrations you intend to use: Google/Gmail SMTP app password for email, Cloudinary for uploaded images, Stripe test credentials for checkout, and a Gemini API key for the AI assistant.
- Python and pip only if you intend to run the legacy AI service.

## Local setup

1. Clone or open this repository and install dependencies in each Node app:

   ```powershell
   cd Backend
   npm install
   cd ..\Frontend
   npm install
   cd ..\Admin
   npm install
   ```

2. Copy `Backend/config/config.env.example` to `Backend/config/config.env` and fill in local values. The backend loads that config file outside `PRODUCTION`. Copy `Frontend/.env.example` to `Frontend/.env.local` and `Admin/.env.example` to `Admin/.env.local`.

3. Start MongoDB and ensure the configured connection string points to it.

4. Start the backend, patient site, and dashboard in separate terminals using the commands under [Run the applications](#run-the-applications).

5. Visit `http://localhost:3000` for the patient site and the Vite URL printed by the Admin app at `http://localhost:5174` for doctor/admin access.

The first administrator and doctor accounts must be provisioned for this system: admin login checks environment-configured credentials, and doctor login requires a doctor record (normally added by an administrator).

## Configuration

Create or update `Backend/config/config.env` locally. Keep real credentials private and never commit them. Use placeholders in shared examples and rotate credentials if they have ever been exposed.

```dotenv
PORT=4000
NODE_ENV=DEVELOPMENT
DB_LOCAL_URI=mongodb://127.0.0.1:27017/smart-doctor
DB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
JWT_SECRET=replace-with-a-long-random-secret
JWT__EXPIRES_TIME=7d
COOKIE_EXPIRES_TIME=7

FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5174

GOOGLE_APP_USER=your-sender@gmail.com
GOOGLE_APP_PASSWORD=your-google-app-password
GOOGLE_FROM_NAME=Smart Doctor
EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES=10
EMAIL_VERIFICATION_TOKEN_EXPIRY=15m

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
STRIPE_PKR_TO_USD_RATE=0.0036

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-supported-model-name
```

The repository's config also supports `AI_CHAT_API_URL`, `HELPLINE_CONTACT`, `CANCEL_APPOINTMENT_LIMIT`, booking-restriction period settings (`BOOKING_COOLDOWN_PERIOD`, `BOOKING_RESTRICTION_*`, `DEFAULT_BOOKING_RESTRICTION_DAYS`), and password-reset cooldown/token settings (`PASSWORD_RESET_COOLDOWN_*`, `DEFAULT_PASSWORD_RESET_COOLDOWN_DAYS`, `PASSWORD_RESET_TOKEN_EXPIRY_MINUTES`). Defaults and accepted values are implemented in `Backend/utils/` and `Backend/services/`; inspect those files when changing policy.

Use the local DB variable for local development; the production connection selection is implemented in `Backend/config/mongodb.js`. Set `CORS_ORIGINS` to the exact browser origins you use. Stripe checkout return URLs use `FRONTEND_URL`. Configure a Stripe webhook endpoint at `/api/stripe/webhook` if relying on webhook events.

> Do not copy secrets from an existing local config into documentation, screenshots, commits, or issue trackers. The backend config file is part of the repository tree; check repository history and rotate any credentials that may have been committed.

## Run the applications

Run each command from the named directory in a separate terminal.

### Backend

```powershell
cd Backend
npm run server
```

`npm start` runs `node server.js`. The `npm run dev` script uses Windows `SET` syntax; `npm run server` is the simpler development command and starts Nodemon.

### Patient website

```powershell
cd Frontend
npm run dev
```

Vite serves this app on port `3000`.

### Admin and doctor dashboard

```powershell
cd Admin
npm run dev
```

Vite serves this app on port `5174`.

## Patient guide

### 1. Create an account

1. Open the patient website and choose the registration flow from the login screen.
2. Submit an email to `POST /api/user/send-verification-code`. The server checks the address and whether it is already registered, stores a time-limited code, and sends it by email.
3. Enter the code; the site calls `POST /api/user/verify-email-code`. A valid code returns a short-lived verification token.
4. Submit name, email, and password to `POST /api/user/register` with the verification token. The route's `requireVerifiedEmail` middleware checks the token/email verification; the controller validates fields, hashes the password, creates the account, and returns a login token.

### 2. Sign in and manage a profile

Sign in through `POST /api/user/login`. Authenticated requests send the patient token in the `token` header. The profile screen reads `GET /api/user/get-profile` and updates through `POST /api/user/update-profile` (an optional image is uploaded as multipart form data).

### 3. Find a doctor and book

1. Browse the public doctor list (`GET /api/doctor/list`) and open a doctor profile.
2. Select a date and time shown as available by the site.
3. Submit the selection to `POST /api/user/validate-booking`. The server checks required data, doctor availability, slot occupancy, existing active appointments, and the patient's applicable restrictions/cooldown.
4. Start payment using `POST /api/user/stripe/create-deposit-session`. The server checks eligibility again and creates a Stripe Checkout session for the deposit.
5. Complete payment on Stripe. On return to the patient site, the site submits the session ID to `POST /api/user/stripe/verify-session`. A verified deposit finalizes the appointment and reserves the slot. The backend also creates the appointment chat conversation and records the booking.

The configured deposit and balance calculations live in `Backend/services/appointmentBookingService.js`. Check this service and the Stripe controller if payment percentages or currency conversion change.

### 4. View, pay, or cancel an appointment

- View appointments at `GET /api/user/appointments`.
- If a balance remains, request a balance checkout with `POST /api/user/stripe/create-balance-session`, then verify the returned session with `POST /api/user/stripe/verify-session`.
- Cancel through `POST /api/user/cancle-appointment` (the route is spelled `cancle` in the current code). Cancellation releases the slot and updates cancellation-related account data; the linked chat conversation is removed by appointment cleanup logic.

### 5. Chat and password recovery

The chat screen lists conversations, loads messages, sends messages, and supports conversation/message deletion and clearing. It uses the shared `/api/chat` routes and patient token. Password recovery starts at `POST /api/user/forgot-password`, validates a link through `GET /api/user/validate-reset-token`, and saves a new password through `POST /api/user/reset-password`. Reset email delivery requires SMTP configuration.

The Gemini assistant is available through `POST /api/gemini-ai/chat`; it depends on `GEMINI_API_KEY` and `GEMINI_MODEL`.

## Doctor guide

Doctors use the doctor mode of the Admin application. There is no public doctor registration route in the current API; an admin adds doctor accounts.

1. Sign in with the provisioned doctor email/password through `POST /api/doctor/login`.
2. The dashboard sends the returned doctor token as `dToken` in request headers.
3. Use the dashboard to view metrics (`GET /api/doctor/dashboard`) and assigned appointments (`GET /api/doctor/appointments`).
4. Mark an appointment complete with `POST /api/doctor/complete-appointment`, or cancel it with `POST /api/doctor/cancel-appointment`. Cancellation releases the slot and removes the appointment chat thread according to backend cleanup logic.
5. Read and update doctor profile details through `GET /api/doctor/profile` and `POST /api/doctor/update-profile`.
6. Use the chat page to message patients associated with conversations.

## Admin guide

Admin screens are in the same Vite app as doctor screens. Sign in with the credentials configured by `ADMIN_EMAIL` and `ADMIN_PASSWORD`; the backend returns an admin token used as `aToken` for protected routes.

- **Dashboard:** summary counts and recent appointment information (`GET /api/admin/dashboard`).
- **Doctors:** add with `POST /api/admin/add-doctor` (multipart image and doctor fields), list with `GET /api/admin/all-doctors`, toggle availability with `POST /api/admin/change-availability`, edit with `POST /api/admin/update-doctor`, or delete with `POST /api/admin/delete-doctor`.
- **Appointments:** review using `GET /api/admin/appointments`; cancel using `POST /api/admin/cancel-appointment`.
- **Patients:** list using `GET /api/admin/all-users`; adjust account status using `POST /api/admin/update-account-status` (supported values are `green`, `warning`, `restricted`, `blocked`); delete with `POST /api/admin/delete-user`.
- **Booking restrictions:** apply a restriction with `POST /api/admin/apply-booking-restriction`, lift it with `POST /api/admin/lift-booking-restriction`, or inspect one using `GET /api/admin/user-booking-restriction/:userId`.
- **Payments:** inspect payment records using `GET /api/admin/all-payments`.

Deleting a patient is a cascading operation in the controller. Review its implementation and retention requirements before using it on real data.

## API overview

All routes are mounted below `http://localhost:4000` by default. Most API responses use JSON and indicate success with a `success` property. Protected requests use role-specific headers: `token` (patient), `dToken` (doctor), or `aToken` (admin). Chat accepts either patient or doctor authentication.

| Prefix | Main use | Access |
|---|---|---|
| `/api/user` | Registration, login, profile, bookings, payments, reset | Mixed public and patient-authenticated |
| `/api/doctor` | Public doctor list/details, doctor login and workspace | Mixed public and doctor-authenticated |
| `/api/admin` | Doctor, patient, appointment, restriction and payment management | Admin-authenticated except login |
| `/api/chat` | Conversations and messages | Patient or doctor authenticated |
| `/api/gemini-ai` | Gemini assistant | Public route in current router |
| `/api/stripe/webhook` | Stripe webhook receiver | Stripe signature verification |

For exact request fields and validation responses, see the corresponding route and controller files in `Backend/routes/` and `Backend/controllers/`.

## Data and business rules

Mongoose models include users, doctors, appointments, payments, email verifications, password resets, conversations, and messages. Important rules implemented across the controllers and services include:

- Email verification is required before patient registration.
- A patient can be prevented from booking by an active appointment, unavailable/occupied slot, account status, admin restriction, or configured booking cooldown.
- Deposit payment is verified before appointment finalization; the remaining balance has its own checkout flow.
- Patient cancellation history can change account status according to configured policy.
- Admin booking restrictions are tracked separately from cancellation status and booking cooldown.
- Booking creates a patient-doctor conversation; appointment cancellation/deletion runs chat cleanup.

These are server-side rules; the available slot display in the browser is not authoritative. The server performs the final booking checks.

## Optional legacy AI service

The active Express app mounts the Gemini endpoint. `DiseasePredictionAI/app.py`, its pickle files, and `Backend/routes/aiChatRoutes.js` are a separate older path and are not mounted by `Backend/app.js` by default. Treat the FastAPI service as optional/legacy unless you deliberately wire it into the application.

## Checks

Available package scripts:

```powershell
# Frontend and Admin
npm run build
npm run lint

# Backend (Node test runner in watch mode)
npm test
```

Run frontend commands separately from `Frontend/` and `Admin/`, and the backend test command from `Backend/`. This README was prepared by inspecting source files and package scripts; those build, lint, and runtime checks were not run as part of writing it.

## Known limitations

- The browser apps require `VITE_BACKEND_URL` in their Vite environment files; set it to the deployed API origin before building. Never put server credentials in Vite variables because they are exposed to the browser.
- `Backend/config/config.env` is a local-only file and is ignored by Git. Keep production secrets out of Git, review repository history, and rotate credentials if real values were committed.
- The server's Socket.IO events use `addUser`, `sendMessage`, and `getMessage`. The browser chat implementation should be checked against those event names; REST chat APIs are separately present. Do not assume realtime delivery works until the names and server wiring have been tested together.
- The patient cancellation path retains the misspelled endpoint `/api/user/cancle-appointment`; clients currently need to use that exact route unless it is corrected in both server and frontend.
- Admin authentication uses configured shared credentials rather than a database-backed admin account system.
- The optional FastAPI prediction service is not connected to the active Express route setup by default.
- The backend `dev` script uses Windows command syntax. On other operating systems, use `npm run server` or update the script.

Before a production deployment, configure TLS, secure and rotate secrets, review authorization and data retention, set allowed CORS origins, configure Stripe webhook verification, and validate the payment, email, upload, and chat flows in the target environment.
