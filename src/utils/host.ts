import { headers } from 'next/headers';

export async function getHostFromHeaders(_headers?: Headers): Promise<string> {
  const headersObject = _headers ?? (await headers());
  const host = headersObject.get('host');

  if (host === null) {
    throw new Error('Host header not found');
  }

  return host;
}

export async function getBaseUrlFromHeaders(_headers?: Headers): Promise<string> {
  const host = await getHostFromHeaders(_headers);

  const localhosts = ['localhost:3000', '127.0.0.1:3000'];
  const protocol = localhosts.includes(host) ? 'http' : 'https';
  const baseUrl = new URL(`${protocol}://${host}`);

  return baseUrl.toString();
}
