import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Sets the document title based on the current agent route.
 */

const ROUTE_TITLES = {
  '/login': 'Login | BuyBack Elite Agent',
  '/reset-password': 'Reset Password | BuyBack Elite Agent',
  '/field-tech': 'Dashboard | BuyBack Elite Agent',
  '/field-tech/pickups': 'Pickups | BuyBack Elite Agent',
  '/field-tech/history': 'History | BuyBack Elite Agent',
  '/field-tech/profile': 'Profile | BuyBack Elite Agent',
}

const DEFAULT_TITLE = 'BuyBack Elite Agent'

export default function PageTitle() {
  const location = useLocation()

  useEffect(() => {
    // Exact match or fallback for dynamic pickup details route
    const title = ROUTE_TITLES[location.pathname]
      || (location.pathname.startsWith('/field-tech/pickups/') ? 'Pickup Details | BuyBack Elite Agent' : null)
      || DEFAULT_TITLE
    document.title = title
  }, [location.pathname])

  return null
}
