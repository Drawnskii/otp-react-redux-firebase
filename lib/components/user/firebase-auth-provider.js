import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import {
  convertFirebaseUserToAppUser,
  initializeFirebase,
  listenToAuthState,
  registerWithFirebase,
  signInWithFirebase
} from '../../util/firebase'

// Create a context for Firebase authentication with a defined shape
const FirebaseAuthContext = createContext({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  error: null,
  registerUser: async (email, password, profileData = {}) => {},
  loginUser: async (email, password) => {}
})

/**
 * Hook to use Firebase authentication context
 */
export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext)
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}

/**
 * Firebase Authentication Provider component
 * Similar to Auth0Provider but for Firebase Authentication
 */
const FirebaseAuthProvider = ({ children, config }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  
  // Initialize Firebase when the component mounts
  useEffect(() => {
    try {
      // Only initialize if config is provided
      if (config) {
        initializeFirebase(config)
        
        // Set up auth state listener
        const unsubscribe = listenToAuthState((firebaseUser) => {
          setIsLoading(false)
          
          if (firebaseUser) {
            // User is signed in
            setIsAuthenticated(true)
            setUser(convertFirebaseUserToAppUser(firebaseUser))
          } else {
            // User is signed out
            setIsAuthenticated(false)
            setUser(null)
          }
        })
        
        // Clean up listener on unmount
        return () => unsubscribe()
      } else {
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Error initializing Firebase:', err)
      setError(err)
      setIsLoading(false)
    }
  }, [config])
  
  // Register a new user with email/password and additional user data
  const registerUser = async (email, password, profileData = {}) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await registerWithFirebase(email, password, profileData)
      // After registration, the auth state listener will update the state
      // Return the user result for further processing if needed
      return result
    } catch (err) {
      setError(err)
      setIsLoading(false)
      throw err
    }
  }
  
  // Login user function - to be added directly to the context
  const loginUser = async (email, password) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signInWithFirebase(email, password)
      // Auth state listener will update the state
      return result
    } catch (err) {
      setError(err)
      setIsLoading(false)
      throw err
    }
  }
  
  // Value to provide to consumers
  const contextValue = {
    isLoading,
    isAuthenticated,
    user,
    error,
    registerUser,
    loginUser
  }
  
  return (
    <FirebaseAuthContext.Provider value={contextValue}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

FirebaseAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.object
}

export default FirebaseAuthProvider 