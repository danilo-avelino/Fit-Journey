/** Keep the actual Chromium version and OS; omit wrapper product tokens that
 * cause sites to reject an otherwise supported browser as an unknown client. */
export function chromiumUserAgent(userAgent: string): string {
  return userAgent.replace(/\s(?:Electron|Mosaico|mosaico-desktop)\/[^\s]+/gi, '').trim();
}
