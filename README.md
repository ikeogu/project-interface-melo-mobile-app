# Aura — AI Contacts Mobile App

React Native (Expo) frontend for the AI Contacts backend.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set your API URL
Open `.env` and replace with your Railway URL:
```bash
EXPO_PUBLIC_API_URL=https://YOUR_RAILWAY_URL.up.railway.app
```

### 3. Start the app
```bash
npx expo start
```

Then press:
- `i` — iOS simulator
- `a` — Android emulator
- Scan QR code with Expo Go app on your phone

## Project structure

```
src/
├── api/
│   ├── client.js        # Axios instance + JWT interceptor
│   ├── auth.js          # Auth API calls
│   ├── contacts.js      # Contacts API calls
│   └── chats.js         # Chats + messages API calls
├── store/
│   ├── authStore.js     # Auth state (Zustand)
│   ├── contactsStore.js # Contacts state
│   └── chatsStore.js    # Chats + messages state
├── screens/
│   ├── SplashScreen.jsx        # Animated splash
│   ├── EmailScreen.jsx         # Email entry + social login
│   ├── OTPScreen.jsx           # 6-digit code input
│   ├── ProfileSetupScreen.jsx  # Name setup (new users)
│   ├── ContactsScreen.jsx      # Contacts list + templates
│   ├── ChatsScreen.jsx         # Chat list
│   ├── ChatScreen.jsx          # Chat thread + WebSocket
│   ├── CreateContactScreen.jsx # Custom contact creator
│   ├── VideoCallScreen.jsx     # Video call UI
│   └── ProfileScreen.jsx       # Settings + logout
├── components/
│   ├── Avatar.jsx        # Initials/emoji/image avatar
│   ├── ContactRow.jsx    # Contact list row
│   ├── ChatRow.jsx       # Chat list row
│   ├── MessageBubble.jsx # Chat message bubble
│   └── SearchBar.jsx     # Search input
├── navigation/
│   └── AppNavigator.jsx  # Stack + tab navigation
├── utils/
│   ├── websocket.js      # WS connection + reconnect
│   └── format.js         # Time, initials, colors
└── theme/
    └── colors.js         # Design tokens
```

## Auth flow

```
App launch → Splash (2s) → restore session?
  → yes: Main tabs
  → no:  Email screen → OTP screen → Profile setup → Main tabs
```

## Screen → API mapping

| Screen | Endpoint |
|--------|----------|
| EmailScreen | POST /auth/send-otp |
| OTPScreen | POST /auth/verify-otp |
| ProfileSetupScreen | POST /auth/complete-profile |
| ContactsScreen | GET /contacts/ + /contacts/templates |
| ChatScreen | GET/POST /messages/{chat_id} + WebSocket |
| CreateContactScreen | POST /contacts/ |
| VideoCallScreen | POST /calls/video/{contact_id} |
