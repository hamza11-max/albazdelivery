# 📱 Mobile Apps - Quick Start Guide

Get your mobile apps running in **15 minutes**.

---

## 🚀 **Super Quick Setup**

### **Step 1: Install Tools (2 minutes)**

```powershell
# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Verify installation
expo --version
eas --version
```

### **Step 2: Install Expo Go App on Your Phone**

- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS**: https://apps.apple.com/app/expo-go/id982107779

### **Step 3: Run Setup Script (5 minutes)**

```powershell
cd e:\nn\albazdelivery

# Run automated setup
.\setup-mobile-apps.ps1

# Choose option 3 (Both apps)
```

### **Step 4: Start Development (2 minutes)**

```powershell
# Start Customer App
cd mobile-apps\customer-app
pnpm start

# Scan QR code with Expo Go app
# Your app will open on your phone!
```

**That's it!** 🎉 Your app is running on your phone.

---

## 📱 **Development Workflow**

### **Running Apps**

```powershell
# Customer App
cd mobile-apps\customer-app
pnpm start

# Driver App
cd mobile-apps\driver-app
pnpm start

# Press:
# • 'a' for Android emulator
# • 'i' for iOS simulator (Mac only)
# • Scan QR code for physical device
```

### **Making Changes**

1. Edit files in `app/`, `components/`, or `services/`
2. Save the file
3. App automatically reloads on your phone ✅

### **Common Commands**

```powershell
# Install new package
pnpm add package-name

# Clear cache (if issues)
pnpm start --clear

# Build for production
eas build --platform android

# Publish update (OTA)
eas update --branch production
```

---

## 🗂️ **Project Structure**

```
mobile-apps/
├── customer-app/           # Customer mobile app
│   ├── app/               # Screens (Expo Router)
│   │   ├── (tabs)/       # Main tabs
│   │   │   ├── index.tsx         # Home
│   │   │   ├── orders.tsx        # Orders
│   │   │   ├── cart.tsx          # Cart
│   │   │   └── profile.tsx       # Profile
│   │   ├── (auth)/       # Auth screens
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   └── _layout.tsx   # Root layout
│   ├── components/        # UI components
│   ├── services/          # API calls
│   │   └── api.ts        # Axios setup
│   ├── stores/           # State management
│   │   └── authStore.ts  # Zustand store
│   ├── assets/           # Images, fonts
│   └── app.json          # App configuration
│
└── driver-app/            # Driver mobile app
    └── (same structure)
```

---

## 🔧 **API Configuration**

Edit `services/api.ts` in both apps:

```typescript
const API_URL = __DEV__ 
  ? 'http://YOUR-LOCAL-IP:3000/api' // Development
  : 'https://your-vercel-app.vercel.app/api'; // Production

// Find your local IP:
// Windows: ipconfig
// Mac/Linux: ifconfig
// Example: http://192.168.1.100:3000/api
```

**Important**: Your phone and computer must be on the same WiFi network.

---

## 🎨 **Using Templates**

I created ready-to-use templates in `mobile-app-templates/`:

### **1. Copy API Service**
```powershell
# Customer App
copy mobile-app-templates\api-service.ts mobile-apps\customer-app\services\api.ts

# Driver App
copy mobile-app-templates\api-service.ts mobile-apps\driver-app\services\api.ts
```

### **2. Copy Auth Store**
```powershell
copy mobile-app-templates\auth-store.ts mobile-apps\customer-app\stores\authStore.ts
copy mobile-app-templates\auth-store.ts mobile-apps\driver-app\stores\authStore.ts
```

### **3. Copy Components**
```powershell
copy mobile-app-templates\OrderCard.tsx mobile-apps\customer-app\components\
copy mobile-app-templates\TrackingMap.tsx mobile-apps\customer-app\components\
copy mobile-app-templates\LoginScreen.tsx mobile-apps\customer-app\app\(auth)\login.tsx
```

### **4. Copy Location Store (Driver App)**
```powershell
copy mobile-app-templates\location-store.ts mobile-apps\driver-app\stores\locationStore.ts
```

### **5. Copy Notifications**
```powershell
copy mobile-app-templates\notifications.ts mobile-apps\customer-app\services\
copy mobile-app-templates\notifications.ts mobile-apps\driver-app\services\
```

---

## 📱 **Key Features to Implement**

### **Customer App**
- [x] Authentication (login/register)
- [ ] Browse restaurants
- [ ] Add items to cart
- [ ] Place order
- [ ] Track order in real-time
- [ ] View order history
- [ ] Push notifications
- [ ] Payment integration

### **Driver App**
- [x] Authentication (login)
- [ ] View available orders
- [ ] Accept orders
- [ ] Navigate to pickup/delivery
- [ ] Update order status
- [ ] Real-time location tracking
- [ ] View earnings
- [ ] Upload delivery proof

---

## 🗺️ **Adding Maps**

### **1. Install Maps Package**
Already done by setup script ✅

### **2. Get Google Maps API Key**

1. Go to: https://console.cloud.google.com
2. Create project
3. Enable "Maps SDK for Android" and "Maps SDK for iOS"
4. Create API key
5. Add to `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      }
    }
  }
}
```

### **3. Use Map Component**
```typescript
import { TrackingMap } from '../components/TrackingMap';

<TrackingMap
  restaurant={{ latitude: 36.7538, longitude: 3.0588 }}
  deliveryAddress={{ latitude: 36.7372, longitude: 3.0865 }}
  driverLocation={{ latitude: 36.7455, longitude: 3.0726 }}
/>
```

---

## 🔔 **Push Notifications Setup**

### **1. Configure Notifications**
```powershell
# Already installed by setup script
# expo-notifications
```

### **2. Register for Notifications**
```typescript
import { registerForPushNotifications } from '../services/notifications';

// In your App.tsx or root component
useEffect(() => {
  registerForPushNotifications();
}, []);
```

### **3. Handle Notifications**
```typescript
import { useNotificationObserver } from '../services/notifications';

useNotificationObserver((notification) => {
  console.log('Notification received:', notification);
  // Navigate to relevant screen
});
```

---

## 🏗️ **Building APK/IPA**

### **Android APK (Local Testing)**

```powershell
cd mobile-apps\customer-app

# Configure EAS Build
eas build:configure

# Build APK
eas build --platform android --profile preview

# Download and install on phone
```

### **iOS IPA (Mac only)**

```powershell
cd mobile-apps\customer-app

# Build for TestFlight
eas build --platform ios --profile preview
```

### **App Store/Play Store**

```powershell
# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 🐛 **Troubleshooting**

### **"Unable to resolve module"**
```powershell
# Clear cache
pnpm start --clear

# Or delete and reinstall
rmdir /s /q node_modules
pnpm install
```

### **"Network request failed"**
- Check API_URL in `services/api.ts`
- Ensure phone and computer on same WiFi
- Try your local IP instead of `localhost`

### **"Expo Go app not connecting"**
- Restart Expo dev server
- Restart Expo Go app
- Check firewall settings
- Try tunnel mode: `pnpm start --tunnel`

### **Maps not showing**
- Check Google Maps API key
- Enable required APIs in Google Console
- Restart app after adding API key

### **Location not working**
- Allow location permissions in phone settings
- Check `app.json` has location permissions
- Request permissions in code

---

## 📊 **Development Tips**

### **1. Hot Reload**
Changes automatically reload. If not:
```powershell
# Enable Fast Refresh
# Already enabled by default
```

### **2. Debug Console**
```powershell
# Open browser debugger
# Press 'j' in terminal
```

### **3. View Device Logs**
```powershell
# Android
adb logcat

# iOS (Mac)
xcrun simctl spawn booted log stream
```

### **4. Performance**
```typescript
// Use React.memo for expensive components
export const OrderCard = React.memo(({ order }) => {
  // Component code
});

// Use useCallback for functions
const handlePress = useCallback(() => {
  // Handle press
}, []);
```

---

## 📚 **Next Steps**

1. **Customize UI**: Edit colors in `constants/Colors.ts`
2. **Add Screens**: Create new files in `app/` directory
3. **API Integration**: Connect to your backend
4. **Test Features**: Try on real device
5. **Build APK**: Test on multiple devices
6. **Submit to Stores**: Google Play & App Store

---

## 🎯 **Feature Implementation Order**

### **Week 1: Foundation**
- [x] Set up project
- [ ] Configure API connection
- [ ] Implement authentication
- [ ] Create main navigation

### **Week 2: Core Features**
- [ ] Restaurant list & details
- [ ] Shopping cart
- [ ] Order placement
- [ ] Order history

### **Week 3: Advanced**
- [ ] Real-time tracking
- [ ] Push notifications
- [ ] Payment integration
- [ ] Profile management

### **Week 4: Polish**
- [ ] UI improvements
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Testing

---

## 💡 **Pro Tips**

1. **Use Expo Go for rapid development** - Don't build APK until you're ready
2. **Test on real devices** - Emulators don't show real performance
3. **Keep code shared** - Share types/constants between web and mobile
4. **Use TypeScript** - Catch errors before runtime
5. **Follow React Native best practices** - Check React Native docs
6. **Use OTA updates** - Update apps without app store submission

---

## 🆘 **Need Help?**

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Full Guide**: See `MOBILE_APP_GUIDE.md`
- **Templates**: Check `mobile-app-templates/` folder

---

**Ready to build amazing mobile apps!** 🚀

Start with: `.\setup-mobile-apps.ps1`
