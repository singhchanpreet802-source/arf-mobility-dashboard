# ARF Mobility Dashboard

Municipal traffic-monitoring dashboard for the Aneja Research Foundation (ARF), supporting the live traffic pilot at Prem Nagar Chauraha junction, Bareilly, U.P.

## Stack

- React + Vite + Tailwind CSS
- Leaflet.js (map) via `react-leaflet`
- Recharts (trend charts)
- Firebase: Firestore (database) + Authentication (email/password)
- jsPDF + jspdf-autotable (reports & printable schedules)
- Hosting: Vercel

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com
   - Enable **Authentication → Sign-in method → Email/Password**
   - Enable **Firestore Database** (start in production mode, add security rules below)

2. **Copy your Firebase web app config** into `.env.local`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Create user accounts and assign roles.** Roles are NOT self-service — ARF admins create
   accounts in Firebase Auth, then add a matching document to the Firestore `users` collection:

   - Collection: `users`
   - Document ID: the user's Firebase Auth UID
   - Fields: `{ "name": "Full Name", "role": "observer" | "official" }`

   Until the dashboard is connected to a configured Firebase project, it shows a setup screen
   with these instructions instead of crashing.

4. Install dependencies and run:

   ```
   npm install
   npm run dev
   ```

## Data model (Firestore)

- `users/{uid}` — `{ name, role }`
- `observations/{id}` — field observations for Prem Nagar Chauraha (the CS1 baseline observation
  is pre-loaded in code at `src/lib/baseline.js` and is always shown first, even before any live
  data exists; it is locked and never written to Firestore)
- `alerts/{id}` — auto-generated regression / protocol-breach / capacity alerts
- `schools/{id}` — schools registered in the School Dispersal Optimizer

## Suggested Firestore security rules (sketch)

```
match /users/{uid} {
  allow read: if request.auth != null;
  allow write: if false; // managed by ARF admins via console
}
match /observations/{id} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'observer';
  allow update, delete: if false;
}
match /alerts/{id} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'observer';
}
match /schools/{id} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'observer';
}
```

## Deploying to Vercel

```
vercel
```

Add the same `VITE_FIREBASE_*` environment variables in the Vercel project settings.
