import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  logRefParams(searchParams);

  return NextResponse.next();
}

function logRefParams(searchParams: URLSearchParams) {
  const ref = searchParams.get('ref');

  if (ref !== null) {
    console.info('logged ref', ref);
  }
}
