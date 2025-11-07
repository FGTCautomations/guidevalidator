/**
 * Generate a secure token for profile completion links
 */

import { randomBytes } from 'crypto';

export function generateProfileCompletionToken(): string {
  // Generate a secure random token (32 bytes = 64 hex characters)
  return randomBytes(32).toString('hex');
}

export function generateProfileCompletionLink(token: string, locale: string = 'en'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/${locale}/onboarding/complete-profile?token=${token}`;
}
