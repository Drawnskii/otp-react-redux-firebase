import React, { lazy } from 'react'

import { frame } from '../components/app/app-frame'
import AfterSignInScreen from '../components/user/after-signin-screen'
import RedirectWithQuery from '../components/form/redirect-with-query'
import withSuspense from '../components/util/with-suspense'
import ProtectedRoute from '../components/user/protected-route'

import {
  ACCOUNT_PATH,
  ACCOUNT_SETTINGS_PATH,
  CREATE_ACCOUNT_PATH,
  CREATE_ACCOUNT_PLACES_PATH,
  CREATE_ACCOUNT_VERIFY_PATH,
  LOGIN_PATH,
  MOBILITY_PATH,
  PLACES_PATH,
  REGISTER_PATH,
  TERMS_OF_SERVICE_PATH,
  TERMS_OF_STORAGE_PATH,
  TRIPS_PATH
} from './constants'

const SavedTripScreen = lazy(() =>
  import('../components/user/monitored-trip/saved-trip-screen')
)
const UserAccountScreen = lazy(() =>
  import('../components/user/user-account-screen')
)
const FavoritePlaceScreen = lazy(() =>
  import('../components/user/places/favorite-place-screen')
)
const SavedTripList = lazy(() =>
  import('../components/user/monitored-trip/saved-trip-list')
)
const LoginView = lazy(() => import('../components/user/login-view'))
const RegisterView = lazy(() => import('../components/user/register-view'))

/**
 * Contains mapping of the component(s) to display for each URL route.
 *
 * Note: This object is moved out of ResponsiveWebApp to avoid an error importing
 * a YML file from @opentripplanner/trip-details during the a11y build/test.
 */
// TODO: A number of these routes are ignored during a11y testing as no server mocks are available
const routes = [
  {
    exact: true,
    path: [
      // App root
      '/',
      // Load app with preset lat/lon/zoom and optional router
      // NOTE: All params will be cast to :id in matchContentToUrl due
      // to a quirk with react-router.
      // https://github.com/ReactTraining/react-router/issues/5870#issuecomment-394194338
      '/@/:latLonZoomRouter',
      '/start/:latLonZoomRouter',
      // Route viewer (and route ID).
      '/route',
      '/route/:id',
      '/route/:id/pattern/:patternId',
      // Stop viewer (and stop ID).
      '/schedule',
      '/schedule/:id',
      // Nearby View
      '/nearby',
      '/nearby/:latLon',
      // Trip Viewer
      '/trip/:id'
    ],
    // Use ProtectedRoute instead of setting shouldRenderWebApp
    // This will check if user is authenticated and redirect to login if not
    protectedRoute: true
  },
  {
    a11yIgnore: true,
    component: withSuspense(FavoritePlaceScreen),
    path: [`${CREATE_ACCOUNT_PLACES_PATH}/:id`, `${PLACES_PATH}/:id`],
    // Protect this route
    protectedRoute: true
  },
  {
    a11yIgnore: true,
    component: withSuspense(SavedTripScreen),
    path: `${TRIPS_PATH}/:id`,
    // Protect this route
    protectedRoute: true
  },
  {
    a11yIgnore: true,
    children: <RedirectWithQuery to={TRIPS_PATH} />,
    exact: true,
    path: ACCOUNT_PATH,
    // Protect this route
    protectedRoute: true
  },
  {
    a11yIgnore: true,
    children: <RedirectWithQuery to={CREATE_ACCOUNT_VERIFY_PATH} />,
    exact: true,
    path: CREATE_ACCOUNT_PATH,
    // Protect this route
    protectedRoute: true
  },
  {
    a11yIgnore: true,
    // This route lets new or existing users edit or set up their account.
    component: withSuspense(UserAccountScreen),
    path: [
      `${CREATE_ACCOUNT_PATH}/:step`,
      `${MOBILITY_PATH}/:step`,
      `${MOBILITY_PATH}/`,
      ACCOUNT_SETTINGS_PATH
    ],
    // Protect this route
    protectedRoute: true
  },
  {
    getContextComponent: (components) => frame(components.TermsOfService),
    path: TERMS_OF_SERVICE_PATH
  },
  {
    getContextComponent: (components) => frame(components.TermsOfStorage),
    path: TERMS_OF_STORAGE_PATH
  },
  {
    a11yIgnore: true,
    component: withSuspense(SavedTripList),
    path: TRIPS_PATH,
    // Protect this route
    protectedRoute: true
  },
  {
    a11yIgnore: true,
    // This route is called immediately after login by Auth0
    // and by the onRedirectCallback function from /lib/util/auth.js.
    // For new users, it displays the account setup form.
    // For existing users, it takes the browser back to the itinerary search prior to login.
    component: AfterSignInScreen,
    path: '/signedin'
  },
  {
    // Dedicated login view - public access
    component: withSuspense(LoginView),
    path: LOGIN_PATH
  },
  {
    // Dedicated register view - public access
    component: withSuspense(RegisterView),
    path: REGISTER_PATH
  }
]

export default routes
