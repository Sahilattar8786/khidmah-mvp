# Fix EAS Build Permissions

## Issue
The project was linked to a different Expo account. I've removed the old projectId.

## Solution

Run this command to create a new EAS project linked to your current account (saahil16):

```bash
npx eas build:configure
```

When prompted:
- **Answer "Yes"** to create a new EAS project for `@saahil16/khidmah-mvp`

This will:
1. Create a new project linked to your account
2. Add the new projectId to `app.json`
3. Allow you to build with your account

## After Configuration

Then you can build:

```bash
# Build Android APK
npx eas build --profile preview --platform android
```

Or use the npm script:
```bash
npm run build:android
```

---

**Note**: The old projectId has been removed from `app.json`. The new one will be added automatically when you run `eas build:configure`.




