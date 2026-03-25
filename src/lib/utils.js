import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const ROLE_DISPLAY_NAMES = {
  ROLE_USER: 'User',
  ROLE_ADMIN: 'Admin',
  ROLE_SUPER_ADMIN: 'Super Admin',
}

export function roleDisplayName(role) {
  return ROLE_DISPLAY_NAMES[role] || role
}

const GAME_TYPE_DISPLAY_NAMES = {
  exploding_kittens: 'Exploding Kittens',
  geohunter: 'GeoHunter',
  blindhike: 'Blind Hike',
  resource_run: 'Resource Run',
  territory_control: 'Territory Control',
  market_crash: 'Market Crash',
  crazy_88: 'Crazy 88',
  courier_rush: 'Courier Rush',
  echo_hunt: 'Echo Hunt',
  checkpoint_heist: 'Checkpoint Heist',
  pandemic_response: 'Pandemic Response',
  birds_of_prey: 'Birds of Prey',
  code_conspiracy: 'Code Conspiracy',
}

export function gameTypeDisplayName(type) {
  return GAME_TYPE_DISPLAY_NAMES[type] || type
}

export function formatDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString()
}

export function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

export function toCsvValue(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}
