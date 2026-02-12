# Troubleshooting Guide

## Error: `auth/operation-not-allowed`

This error means the **Google Sign-In provider** is disabled in your Firebase project.

### Solution
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **paarangat-system**.
3. Navigate to **Authentication** (in the left sidebar) > **Sign-in method** tab.
4. Click **Add new provider** (or edit **Google** if visible).
5. Select **Google**.
6. Toggle **Enable**.
7. Set the **Project support email**.
8. Click **Save**.

Once enabled, try logging in again at [http://localhost:3000/login](http://localhost:3000/login).
