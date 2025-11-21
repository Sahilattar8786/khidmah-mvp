# Development Build Guide

This guide will help you create a development build for testing on real devices.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev) if you don't have one
2. **EAS CLI**: Already installed ✅
3. **Android**: For Android APK testing
4. **iOS**: For iOS testing (requires Apple Developer account for device testing)

## Step 1: Login to EAS

```bash
npx eas login
```

Enter your Expo account credentials.

## Step 2: Configure Your Project

The project is already configured with:
- `eas.json` - Build configuration
- `app.json` - App metadata and permissions

## Step 3: Build for Android (APK - Easy Testing)

### Development Build (Recommended for Testing)

```bash
npx eas build --profile development --platform android
```

This will:
- Create a development build with Expo Go-like features
- Generate an APK file you can install directly
- Take about 10-15 minutes

### Preview Build (APK for Distribution)

```bash
npx eas build --profile preview --platform android
```

This creates a standalone APK that doesn't require Expo Go.

## Step 4: Build for iOS

### Development Build

```bash
npx eas build --profile development --platform ios
```

**Note**: iOS builds require:
- Apple Developer account ($99/year)
- Xcode installed on Mac
- Device UDID registered (for device testing)

### Preview Build

```bash
npx eas build --profile preview --platform ios
```

## Step 5: Download and Install

After the build completes:

1. **Check build status**:
   ```bash
   npx eas build:list
   ```

2. **Download the build**:
   - Visit: https://expo.dev/accounts/[your-account]/projects/khidmah-mvp/builds
   - Or use the QR code/link provided after build completes

3. **Install on Android**:
   - Download the APK to your phone
   - Enable "Install from Unknown Sources" in Android settings
   - Open the APK file to install

4. **Install on iOS**:
   - Download the IPA file
   - Install via TestFlight (if configured) or Xcode

## Quick Commands

```bash
# Build Android APK (Preview - easiest for testing)
npx eas build --profile preview --platform android

# Build iOS (requires Apple Developer account)
npx eas build --profile preview --platform ios

# Build both platforms
npx eas build --profile preview --platform all

# Check build status
npx eas build:list

# View build logs
npx eas build:view [build-id]
```

## Local Development Alternative

If you want to test without building, you can use:

```bash
# Start development server
npx expo start

# Then scan QR code with:
# - Expo Go app (Android/iOS)
# - Camera app (iOS)
```

**Note**: Some native features (like notifications) work better in a development build than in Expo Go.

## Troubleshooting

### Build Fails
- Check `eas.json` configuration
- Ensure all dependencies are in `package.json`
- Review build logs: `npx eas build:view [build-id]`

### Can't Install APK
- Enable "Install from Unknown Sources" in Android
- Check if APK is corrupted (re-download)

### iOS Build Issues
- Verify Apple Developer account is active
- Check bundle identifier matches your account
- Ensure device UDID is registered

## Next Steps

After testing the development build:
1. Fix any issues found
2. Create a production build when ready
3. Submit to app stores (Google Play / App Store)

---

**Need Help?**
- EAS Docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/

