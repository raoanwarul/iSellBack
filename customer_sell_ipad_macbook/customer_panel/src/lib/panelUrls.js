/**
 * Panel URL Configuration
 * Auto-detects local dev vs production and returns correct URLs
 * for Admin (Store) and Agent panels.
 */

const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
)

export const PANEL_URLS = {
  admin: isLocalDev ? 'http://localhost:3000' : 'https://control.buybackelite.com',
  agent: isLocalDev ? 'http://localhost:3002' : 'https://field.buybackelite.com',
}

export const adminUrl = (path = '') => `${PANEL_URLS.admin}${path}`
export const agentUrl = (path = '') => `${PANEL_URLS.agent}${path}`
