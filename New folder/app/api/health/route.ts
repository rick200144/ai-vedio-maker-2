export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.RUNWAYML_API_SECRET)
  });
}
