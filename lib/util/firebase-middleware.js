import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where
} from 'firebase/firestore'

import { getFirestoreDb } from './firebase'

/**
 * Firebase middleware service
 * Provides methods for interacting with Firestore database
 */
const firebaseMiddleware = {
  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data or null if not found
   */
  getUser: async (userId) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  },

  /**
   * Create or update a user
   * @param {Object} userData - User data to save
   * @returns {Promise<Object>} Updated user data
   */
  saveUser: async (userData) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      const { id, ...data } = userData
      if (id) {
        // Update existing user
        await updateDoc(doc(db, 'users', id), data)
        return userData
      } else {
        // Create new user
        const userRef = await addDoc(collection(db, 'users'), data)
        return { id: userRef.id, ...data }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      throw error
    }
  },

  /**
   * Get user trips
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user trips
   */
  getTrips: async (userId) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      const q = query(collection(db, 'trips'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting trips:', error)
      throw error
    }
  },

  /**
   * Save a trip
   * @param {Object} tripData - Trip data to save
   * @returns {Promise<Object>} Updated trip data
   */
  saveTrip: async (tripData) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      const { id, ...data } = tripData
      if (id) {
        // Update existing trip
        await updateDoc(doc(db, 'trips', id), data)
        return tripData
      } else {
        // Create new trip
        const tripRef = await addDoc(collection(db, 'trips'), data)
        return { id: tripRef.id, ...data }
      }
    } catch (error) {
      console.error('Error saving trip:', error)
      throw error
    }
  },

  /**
   * Delete a trip
   * @param {string} tripId - Trip ID to delete
   * @returns {Promise<void>}
   */
  deleteTrip: async (tripId) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      await deleteDoc(doc(db, 'trips', tripId))
    } catch (error) {
      console.error('Error deleting trip:', error)
      throw error
    }
  },

  /**
   * Get user places
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user places
   */
  getPlaces: async (userId) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      const q = query(collection(db, 'places'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting places:', error)
      throw error
    }
  },

  /**
   * Save a place
   * @param {Object} placeData - Place data to save
   * @returns {Promise<Object>} Updated place data
   */
  savePlace: async (placeData) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      const { id, ...data } = placeData
      if (id) {
        // Update existing place
        await updateDoc(doc(db, 'places', id), data)
        return placeData
      } else {
        // Create new place
        const placeRef = await addDoc(collection(db, 'places'), data)
        return { id: placeRef.id, ...data }
      }
    } catch (error) {
      console.error('Error saving place:', error)
      throw error
    }
  },

  /**
   * Delete a place
   * @param {string} placeId - Place ID to delete
   * @returns {Promise<void>}
   */
  deletePlace: async (placeId) => {
    const db = getFirestoreDb()
    if (!db) throw new Error('Firestore not initialized')
    
    try {
      await deleteDoc(doc(db, 'places', placeId))
    } catch (error) {
      console.error('Error deleting place:', error)
      throw error
    }
  }
}

export default firebaseMiddleware 