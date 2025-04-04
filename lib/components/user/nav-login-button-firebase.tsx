import React, { HTMLAttributes, useCallback } from 'react'

import { getCurrentRoute } from '../../util/ui'
import { getCurrentUser, signOutFromFirebase } from '../../util/firebase'
import { useFirebaseAuth } from './firebase-auth-provider'

import NavLoginButton from './nav-login-button'

type AccountLink = {
  messageId: string
  url: string
}

interface NavLoginButtonFirebaseProps extends HTMLAttributes<HTMLElement> {
  id: string
  links: Array<AccountLink>
}

/**
 * This component wraps NavLoginButton with Firebase authentication information.
 */
const NavLoginButtonFirebase = ({
  className,
  id,
  links,
  style
}: NavLoginButtonFirebaseProps): JSX.Element => {
  const { isAuthenticated, user } = useFirebaseAuth()

  // On login, preserve the current trip query if any.
  const handleLogin = useCallback(() => {
    // The login button will navigate to the login page
    // where the user can choose to sign in
    window.location.href = `/login?redirect=${encodeURIComponent(
      getCurrentRoute()
    )}`
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await signOutFromFirebase()
      // Redirect to the root page after logout
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  return (
    <NavLoginButton
      className={className}
      id={id}
      links={links}
      onSignInClick={handleLogin}
      onSignOutClick={handleLogout}
      profile={isAuthenticated ? user : null}
      style={style}
    />
  )
}

export default NavLoginButtonFirebase 