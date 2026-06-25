import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Sets the document title based on the current route.
 * Add this component inside <BrowserRouter> to auto-update <title> on navigation.
 */

const ROUTE_TITLES = {
  '/': 'BuyBack Elite – Sell MacBook & iPad at Best Price',
  '/shop': 'Shop Pre-Owned Devices | BuyBack Elite',
  '/stores': 'Find Stores Near You | BuyBack Elite',
  '/login': 'Login | BuyBack Elite',
  '/register': 'Create Account | BuyBack Elite',
  '/reset-password': 'Reset Password | BuyBack Elite',
  '/privacy-policy': 'Privacy Policy | BuyBack Elite',
  '/terms-of-service': 'Terms of Service | BuyBack Elite',
  '/about-us': 'About Us | BuyBack Elite',
  '/delete-account': 'Delete Account | BuyBack Elite',
  '/dashboard': 'Dashboard | BuyBack Elite',
  '/dashboard/sell': 'Sell Your Device | BuyBack Elite',
  '/dashboard/requests': 'My Sell Requests | BuyBack Elite',
  '/dashboard/profile': 'My Profile | BuyBack Elite',
  '/dashboard/notifications': 'Notifications | BuyBack Elite',
  '/dashboard/support': 'Support | BuyBack Elite',
  '/dashboard/shop': 'Shop Pre-Owned Devices | BuyBack Elite',
  '/dashboard/stores': 'Find Stores | BuyBack Elite',
}

const DEFAULT_TITLE = 'BuyBack Elite – Sell MacBook & iPad at Best Price'

export default function PageTitle() {
  const location = useLocation()

  useEffect(() => {
    // Try exact match first, then path prefix for dynamic routes
    const title = ROUTE_TITLES[location.pathname]
      || (location.pathname.startsWith('/dashboard/requests/') ? 'Request Details | BuyBack Elite' : null)
      || (location.pathname.startsWith('/stores/') ? 'Store | BuyBack Elite' : null)
      || DEFAULT_TITLE

    document.title = title
  }, [location.pathname])

  return null
}
