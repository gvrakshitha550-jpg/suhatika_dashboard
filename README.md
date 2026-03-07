# Suhatika Sarees – Admin Dashboard

Admin dashboard for Suhatika Sarees with **login/signup** and views for **customers/orders** and **products** from Firebase Realtime Database.

## Features

- **Login / Sign up** – Firebase Authentication (email + password)
- **Admin-only access** – Admins are added automatically when you sign up through the dashboard. Only dashboard signups can log in; website customers cannot access the admin.
- **Overview** – Summary cards (Total Customers, Products, Orders)
- **Customers** – From `customers/{uid}/profile` (name, phone, email, createdAt) and cart items from `customers/{uid}/cart`
- **Products** – From `products/{productId}` (id, name, price, originalPrice, images[], colors[])
- **Orders** – From `customers/{uid}/orders/{orderId}` (customer, shippingAddress, items, paymentMethod, totals, etc.)
- Purple theme with sidebar layout

## Setup

### 1. Firebase Web config (required)

The file `suhatika-88625-firebase-adminsdk-fbsvc-7aab7dcf51.json` in this folder is a **service account** key (for server-side/Admin SDK). This dashboard runs in the browser and uses the **Firebase Web SDK**, so you need the **Web app config** from Firebase Console:

1. Open [Firebase Console](https://console.firebase.google.com/) → project **suhatika-88625**
2. Go to **Project settings** (gear) → **General** → **Your apps**
3. If you don’t have a web app, click **Add app** → **Web** (</>), register the app, and copy the config object.
4. Create a file `.env.local` in this folder (same level as `package.json`) with:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=suhatika-88625.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://suhatika-88625-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=suhatika-88625
VITE_FIREBASE_STORAGE_BUCKET=suhatika-88625.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Use the values from the Firebase Console config. If your Realtime Database URL is different (e.g. another region), set `VITE_FIREBASE_DATABASE_URL` to that URL.

### 2. Realtime Database structure

The dashboard expects this structure:

- **`/products/{productId}`** – id, name, price, originalPrice, images[], colors[]
- **`/customers/{uid}/profile`** – name, phone, email, createdAt
- **`/customers/{uid}/cart`** – updatedAt, items[]
- **`/customers/{uid}/orders/{orderId}`** – orderId, createdAt, status, paymentMethod, subtotal, discount, shipping, total, items[], customer { firstName, lastName, phone, email }, shippingAddress { street, city, state, zip, country }
- **`/admins`** – admin UIDs/emails (dashboard signups are added here automatically)

### 3. Database rules

In Firebase Console → Realtime Database → **Rules**, allow authenticated users to read and write so signups can add themselves to admins:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Sign up with an email and password—you will be added to admins automatically and can log in. Website customers (in `users`) cannot access the dashboard.

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build
