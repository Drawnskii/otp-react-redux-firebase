import { useAuth0 } from '@auth0/auth0-react'
import { Link, useLocation } from 'react-router-dom'
import { FormattedMessage, useIntl } from 'react-intl'
import React, { FormEvent, useCallback, useState, useEffect } from 'react'
import styled from 'styled-components'

import { getCurrentRoute } from '../../util/ui'
import { signInWithFirebase } from '../../util/firebase'
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

const RegisterLink = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`

// Login view component props
interface LoginViewProps {
  useFirebase: boolean
}

/**
 * Login view component
 */
const LoginView = ({ useFirebase }: LoginViewProps): JSX.Element => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const handleAuth0Login = useCallback(() => {
    loginWithRedirect({
      appState: { returnTo: getRedirectUrl() },
      ui_locales: auth0Locale
    })
  }, [loginWithRedirect, auth0Locale])

  interface FirebaseError {
    code?: string;
    message: string;
  }

  const handleFirebaseLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use the context's loginUser method instead of directly calling the utility
      await firebaseAuth.loginUser(email, password);
      
      // After successful login, redirect to the intended destination
      const redirectTo = getRedirectUrl();
      
      // Create a small delay to ensure Firebase has time to complete the auth process
      setTimeout(() => {
        window.location.href = redirectTo.startsWith('/') 
          ? `/#${redirectTo}` 
          : `/#/${redirectTo}`;
      }, 500);
      
    } catch (err) {
      console.error('Firebase login error:', err);
      
      // Provide more specific error messages based on Firebase error codes
      let errorMessage = intl.formatMessage({ 
        id: 'components.LoginView.invalidCredentials', 
        defaultMessage: 'Invalid email or password' 
      });
      
      // Type guard to check if the error is a Firebase error with a code
      const firebaseError = err as FirebaseError;
      
      // Handle specific Firebase error cases
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = intl.formatMessage({ 
          id: 'components.LoginView.invalidCredentials', 
          defaultMessage: 'Invalid email or password' 
        });
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = intl.formatMessage({ 
          id: 'components.LoginView.tooManyAttempts', 
          defaultMessage: 'Too many failed login attempts. Please try again later or reset your password.' 
        });
      } else if (firebaseError.code === 'auth/user-disabled') {
        errorMessage = intl.formatMessage({ 
          id: 'components.LoginView.accountDisabled', 
          defaultMessage: 'This account has been disabled. Please contact support.' 
        });
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [email, password, firebaseAuth, intl, getRedirectUrl]);

  const handleLogin = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setError('')
      
      // Client-side validation
      if (!email || !password) {
        setError(intl.formatMessage({ id: 'components.LoginView.fieldsRequired', defaultMessage: 'Email and password are required' }))
        setIsLoading(false)
        return
      }
      
      // Use appropriate authentication method
      if (useFirebase) {
        handleFirebaseLogin()
      } else {
        handleAuth0Login()
      }
    },
    [email, password, useFirebase, handleAuth0Login, handleFirebaseLogin, intl]
  )

  return (
    <Container>
      <Title>
        <FormattedMessage id="components.LoginView.title" defaultMessage="Sign In" />
      </Title>
      
      <Form onSubmit={handleLogin}>
        <FormGroup>
          <Label htmlFor="email">
            <FormattedMessage id="components.LoginView.email" defaultMessage="Email" />
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={intl.formatMessage({ id: 'components.LoginView.emailPlaceholder', defaultMessage: 'Enter your email' })}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="password">
            <FormattedMessage id="components.LoginView.password" defaultMessage="Password" />
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={intl.formatMessage({ id: 'components.LoginView.passwordPlaceholder', defaultMessage: 'Enter your password' })}
            required
          />
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <FormattedMessage id="components.LoginView.signingIn" defaultMessage="Signing in..." />
          ) : (
            <FormattedMessage id="components.LoginView.signIn" defaultMessage="Sign In" />
          )}
        </Button>
      </Form>
      
      <RegisterLink>
        <FormattedMessage
          id="components.LoginView.noAccount"
          defaultMessage="Don't have an account? {registerLink}"
          values={{
            registerLink: (
              <Link to="/register">
                <FormattedMessage id="components.LoginView.register" defaultMessage="Register" />
              </Link>
            )
          }}
        />
      </RegisterLink>
    </Container>
  )
}

// Connect to Redux to check if Firebase is enabled in config
const mapStateToProps = (state: AppReduxState) => {
  return {
    useFirebase: isFirebaseEnabled(state.otp.config.persistence)
  }
}

export default connect(mapStateToProps)(LoginView) 