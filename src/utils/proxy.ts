import { type NextURL } from 'next/dist/server/web/next-url';

export function logRefParams(searchParams: URLSearchParams) {
  const ref = searchParams.get('ref');

  if (ref !== null) {
    console.info('logged ref', ref);
  }
}

export function getProxyRewriteUrl({
  headers,
  nextUrl,
}: {
  headers: Headers;
  nextUrl: NextURL;
}): NextURL | null {
  const hostname = headers.get('host');

  if (hostname === null) {
    return null;
  }

  if (hostname.startsWith('docs.')) {
    const url = nextUrl.clone();

    const _pathname = nextUrl.pathname === '/' ? '' : nextUrl.pathname;
    url.pathname = `/docs${_pathname}`;

    return url;
  }

  return null;
}
