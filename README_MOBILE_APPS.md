# 📱 AL-baz Mobile Apps - Getting Started

Build native Android & iOS apps for your delivery platform.

---

## 🎯 **What You Get**

Two native mobile apps:
1. **Customer App** 📱 - Browse, order, track deliveries
2. **Driver App** 🚗 - Accept orders, navigate, update status

---

## 🚀 **Quick Start (15 Minutes)**

### **1. Install Expo Go on Your Phone**
- **Android**: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### **2. Run Setup Script**
```powershell
cd e:\nn\albazdelivery
.\setup-mobile-apps.ps1
```
Choose option 3 (Both apps)

### **3. Start Development**
```powershell
cd mobile-apps\customer-app
pnpm start
```
Scan QR code with Expo Go → App opens on your phone! 🎉

---

## 📚 **Documentation**

| File | Purpose | Read Time |
|------|---------|-----------|
| **[MOBILE_QUICK_START.md](MOBILE_QUICK_START.md)** | 15-min setup & quick reference | 10 min |
| **[MOBILE_APPS_SUMMARY.md](MOBILE_APPS_SUMMARY.md)** | Complete overview & roadmap | 15 min |
| **[MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md)** | Detailed implementation guide | 45 min |

**Start with**: `MOBILE_QUICK_START.md`

---

## 💻 **Code Templates**

Ready-to-use code in `mobile-app-templates/`:

| Template | Description |
|----------|-------------|
| `api-service.ts` | API integration with your backend |
| `auth-store.ts` | Login/register state management |
| `location-store.ts` | GPS tracking for driver app |
| `notifications.ts` | Push notifications setup |
| `OrderCard.tsx` | Order card UI component |
| `TrackingMap.tsx` | Real-time tracking map |
| `LoginScreen.tsx` | Complete login screen |

**Copy to your app** - Just update API URL and you're ready!

---

## 🛠️ **Setup Script**

`setup-mobile-apps.ps1` automatically:
- ✅ Installs Expo CLI
- ✅ Creates customer-app/
- ✅ Creates driver-app/
- ✅ Installs all dependencies
- ✅ Sets up project structure

**Run once, build forever!**

---

## 📱 **Technology**

- **Expo + React Native** - Cross-platform framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Query** - API calls
- **React Native Maps** - Maps & navigation
- **Expo Notifications** - Push notifications

**Why Expo?**
- ✅ Fastest development
- ✅ Test instantly on your phone
- ✅ Build APK/IPA with one command
- ✅ Update apps without app store

---

## 🎯 **Features**

### **Customer App**
- Browse restaurants & menus
- Shopping cart
- Place orders
- Track delivery in real-time
- Order history
- Profile management
- Push notifications

### **Driver App**
- View available orders
- Accept/reject orders
- Turn-by-turn navigation
- Update order status
- Real-time GPS tracking
- Earnings dashboard
- Upload delivery photos

---

## 📊 **Timeline**

| Week | Focus |
|------|-------|
| 1 | Setup, auth, navigation |
| 2-4 | Customer app features |
| 5-7 | Driver app features |
| 8 | Polish & testing |
| 9 | Build & submit to stores |
| 10 | **Launch!** 🚀 |

**Total: ~10 weeks**

---

## 💰 **Costs**

- Google Play: $25 (one-time)
- Apple Developer: $99/year
- Expo EAS: Free tier available
- **Total Year 1**: ~$500

---

## 🔄 **Workflow**

1. **Edit code** → Save
2. **App auto-reloads** on phone
3. **Test feature** → Repeat
4. **Build APK** → Distribute
5. **Submit to stores** → Launch!

**No rebuilding for each change!**

---

## 🎨 **Reuse Your Design**

- Colors from web app ✅
- Components style ✅
- API endpoints ✅
- Business logic ✅

**~70% code reuse from web!**

---

## 📦 **Building Apps**

### **Test on Device (Expo Go)**
```powershell
pnpm start
# Scan QR code
```

### **Build APK (Android)**
```powershell
eas build --platform android
```

### **Build IPA (iOS)**
```powershell
eas build --platform ios
```

### **Submit to Stores**
```powershell
eas submit --platform all
```

---

## 🆘 **Need Help?**

1. **Quick answers**: `MOBILE_QUICK_START.md`
2. **Detailed guide**: `MOBILE_APP_GUIDE.md`
3. **Code examples**: `mobile-app-templates/`
4. **Expo docs**: https://docs.expo.dev

---

## ✅ **Checklist**

- [ ] Install Expo Go on phone
- [ ] Run `setup-mobile-apps.ps1`
- [ ] Copy templates to apps
- [ ] Update API URL
- [ ] Test authentication
- [ ] Implement features
- [ ] Build APK
- [ ] Submit to stores
- [ ] **Launch!** 🎉

---

## 🚀 **Get Started Now**

```powershell
# Run this:
.\setup-mobile-apps.ps1

# Then read:
MOBILE_QUICK_START.md

# Start coding!
cd mobile-apps\customer-app
pnpm start
```

---

**Built with ❤️ for AL-baz Delivery** 🇩🇿

Ready to build amazing mobile apps! 📱🚀
