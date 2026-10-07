import { NextResponse } from 'next/server';
import { readLeads, markSent, authorized } from '@/lib/sheets';
import suppliers from '@/data/suppliers.json';

export const dynamic = 'force-dynamic';

const norm = (s) => String(s || '').trim().toLowerCase();

async function sendTemplate(to, text) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE || 'lead_enquiry',
        language: { code: process.env.WHATSAPP_LANG || 'en' },
        // Template variables can't contain line breaks
        components: [{ type: 'body', parameters: [{ type: 'text', text: text.replace(/\s*\n\s*/g, ' | ') }] }],
      },
    }),
  });
  const data = await res.json();
  return { ok: res.ok, error: data?.error?.message };
}

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });

  const { ref } = await req.json();
  // Re-read from the sheet so the browser can't change what gets sent
  const lead = (await readLeads(6)).find((l) => l.ref === String(ref));
  if (!lead) return NextResponse.json({ error: 'Lead not found in sheet' }, { status: 404 });

  const targets = suppliers.filter((s) => s.brands.some((b) => b === '*' || norm(b) === norm(lead.brand)));
  if (!targets.length) return NextResponse.json({ error: `No supplier handles ${lead.brand}` }, { status: 422 });

  // Customer name and phone are intentionally left out of the supplier message
  const text =
    `Enquiry ${lead.ref}\n` +
    `Vehicle: ${lead.year} ${lead.brand} ${lead.model}\n` +
    `Part: ${lead.partList}\n` +
    `Do you have it in stock? Please reply with price.`;

  const useApi = process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID;
  const results = [];

  for (const s of targets) {
    if (useApi) {
      const r = await sendTemplate(s.phone, text);
      results.push({ name: s.name, ok: r.ok, error: r.error });
    } else {
      results.push({ name: s.name, ok: true, link: `https://wa.me/${s.phone}?text=${encodeURIComponent(text)}` });
    }
  }

  const okNames = results.filter((r) => r.ok).map((r) => r.name);
  if (okNames.length) {
    const stamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' });
    await markSent(lead.row, `${useApi ? 'Sent' : 'Opened'} ${stamp} → ${okNames.join(', ')}`);
  }
  return NextResponse.json({ mode: useApi ? 'api' : 'links', results });
}
