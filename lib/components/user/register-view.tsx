import { useAuth0 } from '@auth0/auth0-react'
import { Link, useLocation } from 'react-router-dom'
import { FormattedMessage, useIntl } from 'react-intl'
import React, { FormEvent, useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'

import { getCurrentRoute } from '../../util/ui'
import { registerWithFirebase } from '../../util/firebase'
import { useFirebaseAuth } from './firebase-auth-provider'
import { connect } from 'react-redux'
import { AppReduxState } from '../../util/state-types'
import { isFirebaseEnabled } from '../../util/auth'

const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`

const Title = styled.h1`
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
`

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`

const Button = styled.button`
  background-color: #1976d2;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  margin-top: 0.5rem;

  &:hover {
    background-color: #1565c0;
  }

  &:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`

const LoginLink = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`

// Register view component props
interface RegisterViewProps {
  useFirebase: boolean
}

/**
 * Register view component
 */
const RegisterView = ({ useFirebase }: RegisterViewProps): JSX.Element => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  // Auth0 hook for Auth0 authentication
  const { loginWithRedirect } = useAuth0()
  // Firebase auth hook for Firebase authentication
  const firebaseAuth = useFirebaseAuth()
  const intl = useIntl()

  // For Chinese (Simplified), we must pass 'zh-CN' to auth0.
  // Unlike 'fr', 'zh' alone is not recognized and falls back to English.
  const auth0Locale = intl.locale === 'zh' ? 'zh-CN' : intl.locale

  // Get redirect URL from query parameter or use the root path
  const getRedirectUrl = () => {
    const params = new URLSearchParams(location.search)
    const redirectParam = params.get('redirect')
    return redirectParam ? decodeURIComponent(redirectParam) : '/'
  }

  // Handle Firebase authentication if user is already logged in
  useEffect(() => {
    if (useFirebase && firebaseAuth.isAuthenticated) {
      // If user is already authenticated, redirect to the intended destination
      const redirectTo = getRedirectUrl()
      window.location.href = redirectTo.startsWith('/') 
        ? `/#${redirectTo}` 
        : `/#/${redirectTo}`
    }
  }, [useFirebase, firebaseAuth.isAuthenticated])

  const handleAuth0Register = useCallback(() => {
    loginWithRedirect({
      appState: { returnTo: getRedirectUrl() },
      authorizationParams: {
        screen_hint: 'signup'
      },
      ui_locales: auth0Locale
    })
  }, [loginWithRedirect, auth0Locale])

  interface FirebaseError {
    code?: string;
    message: string;
  }

  const handleFirebaseRegister = useCallback(async () => {
    try {
      setIsLoading(true)
      // Pass the name as displayName in the profile data
      await firebaseAuth.registerUser(email, password, { displayName: name })
      
      // After successful registration, show success message and redirect
      const redirectTo = getRedirectUrl()
      
      // Create a small delay to ensure Firebase has time to complete the auth process
      setTimeout(() => {
        window.location.href = redirectTo.startsWith('/') 
          ? `/#${redirectTo}` 
          : `/#/${redirectTo}`
      }, 500)
      
    } catch (err) {
      console.error('Firebase registration error:', err)
      
      // Provide more specific error messages based on Firebase error codes
      let errorMessage = intl.formatMessage({ 
        id: 'components.RegisterView.registrationError', 
        defaultMessage: 'Registration failed. Please try again.' 
      })
      
      // Type guard to check if the error is a Firebase error with a code
      const firebaseError = err as FirebaseError
      
      // Handle specific Firebase error cases
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = intl.formatMessage({ 
          id: 'components.RegisterView.emailInUse', 
          defaultMessage: 'This email is already registered. Please use a different email or sign in.' 
        })
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = intl.formatMessage({ 
          id: 'components.RegisterView.weakPassword', 
          defaultMessage: 'Password is too weak. Please use a stronger password.' 
        })
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = intl.formatMessage({ 
          id: 'components.RegisterView.invalidEmail', 
          defaultMessage: 'Please enter a valid email address.' 
        })
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [email, password, name, firebaseAuth, intl, getRedirectUrl])

  const handleRegister = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setError('')

      // Client-side validation
      if (!name || !email || !password || !confirmPassword) {
        setError(intl.formatMessage({ 
          id: 'components.RegisterView.fieldsRequired',
          defaultMessage: 'All fields are required' 
        }))
        setIsLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError(intl.formatMessage({ 
          id: 'components.RegisterView.passwordMismatch',
          defaultMessage: 'Passwords do not match' 
        }))
        setIsLoading(false)
        return
      }

      // Use appropriate registration method
      if (useFirebase) {
        handleFirebaseRegister()
      } else {
        handleAuth0Register()
      }
    },
    [name, email, password, confirmPassword, useFirebase, handleAuth0Register, handleFirebaseRegister, intl]
  )

  return (
    <Container>
      <Title>
        <FormattedMessage id="components.RegisterView.title" defaultMessage="Create an Account" />
      </Title>

      <Form onSubmit={handleRegister}>
        <FormGroup>
          <Label htmlFor="name">
            <FormattedMessage id="components.RegisterView.name" defaultMessage="Name" />
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={intl.formatMessage({ id: 'components.RegisterView.namePlaceholder', defaultMessage: 'Enter your name' })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">
            <FormattedMessage id="components.RegisterView.email" defaultMessage="Email" />
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={intl.formatMessage({ id: 'components.RegisterView.emailPlaceholder', defaultMessage: 'Enter your email' })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">
            <FormattedMessage id="components.RegisterView.password" defaultMessage="Password" />
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={intl.formatMessage({ id: 'components.RegisterView.passwordPlaceholder', defaultMessage: 'Enter your password' })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">
            <FormattedMessage id="components.RegisterView.confirmPassword" defaultMessage="Confirm Password" />
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={intl.formatMessage({ id: 'components.RegisterView.confirmPasswordPlaceholder', defaultMessage: 'Confirm your password' })}
            required
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <FormattedMessage id="components.RegisterView.registering" defaultMessage="Registering..." />
          ) : (
            <FormattedMessage id="components.RegisterView.register" defaultMessage="Register" />
          )}
        </Button>
      </Form>

      <LoginLink>
        <FormattedMessage
          id="components.RegisterView.haveAccount"
          defaultMessage="Already have an account? {loginLink}"
          values={{
            loginLink: (
              <Link to="/login">
                <FormattedMessage id="components.RegisterView.login" defaultMessage="Sign In" />
              </Link>
            )
          }}
        />
      </LoginLink>
    </Container>
  )
}

// Connect to Redux to check if Firebase is enabled in config
const mapStateToProps = (state: AppReduxState) => {
  return {
    useFirebase: isFirebaseEnabled(state.otp.config.persistence)
  }
}

export default connect(mapStateToProps)(RegisterView) 