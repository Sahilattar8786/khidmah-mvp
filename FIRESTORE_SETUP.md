# Firestore Database Setup Guide

## ✅ Step 1: Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **khidmah-mvp**
3. Click **Firestore Database** in the left sidebar
4. Click **Create database**
5. Choose **Start in test mode** (for MVP - you'll add security rules later)
6. Select a **location** (choose closest to your users)
7. Click **Enable**

## 📁 Collections Used (Auto-Created)

The following collections will be **automatically created** when the app writes data:

### 1. `users` Collection
- **Purpose**: Store user roles
- **Document ID**: Clerk user ID
- **Fields**:
  - `role`: "user" | "aalim"
  - `createdAt`: ISO timestamp

### 2. `aalims` Collection
- **Purpose**: Store aalim information for chat assignment
- **Document ID**: Clerk user ID
- **Fields**:
  - `clerkId`: string
  - `email`: string (optional)
  - `name`: string (optional)
  - `isAvailable`: boolean
  - `createdAt`: ISO timestamp

### 3. `chats` Collection
- **Purpose**: Store chat sessions between users and aalims
- **Document ID**: Auto-generated chat ID
- **Fields**:
  - `userId`: Clerk user ID
  - `aalimId`: Clerk aalim ID
  - `createdAt`: server timestamp
  - `updatedAt`: server timestamp

### 4. `chats/{chatId}/messages` Subcollection
- **Purpose**: Store messages within each chat
- **Document ID**: Auto-generated message ID
- **Fields**:
  - `senderId`: Clerk user ID
  - `text`: string
  - `createdAt`: server timestamp

## 🔍 Step 2: Create Composite Indexes

Firebase will **automatically prompt you** to create indexes when you run queries. However, you can create them manually:

### Index 1: User Chats Query
- **Collection**: `chats`
- **Fields**:
  - `userId` (Ascending)
  - `updatedAt` (Descending)

### Index 2: Aalim Chats Query
- **Collection**: `chats`
- **Fields**:
  - `aalimId` (Ascending)
  - `updatedAt` (Descending)

### Index 3: Available Aalims Query
- **Collection**: `aalims`
- **Fields**:
  - `isAvailable` (Ascending)

### How to Create Indexes:

1. When you run the app, Firebase will show an error link in the console
2. Click the link to create the index automatically
3. OR manually:
   - Go to Firestore → Indexes
   - Click **Create Index**
   - Add the fields as specified above
   - Click **Create**

## 🔒 Step 3: Security Rules (Important for Production)

For MVP, you can use test mode, but for production, add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Aalims collection - authenticated users can read, only aalims can write
    match /aalims/{aalimId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == aalimId;
    }
    
    // Chats collection - users can only access their own chats
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.aalimId == request.auth.uid);
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          (get(/databases/$(database)/documents/chats/$(chatId)).data.userId == request.auth.uid ||
           get(/databases/$(database)/documents/chats/$(chatId)).data.aalimId == request.auth.uid);
      }
    }
  }
}
```

**Note**: The above rules use Firebase Auth. Since you're using Clerk, you'll need to:
1. Set up Firebase Admin SDK to verify Clerk tokens
2. Create custom claims in Firebase based on Clerk user data
3. OR use a simpler approach: Allow authenticated requests and validate in your app code

For MVP, **test mode is fine** - just make sure to add proper security rules before production!

## ✅ Verification

After setup, test by:
1. Running the app
2. Creating a user account
3. Checking Firestore Console → you should see a document in `users` collection
4. If you assign "aalim" role, check `aalims` collection
5. When a user starts a chat, check `chats` collection

## 🚨 Common Issues

### "Missing or insufficient permissions"
- **Solution**: Check security rules or use test mode

### "Index required" error
- **Solution**: Click the error link to create the index, or create manually in Firestore → Indexes

### Collections not appearing
- **Solution**: Collections only appear after the first document is created. Try creating a user account first.

