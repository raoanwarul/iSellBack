import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Sets the document title based on the current admin route.
 */

const ROUTE_TITLES = {
  '/': 'Dashboard | BuyBack Elite Admin',
  '/requests': 'Requests | BuyBack Elite Admin',
  '/price-engine': 'Price Engine | BuyBack Elite Admin',
  '/condition-deductions': 'Condition Deductions | BuyBack Elite Admin',
  '/fraud-alerts': 'Fraud Alerts | BuyBack Elite Admin',
  '/agents': 'Agents | BuyBack Elite Admin',
  '/notifications': 'Notifications | BuyBack Elite Admin',
  '/cashify-prices': 'Cashify Prices | BuyBack Elite Admin',
  '/listings': 'Listings | BuyBack Elite Admin',
  '/settings': 'Store Settings | BuyBack Elite Admin',
  '/login': 'Login | BuyBack Elite Admin',
  '/register': 'Register | BuyBack Elite Admin',
  '/verify-email': 'Verify Email | BuyBack Elite Admin',
  '/reset-password': 'Reset Password | BuyBack Elite Admin',
}

const DEFAULT_TITLE = 'BuyBack Elite Admin'

export default function PageTitle() {
  const location = useLocation()

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname] || DEFAULT_TITLE
    document.title = title
  }, [location.pathname])

  return null
}
