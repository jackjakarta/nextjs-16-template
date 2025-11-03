import { headers } from 'next/headers';

export async function getHostFromHeaders() {
  const _headers = await headers();
  const host = _headers.get('host');

  if (host === null) {
    throw new Error('Host header not found');
  }

  return host;
}

export async function getBaseUrlFromHeaders() {
  const host = await getHostFromHeaders();
  const isLocalhost = host === 'localhost:3000' || host === '127.0.0.1:3000';
  const prefix = isLocalhost ? 'http' : 'https';
  const baseUrl = `${prefix}://${host}`;

  return baseUrl;
}

export async function checkIsLocalhost() {
  const host = await getHostFromHeaders();
  const isLocalhost = host === 'localhost:3000' || host === '127.0.0.1:3000';

  return isLocalhost;
}
