import { connect } from 'react-redux'
import { Redirect, Route } from 'react-router-dom'
import PropTypes from 'prop-types'
import React from 'react'

import { isFirebaseEnabled } from '../../util/auth'
import { LOGIN_PATH } from '../../util/constants'

import { useFirebaseAuth } from './firebase-auth-provider'

/**
 * Protected route component that checks if user is authenticated
 * Redirects to login page if not authenticated
 */
const ProtectedRoute = ({
  component: Component,
  render,
  useFirebase,
  ...rest
}) => {
  const firebaseAuth = useFirebaseAuth()

  // If using firebase, check authentication status
  const isAuthenticated = useFirebase ? firebaseAuth.isAuthenticated : true // If not using firebase, assume authenticated (will be handled by Auth0)

  // Handle loading state - while checking auth status, show nothing
  if (useFirebase && firebaseAuth.isLoading) {
    return null // Or a loading spinner if preferred
  }

  return (
    <Route
      {...rest}
      render={(props) => {
        // If authenticated, render the component or use the render prop
        if (isAuthenticated) {
          return Component ? <Component {...props} /> : render(props)
        }

        // If not authenticated, redirect to login with the current path as a redirect parameter
        const redirectUrl = encodeURIComponent(
          props.location.pathname + props.location.search
        )
        return (
          <Redirect
            to={{
              pathname: LOGIN_PATH,
              search: `${redirectUrl}`,
              state: { from: props.location }
            }}
          />
        )
      }}
    />
  )
}

ProtectedRoute.propTypes = {
  component: PropTypes.elementType,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string
  }),
  render: PropTypes.func,
  useFirebase: PropTypes.bool
}

// Connect to Redux to check if Firebase is enabled
const mapStateToProps = (state) => {
  return {
    useFirebase: isFirebaseEnabled(state.otp.config.persistence)
  }
}

export default connect(mapStateToProps)(ProtectedRoute)
