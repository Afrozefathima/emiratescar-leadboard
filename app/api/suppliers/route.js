import { NextResponse } from 'next/server';
import { authorized } from '@/lib/sheets';
import { readSuppliers, writeSuppliers } from '@/lib/suppliers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    if (!authorized(req)) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    try {
        return NextResponse.json({ suppliers: await readSuppliers() });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Replaces the full list; add, edit and delete all go through here
export async function PUT(req) {
    if (!authorized(req)) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    const { suppliers } = await req.json();
    const clean = (Array.isArray(suppliers) ? suppliers : []).map((s) => ({
        name: String(s.name || '').trim(),
        phone: String(s.phone || '').replace(/\D/g, ''),
        brands: (s.brands || []).map((b) => String(b).trim()).filter(Boolean),
    }));
    const bad = clean.find((s) => !s.name || s.phone.length < 8 || !s.brands.length);
    if (bad) return NextResponse.json({ error: 'Each supplier needs a name, a phone number and at least one brand' }, { status: 400 });
    try {
        await writeSuppliers(clean);
        return NextResponse.json({ suppliers: clean });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}