import { NextResponse } from 'next/server';
import { readLeads, authorized } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  try {
    return NextResponse.json({ leads: await readLeads() });
  } catch (e) {
    return NextResponse.json({ error: 'Could not read the sheet: ' + e.message }, { status: 500 });
  }
}
