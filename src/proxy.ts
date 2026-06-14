import { NextRequest, NextResponse } from 'next/server';

import { getProxyRewriteUrl, logRefParams } from './utils/proxy';

export function proxy(req: NextRequest) {
  const { headers, nextUrl } = req;
  const rewriteUrl = getProxyRewriteUrl({ headers, nextUrl });

  logRefParams(nextUrl.searchParams);

  if (rewriteUrl !== null) {
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};
