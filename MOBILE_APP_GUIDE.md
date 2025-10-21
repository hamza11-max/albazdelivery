# 📱 Mobile App Development Guide - AL-baz Delivery

Complete guide to build native Android and iOS apps for customers and drivers.

---

## 🎯 **Overview**

We'll create **2 mobile apps**:
1. **Customer App** - Order food, track delivery, manage account
2. **Driver App** - Accept orders, navigate, update status, earnings

**Technology Stack:**
- **Expo** - React Native framework (easiest setup)
- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **React Query** - API state management
- **Zustand** - Local state management
- **Maps** - React Native Maps

---

## 📊 **Architecture**

```
albazdelivery/
├── app/                    # Next.js web app (existing)
├── mobile-apps/           # New mobile apps directory
│   ├── customer-app/      # Customer mobile app
│   │   ├── app/          # Expo Router pages
│   │   ├── components/   # Shared components
│   │   ├── services/     # API calls
│   │   ├── stores/       # State management
│   │   └── assets/       # Images, fonts
│   └── driver-app/       # Driver mobile app
│       ├── app/
│       ├── components/
│       ├── services/
│       ├── stores/
│       └── assets/
└── shared/               # Shared between web and mobile
    ├── types/            # TypeScript types
    ├── constants/        # Constants
    └── utils/            # Utilities
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ ✅ (already have)
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Expo CLI

### **Setup in 5 Steps**

```powershell
# 1. Install Expo CLI globally
npm install -g expo-cli eas-cli

# 2. Create mobile apps directory
cd e:\nn\albazdelivery
mkdir mobile-apps
cd mobile-apps

# 3. Create Customer App
npx create-expo-app@latest customer-app -t tabs
cd customer-app
pnpm install

# 4. Create Driver App
cd ..
npx create-expo-app@latest driver-app -t tabs
cd driver-app
pnpm install

# 5. Run on your phone or emulator
cd ../customer-app
pnpm start
# Scan QR code with Expo Go app
```

---

## 📱 **Option 1: Expo (Recommended)**

### **Pros**
- ✅ Fastest development
- ✅ Easy testing (Expo Go app)
- ✅ OTA updates
- ✅ Built-in features
- ✅ Great documentation

### **Cons**
- ❌ Slightly larger app size
- ❌ Some native modules not supported (rare)

### **When to Use**
- ✅ You want fastest development
- ✅ You need quick iterations
- ✅ You want easy setup

---

## 📱 **Option 2: React Native CLI**

### **Pros**
- ✅ Smaller app size
- ✅ Full native control
- ✅ All native modules supported

### **Cons**
- ❌ Complex setup
- ❌ Need Xcode/Android Studio
- ❌ Longer development time

### **When to Use**
- ✅ You need specific native modules
- ✅ You need maximum performance
- ✅ You have native development experience

---

## 📱 **Option 3: Progressive Web App (PWA)**

### **Pros**
- ✅ No app store submission
- ✅ Instant updates
- ✅ Cross-platform automatically
- ✅ Use existing Next.js code

### **Cons**
- ❌ Limited native features
- ❌ Not in app stores
- ❌ Less "native" feel

### **When to Use**
- ✅ You want fastest to market
- ✅ You don't need advanced features
- ✅ You want to avoid app stores

---

## 🎯 **Recommendation: Expo React Native**

**Why?** Best balance of:
- Development speed
- Native features
- App store presence
- Code reuse from your React/Next.js app

---

## 📦 **App Features Comparison**

| Feature | Customer App | Driver App |
|---------|-------------|------------|
| **Authentication** | ✅ Login/Register | ✅ Login |
| **Home Screen** | ✅ Browse restaurants | ✅ Available orders |
| **Orders** | ✅ Order history | ✅ Active deliveries |
| **Real-time Tracking** | ✅ Track driver | ✅ Navigation |
| **Notifications** | ✅ Push notifications | ✅ Order alerts |
| **Payment** | ✅ Wallet, cards | ✅ Earnings |
| **Profile** | ✅ Edit profile | ✅ Statistics |
| **Chat** | ✅ Support chat | ✅ Customer chat |
| **Maps** | ✅ View location | ✅ Turn-by-turn |
| **Camera** | ❌ Not needed | ✅ Proof of delivery |
| **Location** | ✅ Address selection | ✅ Always tracking |

---

## 🛠️ **Detailed Setup: Expo React Native**

### **Step 1: Install Prerequisites**

**Install Node.js** ✅ (already done)

**Install Expo CLI**
```powershell
npm install -g expo-cli eas-cli
```

**Install Expo Go on Your Phone**
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent
- iOS: https://apps.apple.com/app/expo-go/id982107779

**For Android APK Build:**
- Install Android Studio: https://developer.android.com/studio
- Set up Android SDK

**For iOS Build (Mac only):**
- Install Xcode: https://apps.apple.com/us/app/xcode/id497799835

---

### **Step 2: Create Project Structure**

```powershell
cd e:\nn\albazdelivery
mkdir mobile-apps
cd mobile-apps
```

---

### **Step 3: Create Customer App**

```powershell
# Create with TypeScript and tabs template
npx create-expo-app@latest customer-app --template tabs

cd customer-app

# Install additional dependencies
pnpm add @react-navigation/native @react-navigation/stack
pnpm add react-native-maps
pnpm add @tanstack/react-query
pnpm add zustand
pnpm add axios
pnpm add react-native-safe-area-context
pnpm add react-native-screens
pnpm add expo-location
pnpm add expo-notifications
pnpm add expo-secure-store
```

---

### **Step 4: Create Driver App**

```powershell
cd ..
npx create-expo-app@latest driver-app --template tabs

cd driver-app

# Install additional dependencies
pnpm add @react-navigation/native @react-navigation/stack
pnpm add react-native-maps
pnpm add @tanstack/react-query
pnpm add zustand
pnpm add axios
pnpm add react-native-safe-area-context
pnpm add react-native-screens
pnpm add expo-location
pnpm add expo-notifications
pnpm add expo-secure-store
pnpm add expo-camera
pnpm add expo-image-picker
```

---

### **Step 5: Configure API Connection**

Create `services/api.ts` in both apps:

```typescript
// mobile-apps/customer-app/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = __DEV__ 
  ? 'http://localhost:3000/api' // Development
  : 'https://your-project.vercel.app/api'; // Production

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

### **Step 6: Set Up State Management**

Create `stores/authStore.ts`:

```typescript
// mobile-apps/customer-app/stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    await SecureStore.setItemAsync('authToken', token);
    set({ user, token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      const response = await api.get('/auth/me');
      set({ user: response.data, token, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
```

---

## 📱 **Customer App Structure**

```
customer-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home/Browse
│   │   ├── orders.tsx         # Order history
│   │   ├── cart.tsx           # Shopping cart
│   │   └── profile.tsx        # User profile
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── restaurant/
│   │   └── [id].tsx           # Restaurant details
│   ├── order/
│   │   └── [id].tsx           # Order tracking
│   └── _layout.tsx            # Root layout
├── components/
│   ├── RestaurantCard.tsx
│   ├── OrderCard.tsx
│   ├── CartItem.tsx
│   └── MapView.tsx
├── services/
│   ├── api.ts
│   ├── orders.ts
│   └── restaurants.ts
├── stores/
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── orderStore.ts
├── constants/
│   └── Colors.ts
└── app.json
```

---

## 🚗 **Driver App Structure**

```
driver-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Available orders
│   │   ├── active.tsx         # Active deliveries
│   │   ├── earnings.tsx       # Earnings/stats
│   │   └── profile.tsx        # Driver profile
│   ├── (auth)/
│   │   └── login.tsx
│   ├── delivery/
│   │   └── [id].tsx           # Delivery navigation
│   └── _layout.tsx
├── components/
│   ├── OrderCard.tsx
│   ├── MapNavigation.tsx
│   ├── DeliveryStatus.tsx
│   └── EarningsCard.tsx
├── services/
│   ├── api.ts
│   ├── orders.ts
│   └── location.ts
├── stores/
│   ├── authStore.ts
│   ├── locationStore.ts
│   └── orderStore.ts
└── app.json
```

---

## 🗺️ **Key Features Implementation**

### **1. Real-time Location Tracking**

```typescript
// stores/locationStore.ts
import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  location: Location.LocationObject | null;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  subscription: null,

  startTracking: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        set({ location });
        // Send to server
        api.post('/drivers/location', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );
  },
}));
```

### **2. Push Notifications**

```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync();
  
  // Send token to server
  await api.post('/notifications/register', {
    token: token.data,
  });

  return token.data;
}

// Handle incoming notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### **3. Maps Integration**

```typescript
// components/MapView.tsx
import MapView, { Marker, Polyline } from 'react-native-maps';

export function DeliveryMap({ origin, destination, driverLocation }) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={origin} title="Restaurant" />
      <Marker coordinate={destination} title="Delivery Address" />
      {driverLocation && (
        <Marker coordinate={driverLocation} title="Driver">
          <Image source={require('../assets/driver-icon.png')} />
        </Marker>
      )}
      <Polyline
        coordinates={[origin, driverLocation, destination]}
        strokeColor="#4F46E5"
        strokeWidth={3}
      />
    </MapView>
  );
}
```

---

## 📦 **Building for Production**

### **Build Android APK**

```powershell
# Configure EAS
cd mobile-apps/customer-app
eas build:configure

# Build APK for local distribution
eas build --platform android --profile preview

# Or build AAB for Google Play
eas build --platform android --profile production
```

### **Build iOS IPA**

```powershell
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

### **Build Both Platforms**

```powershell
eas build --platform all
```

---

## 🚀 **Development Workflow**

### **Local Development**

```powershell
# Start customer app
cd mobile-apps/customer-app
pnpm start

# Options:
# Press 'a' for Android
# Press 'i' for iOS (Mac only)
# Scan QR code with Expo Go app
```

### **Testing**

```powershell
# Install testing dependencies
pnpm add -D @testing-library/react-native jest

# Run tests
pnpm test
```

### **Over-the-Air Updates**

```powershell
# Publish update (no app store submission needed!)
eas update --branch production --message "Fix order tracking bug"
```

---

## 📱 **App Configuration**

### **Customer App (`app.json`)**

```json
{
  "expo": {
    "name": "AL-baz Delivery",
    "slug": "albaz-customer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "bundleIdentifier": "com.albazdelivery.customer",
      "supportsTablet": true
    },
    "android": {
      "package": "com.albazdelivery.customer",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4F46E5"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-location",
      "expo-notifications"
    ]
  }
}
```

### **Driver App (`app.json`)**

```json
{
  "expo": {
    "name": "AL-baz Driver",
    "slug": "albaz-driver",
    "version": "1.0.0",
    "android": {
      "package": "com.albazdelivery.driver",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-location",
      "expo-notifications",
      "expo-camera"
    ]
  }
}
```

---

## 🎨 **Design System**

Reuse your web design tokens:

```typescript
// constants/Colors.ts
export const Colors = {
  primary: '#4F46E5',
  secondary: '#10B981',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#6B7280',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};
```

---

## 📊 **API Integration**

Share API types with your web app:

```typescript
// shared/types/order.ts
export interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered';
  items: OrderItem[];
  total: number;
  deliveryAddress: Address;
  restaurant: Restaurant;
  driver?: Driver;
}
```

---

## 🔔 **Push Notifications Setup**

### **Configure Firebase (Android)**
1. Go to Firebase Console
2. Create project
3. Add Android app
4. Download `google-services.json`
5. Place in `customer-app/android/app/`

### **Configure APNs (iOS)**
1. Apple Developer Account
2. Create App ID
3. Create APNs Key
4. Upload to Expo

---

## 📱 **App Store Submission**

### **Google Play Store**

```powershell
# Build release AAB
eas build --platform android --profile production

# Upload to Google Play Console
# https://play.google.com/console
```

**Required Assets:**
- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (phone & tablet)
- Privacy policy URL
- App description

### **Apple App Store**

```powershell
# Build release IPA
eas build --platform ios --profile production

# Upload via Transporter or Xcode
```

**Required Assets:**
- App icon (1024x1024)
- Screenshots (multiple sizes)
- Privacy policy URL
- App description

---

## 💰 **Cost Estimate**

| Item | Cost |
|------|------|
| **Development** | Your time |
| **Apple Developer** | $99/year |
| **Google Play** | $25 one-time |
| **Expo EAS Build** | $29/month (or free tier) |
| **Push Notifications** | Free (Expo) |
| **Maps** | Free (limited) |
| **Total First Year** | ~$500 |

---

## 📅 **Development Timeline**

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Setup** | 1 week | Project setup, dependencies |
| **Auth & API** | 1 week | Login, API integration |
| **Customer App** | 3 weeks | UI, features, testing |
| **Driver App** | 3 weeks | UI, features, testing |
| **Testing** | 2 weeks | QA, bug fixes |
| **App Store** | 1 week | Submission, review |
| **Total** | **11 weeks** | ~3 months |

---

## 🎯 **Next Steps**

1. **Choose approach** (Recommended: Expo)
2. **Set up development environment**
3. **Create project structure**
4. **Build authentication**
5. **Implement core features**
6. **Test on real devices**
7. **Submit to app stores**

---

## 📚 **Resources**

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Expo Router**: https://expo.github.io/router
- **React Query**: https://tanstack.com/query
- **React Native Maps**: https://github.com/react-native-maps/react-native-maps

---

**Ready to build your mobile apps?** 🚀

Start with the setup commands above, and I'll help you implement each feature!
