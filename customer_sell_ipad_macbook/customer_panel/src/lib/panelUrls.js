/**
 * Panel URL Configuration
 * Auto-detects local dev vs production and returns correct URLs
 * for Admin (Store) and Agent panels.
 *
 * Set VITE_ADMIN_PANEL_URL and VITE_AGENT_PANEL_URL in Vercel env variables.
 */

const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
)

export const PANEL_URLS = {
  admin: isLocalDev
    ? 'http://localhost:3000'
    : (import.meta.env.VITE_ADMIN_PANEL_URL || 'https://control.buybackelite.com'),
  agent: isLocalDev
    ? 'http://localhost:3002'
    : (import.meta.env.VITE_AGENT_PANEL_URL || 'https://field.buybackelite.com'),
}

export const adminUrl = (path = '') => `${PANEL_URLS.admin}${path}`
export const agentUrl = (path = '') => `${PANEL_URLS.agent}${path}`
