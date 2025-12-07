# 🚀 Building Your Mobile Apps - Live Guide

## ✅ **What's Happening Now**

I'm creating your customer app with this command:
```powershell
npx create-expo-app@latest customer-app --template blank-typescript
```

This will take **2-3 minutes**. While it's creating...

---

## 📱 **Install Expo Go RIGHT NOW**

While the app is being created, install Expo Go on your phone:

### **Android**
1. Open **Google Play Store**
2. Search: **"Expo Go"**
3. Tap **Install**
4. Open the app

### **iOS**
1. Open **App Store**
2. Search: **"Expo Go"**
3. Tap **Get**
4. Open the app

**Make sure your phone is on the same WiFi as your computer!**

---

## 🎯 **What You'll Have in 5 Minutes**

```
mobile-apps/
└── customer-app/          ← Your first mobile app!
    ├── App.tsx           ← Main app file
    ├── app.json          ← App configuration
    ├── package.json      ← Dependencies
    └── ...
```

---

## 🚀 **Next Commands (Run After Creation)**

Once the creation finishes, run these:

```powershell
# Go into the app
cd mobile-apps\customer-app

# Install additional packages we need
npm install axios zustand @react-navigation/native

# Start the app
npm start
```

Then:
1. **Scan QR code** with Expo Go app
2. **App opens** on your phone
3. **You're building!** 🎉

---

## 📝 **Your First Feature: Simple UI**

Once app is running, edit `App.tsx`:

```typescript
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍕 AL-baz Delivery</Text>
      <Text style={styles.subtitle}>Customer App v1.0</Text>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Browse Restaurants</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]}>
        <Text style={styles.buttonText}>My Orders</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  buttonSecondary: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

**Save** → App reloads on your phone! ✨

---

## 🎨 **Build Your First Screen**

### **1. Create Folder Structure**

```powershell
cd mobile-apps\customer-app
mkdir screens
mkdir components
mkdir services
```

### **2. Create Login Screen**

Create `screens/LoginScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login:', email, password);
    // TODO: Connect to API
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Sign in to AL-baz Delivery</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 56,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    color: '#4F46E5',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
```

---

## 🔌 **Connect to Your Backend**

Create `services/api.ts`:

```typescript
import axios from 'axios';

// IMPORTANT: Get your local IP with: ipconfig
// Example: 192.168.1.100
const API_URL = 'http://YOUR-LOCAL-IP:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

export const ordersAPI = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
};

export default api;
```

**Find your IP:**
```powershell
ipconfig
# Look for: IPv4 Address
# Example: 192.168.1.100
```

---

## 📊 **Today's Goals**

- [x] Create mobile app
- [ ] Install Expo Go on phone
- [ ] Run app and see it on phone
- [ ] Make first UI change
- [ ] Create login screen
- [ ] Connect to backend API

---

## 🚀 **Tomorrow's Goals**

- [ ] Build restaurant list screen
- [ ] Add navigation between screens
- [ ] Test API calls
- [ ] Create cart functionality

---

## 🎯 **This Week's Roadmap**

**Day 1 (Today)**: Setup + Basic UI
**Day 2**: Login/Register screens
**Day 3**: Restaurant browsing
**Day 4**: Menu & cart
**Day 5**: Order placement
**Weekend**: Polish & test

---

## 💡 **Quick Tips**

1. **Save files often** - App hot reloads
2. **Shake phone** - Opens dev menu
3. **Check terminal** - Shows errors
4. **Use console.log()** - Debug easily
5. **Keep phone unlocked** - For testing

---

## 🐛 **If Something Goes Wrong**

### **App won't start?**
```powershell
npm start -- --clear
```

### **Can't scan QR code?**
```powershell
npm start -- --tunnel
```

### **Module not found?**
```powershell
npm install
npm start
```

---

## 📚 **Resources**

- **Your Guide**: `START_BUILDING.md`
- **Templates**: `mobile-app-templates/`
- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev

---

## ✅ **Status Check**

Run these to verify everything:

```powershell
# Check Node.js
node --version  # Should show v22.x.x

# Check npm
npm --version   # Should show 10.x.x

# Check if app created
cd mobile-apps\customer-app
dir  # Should see App.tsx, package.json, etc.
```

---

## 🎊 **You're Building Right Now!**

The app is being created in the background. In a few minutes you'll have:

✅ A working React Native app
✅ Running on your phone
✅ With hot reload
✅ Ready to build features

**Keep this file open for reference!**

---

**Next Step**: Once creation finishes, run:
```powershell
cd mobile-apps\customer-app
npm start
```

Then scan QR code with Expo Go! 🚀📱
