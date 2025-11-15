# ALBAZ Delivery Mobile Apps

Complete mobile application suite for ALBAZ Delivery service, including Customer, Vendor, and Driver apps.

## 🎨 Design System

### Color Palette
- **White**: `#FFFFFF` - Primary background and surface colors
- **Green**: `#22C55E` (Primary) - Main brand color, buttons, and highlights
- **Beige**: `#C4AFA0` (Secondary) - Accent colors, borders, and subtle backgrounds

### Theme
All apps share a consistent design system located in `shared/theme/colors.ts`:
- Consistent spacing, typography, and border radius
- Unified shadow system
- Semantic color tokens

## 📱 Apps

### 1. Customer App (`customer-app/`)
**Home Screen Features:**
- Header with logo and navigation icons
- Search bar for food, groceries, and shops
- Category icons (Food, Groceries, Pharmacy, Courier)
- Promotional banner with "FREE DELIVERY" offer
- Featured vendors section
- Bottom navigation (Home, Orders, Wallet, Profile)

**Run:**
```bash
cd mobile-apps/customer-app
npm install
npm start
```

### 2. Vendor App (`vendor-app/`)
**Dashboard Screen Features:**
- Today's orders summary with count and earnings (DZD)
- Weekly earnings graph visualization
- "Manage Menu" action button
- Active orders list with customer details
- Bottom navigation (Home, Orders, Wallet, Profile)

**Run:**
```bash
cd mobile-apps/vendor-app
npm install
npm start
```

### 3. Driver App (`driver-app/`)
**Active Delivery Screen Features:**
- Map view with delivery route visualization
- Current location indicator
- Destination pin marker
- Active delivery details card (address, estimated time)
- Accept button for delivery confirmation
- Bottom navigation (Home, Orders, Wallet, Profile)

**Run:**
```bash
cd mobile-apps/driver-app
npm install
npm start
```

## 📁 Project Structure

```
mobile-apps/
├── shared/
│   ├── theme/
│   │   ├── colors.ts          # Color palette and design tokens
│   │   └── index.ts
│   └── components/
│       ├── Logo.tsx           # ALBAZ logo component
│       ├── BottomNavigation.tsx  # Shared bottom nav bar
│       └── index.ts
├── customer-app/
│   ├── screens/
│   │   └── HomeScreen.tsx     # Customer home screen
│   ├── App.tsx
│   ├── package.json
│   └── app.json
├── vendor-app/
│   ├── screens/
│   │   └── DashboardScreen.tsx  # Vendor dashboard
│   ├── App.tsx
│   ├── package.json
│   └── app.json
└── driver-app/
    ├── screens/
    │   └── ActiveDeliveryScreen.tsx  # Driver delivery screen
    ├── App.tsx
    ├── package.json
    └── app.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. **Install dependencies for each app:**
   ```bash
   cd mobile-apps/customer-app && npm install
   cd ../vendor-app && npm install
   cd ../driver-app && npm install
   ```

2. **Start development server:**
   ```bash
   # For customer app
   cd mobile-apps/customer-app
   npm start
   
   # Scan QR code with Expo Go app
   ```

## 🎯 Features

### Shared Components
- **Logo**: Stylized bird logo with ALBAZ text
- **BottomNavigation**: Consistent navigation bar across all apps
- **Theme System**: Centralized colors, spacing, typography

### Screen Components
Each app includes fully styled screens matching the design specifications:
- Responsive layouts
- Consistent color scheme (white, green, beige)
- Modern UI with shadows and rounded corners
- Touch-friendly interactive elements

## 📝 Notes

- All apps use React Native with Expo
- TypeScript for type safety
- Shared theme ensures design consistency
- Ready for integration with backend APIs
- Maps visualization in driver app (can be enhanced with react-native-maps)

## 🔄 Next Steps

1. **Connect to Backend**: Integrate API services
2. **Add Navigation**: Implement React Navigation for multi-screen flows
3. **Add Maps**: Integrate react-native-maps for real map functionality
4. **State Management**: Add Zustand stores for app state
5. **Authentication**: Implement login/signup screens
6. **Real-time Updates**: Add WebSocket support for live order tracking

