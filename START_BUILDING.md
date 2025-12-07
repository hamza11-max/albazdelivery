# 🚀 Start Building Mobile Apps - Step by Step

Follow these exact steps to build your mobile apps right now.

---

## ✅ **Prerequisites Check**

- [x] Node.js installed (v22.20.0) ✅
- [x] npm installed (v10.9.3) ✅
- [ ] Expo Go app on your phone
- [ ] Same WiFi network for phone and computer

---

## 📱 **Step 1: Install Expo Go on Your Phone (2 minutes)**

**Android:**
1. Open Play Store
2. Search "Expo Go"
3. Install
4. Open app

**iOS:**
1. Open App Store
2. Search "Expo Go"
3. Install
4. Open app

---

## 🛠️ **Step 2: Create Customer App (5 minutes)**

Open PowerShell and run these commands:

```powershell
# Navigate to your project
cd e:\nn\albazdelivery

# Create mobile-apps directory
mkdir mobile-apps
cd mobile-apps

# Create customer app with npx (no global install needed!)
npx create-expo-app@latest customer-app --template blank-typescript

# Enter the app directory
cd customer-app

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install axios zustand
npm install expo-router expo-status-bar
```

---

## 🎨 **Step 3: Set Up Project Structure (3 minutes)**

Still in `customer-app` directory:

```powershell
# Create directories
mkdir services
mkdir stores
mkdir types

# Create API service file
New-Item -Path "services\api.ts" -ItemType File
```

---

## 📝 **Step 4: Add API Service Code**

Copy this into `services/api.ts`:

```typescript
import axios from 'axios';

// IMPORTANT: Replace with your computer's local IP
// Find it with: ipconfig (look for IPv4 Address)
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api' // ← Change this to YOUR IP
  : 'https://your-vercel-app.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
};

// Restaurants API  
export const restaurantsAPI = {
  getRestaurants: async () => {
    const response = await api.get('/vendors');
    return response.data;
  },
};
```

---

## 🏃 **Step 5: Start Development Server (1 minute)**

```powershell
# Make sure you're in customer-app directory
cd e:\nn\albazdelivery\mobile-apps\customer-app

# Start the app
npm start
```

You'll see:
- QR code in terminal
- Metro bundler running
- Options to press 'a' for Android or 'i' for iOS

---

## 📱 **Step 6: Open on Your Phone**

1. **Open Expo Go app** on your phone
2. **Scan QR code** from terminal
3. **Wait 10-30 seconds** for app to load
4. **See "Open up App.tsx to start working"**

🎉 **Your app is running!**

---

## 🎨 **Step 7: Make Your First Change**

In VS Code, open `mobile-apps/customer-app/App.tsx`:

Replace content with:

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍕 AL-baz Delivery</Text>
      <Text style={styles.subtitle}>Customer App</Text>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Browse Restaurants</Text>
      </TouchableOpacity>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Save the file** → App reloads automatically on your phone! 🎉

---

## 🎯 **What You Just Did**

✅ Created a React Native app with Expo
✅ Set up API connection to your backend
✅ Ran app on your phone
✅ Made your first change with hot reload

---

## 🚀 **Next Steps**

### **Today: Build Login Screen**

Create `screens/LoginScreen.tsx`:

```powershell
mkdir screens
New-Item -Path "screens\LoginScreen.tsx" -ItemType File
```

Copy the login screen code from `mobile-app-templates/LoginScreen.tsx`.

### **This Week: Core Features**

1. **Authentication**
   - Login screen
   - Register screen
   - Auth state management

2. **Home Screen**
   - Restaurant list
   - Category filters
   - Search

3. **Restaurant Details**
   - Menu items
   - Add to cart

### **Next Week: Orders**

1. Cart screen
2. Checkout flow
3. Order tracking
4. Order history

---

## 🛠️ **Useful Commands**

```powershell
# Start dev server
npm start

# Clear cache
npm start -- --clear

# Install package
npm install package-name

# Build APK (later)
npx expo build:android
```

---

## 🐛 **Troubleshooting**

### **QR Code Not Working?**
```powershell
# Try tunnel mode
npm start -- --tunnel
```

### **"Unable to resolve module"?**
```powershell
# Clear cache and restart
npm start -- --clear
```

### **Can't connect to backend?**
1. Find your computer's IP: `ipconfig`
2. Update `services/api.ts` with your IP
3. Make sure phone and computer on same WiFi
4. Make sure your Next.js app is running: `npm run dev`

### **App not reloading?**
- Shake phone → Reload
- Or restart: `npm start -- --reset-cache`

---

## 📝 **Development Workflow**

1. **Edit code** in VS Code
2. **Save file** (Ctrl+S)
3. **See changes** on phone instantly
4. **Repeat!**

No rebuilding needed! 🚀

---

## 🎨 **Customize Your App**

### **Change Colors**

In your component:

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4F46E5', // Your brand color
  },
});
```

### **Add Icons**

```powershell
npm install @expo/vector-icons
```

```typescript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="restaurant" size={24} color="#4F46E5" />
```

### **Add Images**

```typescript
import { Image } from 'react-native';

<Image 
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 100, height: 100 }}
/>
```

---

## 🎯 **Feature Checklist**

### **Week 1**
- [ ] Login screen
- [ ] Register screen
- [ ] Home screen skeleton
- [ ] API connection tested

### **Week 2**
- [ ] Restaurant list
- [ ] Restaurant details
- [ ] Menu items display
- [ ] Add to cart

### **Week 3**
- [ ] Cart screen
- [ ] Checkout flow
- [ ] Order placement
- [ ] Order confirmation

### **Week 4**
- [ ] Order tracking with map
- [ ] Order history
- [ ] Profile screen
- [ ] Settings

---

## 📚 **Resources**

- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Your templates**: Check `mobile-app-templates/` folder

---

## 💡 **Pro Tips**

1. **Save often** - App reloads automatically
2. **Use TypeScript** - Catch errors early
3. **Test on real device** - More accurate than emulator
4. **Check console** - Errors show in terminal
5. **Shake phone** - Opens dev menu

---

## 🎊 **You're Building!**

Your app is running on your phone. Now start building features one by one!

**Current status**: ✅ App running
**Next**: Build login screen
**Then**: Restaurant browsing
**Finally**: Orders & tracking

---

**Keep this file open for reference!** 📱🚀

Need help? Check:
- `MOBILE_QUICK_START.md`
- `MOBILE_APP_GUIDE.md`
- Expo documentation
