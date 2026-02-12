# Firebase Cloud Messaging Setup Guide

This guide will help you complete the Firebase Cloud Messaging (FCM) setup for push notifications.

## Prerequisites

- Firebase project already configured (✅ You have this)
- Firebase Admin SDK credentials

## Step 1: Generate VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Scroll to **Web Push certificates**
5. Click **Generate key pair**
6. Copy the generated key

## Step 2: Update Environment Variables

Add the following to your `.env.local` file:

```env
# Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Firebase Admin SDK (for backend API)
FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
FIREBASE_PRIVATE_KEY="your_firebase_admin_private_key"
```

### Getting Firebase Admin Credentials:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the following values:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)

## Step 3: Update Service Worker Configuration

Edit `public/firebase-messaging-sw.js` and replace the placeholder values with your actual Firebase config:

```javascript
firebase.initializeApp({
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
    projectId: "YOUR_ACTUAL_PROJECT_ID",
    storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
    messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID",
});
```

You can find these values in your `.env.local` file (they're already configured for your app).

## Step 4: Test the Implementation

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Enable notifications:**
   - Go to Settings page
   - Find the "Push Notifications" section
   - Toggle "Enable Notifications"
   - Grant permission when prompted

3. **Test notification:**
   - Click "Send Test Notification" button
   - You should see a notification appear

4. **Test timer notifications:**
   - Go to home page
   - Start a timer (set it to 1 minute for quick testing)
   - Wait for timer to complete
   - You should receive a notification

## Device-Specific Testing

### Desktop (Chrome, Firefox, Edge)
- ✅ Full support
- Works even when browser is minimized
- Background notifications work

### Android (Chrome Mobile)
- ✅ Full support in browser
- ✅ Full support in PWA mode
- Install as PWA for best experience:
  1. Open app in Chrome
  2. Tap menu (3 dots)
  3. Tap "Add to Home screen"

### iOS (Safari Mobile)
- ⚠️ **Browser mode: NO support** (Apple limitation)
- ✅ **PWA mode: Full support**
- **MUST install as PWA:**
  1. Open app in Safari
  2. Tap Share button
  3. Tap "Add to Home Screen"
  4. Open from home screen
  5. Then enable notifications

### Tablets
- Same as above based on OS (Android/iOS)

## Troubleshooting

### "Notifications not working"
1. Check browser console for errors
2. Verify VAPID key is correct
3. Check notification permission status
4. Try in incognito/private mode

### "FCM token not registering"
1. Check Firebase Admin credentials
2. Verify Firestore security rules allow writes to `users/{userId}/fcmTokens`
3. Check browser console for API errors

### "iOS notifications not working"
1. Verify app is installed as PWA (not just browser tab)
2. Check if running in standalone mode: `window.matchMedia('(display-mode: standalone)').matches`
3. iOS Safari browser tabs don't support push notifications

### "Service worker not registering"
1. Check browser console for service worker errors
2. Verify `firebase-messaging-sw.js` has correct Firebase config
3. Try unregistering old service workers in DevTools

## Firestore Security Rules

Make sure your Firestore rules allow users to update their FCM tokens:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow FCM token updates
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fcmTokens']);
    }
  }
}
```

## Next Steps

1. **Production Deployment:**
   - Ensure environment variables are set in production
   - Test on actual devices (not just localhost)
   - Monitor FCM quota usage in Firebase Console

2. **Advanced Features (Optional):**
   - Add scheduled notifications
   - Implement notification preferences per type
   - Add quiet hours functionality
   - Track notification delivery analytics

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test in different browsers
4. Check Firebase Console for quota limits
