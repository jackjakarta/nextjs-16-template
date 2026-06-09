export function extractSubdomainsWithNoTld(url: string): string {
  const { hostname } = new URL(url);
  const parts = hostname.split('.');

  if (parts.at(0) === 'www' && parts.length > 2) {
    return parts.slice(1, -1).join('.');
  }

  return parts.slice(0, -1).join('.');
}
