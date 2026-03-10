# AlBaz Customer App (Expo)

Mobile app clone of the web customer app (`apps/customer`). Same features: browse categories, stores, products, cart, checkout, orders, tracking, profile.

## Copy / labels sync

Labels (nav, sections, empty states) are synced from the shared source of truth. From **repo root**:

```bash
npm run sync:customer-copy
```

This updates `copy.json` and `copy.ts` in this app from `packages/shared/src/customer-copy.json`. It also runs automatically after `npm install` at the repo root.

## EAS Build

Run from this directory (`mobile-apps/customer-app`):

```bash
cd mobile-apps/customer-app
eas build --platform android --profile production
```

Theme and Logo are in-app (`theme/`, `components/Logo.tsx`) so the bundle does not depend on the parent `shared/` folder. Use `.easignore` to keep the upload size small.

## Setup

```bash
npm install
```

## Run

```bash
npx expo start
```

- Press `a` for Android
- Press `i` for iOS (macOS + Xcode required)

## Configuration

Edit `config/api.ts`:

- **Development**: Set `API_BASE_URL` to your local IP (e.g. `http://192.168.1.100:3000`) when testing on a physical device.
- **Production**: Uses `https://albazdelivery.vercel.app` by default.

## Auth Note

The backend uses NextAuth (cookie-based sessions). The mobile app calls `/api/auth/login` and stores the user. For `/api/orders` and other protected routes to work, the backend must accept Bearer token auth or you need to add a mobile-specific auth endpoint that returns a JWT.

## Features

- Home: Categories from API, city selector
- Category: Stores filtered by category
- Store: Products, add to cart
- Cart: View/edit items, proceed to checkout
- Checkout: Address, phone, payment, place order
- Orders: Order history
- Tracking: Live order status
- Profile: User info, logout
- Login: Email/phone + password
