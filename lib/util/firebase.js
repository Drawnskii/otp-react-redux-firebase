import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

let firebaseApp
let firebaseAuth
let firebaseFirestore

/**
 * Initialize Firebase with the provided configuration
 * @param {Object} config - Firebase configuration object
 * @returns {Object} Firebase app instance
 */
export const initializeFirebase = (config) => {
  if (!config) {
    console.warn('Firebase configuration is missing')
    return null
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(config)
    firebaseAuth = getAuth(firebaseApp)
    firebaseFirestore = getFirestore(firebaseApp)
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    firestore: firebaseFirestore
  }
}

/**
 * Sign in with email and password using Firebase Authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Firebase auth result
 */
export const signInWithFirebase = async (email, password) => {
  if (!firebaseAuth) throw new Error('Firebase auth not initialized')
  return signInWithEmailAndPassword(firebaseAuth, email, password)
}

/**
 * Register a new user with email and password using Firebase Authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} profileData - Optional profile data like displayName and photoURL
 * @returns {Promise} Firebase auth result
 */
export const registerWithFirebase = async (email, password, profileData = {}) => {
  if (!firebaseAuth) throw new Error('Firebase auth not initialized')
  
  // Create the user with email and password
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
  const { user } = userCredential
  
  // If profile data is provided, update the user profile
  if (profileData.displayName || profileData.photoURL) {
    await updateProfile(user, {
      displayName: profileData.displayName || null,
      photoURL: profileData.photoURL || null
    })
  }
  
  // Store additional user data in Firestore if a database is available
  if (firebaseFirestore && user) {
    try {
      // Create a user document with the UID as the document ID
      await setDoc(doc(firebaseFirestore, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: profileData.displayName || null,
        photoURL: profileData.photoURL || null,
        createdAt: new Date().toISOString(),
        ...profileData // Include any other profile data provided
      })
    } catch (error) {
      // Log the error but don't fail the registration
      console.error('Error storing user data in Firestore:', error)
    }
  }
  
  return userCredential
}

/**
 * Sign out the current user from Firebase Authentication
 * @returns {Promise} Void promise that resolves when sign out is complete
 */
export const signOutFromFirebase = async () => {
  if (!firebaseAuth) throw new Error('Firebase auth not initialized')
  return signOut(firebaseAuth)
}

/**
 * Set up an auth state listener to track user authentication state
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const listenToAuthState = (callback) => {
  if (!firebaseAuth) throw new Error('Firebase auth not initialized')
  return onAuthStateChanged(firebaseAuth, callback)
}

/**
 * Get the current Firebase user
 * @returns {Object|null} Current Firebase user or null if not signed in
 */
export const getCurrentUser = () => {
  if (!firebaseAuth) return null
  return firebaseAuth.currentUser
}

/**
 * Get Firebase Firestore instance
 * @returns {Object|null} Firestore instance or null if not initialized
 */
export const getFirestoreDb = () => {
  return firebaseFirestore
}

/**
 * Convert Firebase user to a format compatible with the app's user object
 * @param {Object} firebaseUser - Firebase user object
 * @returns {Object} App-compatible user object
 */
export const convertFirebaseUserToAppUser = (firebaseUser) => {
  if (!firebaseUser) return null

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    name: firebaseUser.displayName || firebaseUser.email,
    nickname: firebaseUser.displayName,
    picture: firebaseUser.photoURL,
    // Additional properties needed for compatibility with Auth0 user format
    sub: firebaseUser.uid
  }
} 