import { google } from 'googleapis';

export const SHEET = process.env.SHEET_NAME || 'emirates-car-sheet';

function cleanKey(raw = '') {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '') // strip wrapping quotes
    .replace(/\\\\n/g, '\n')     // double-escaped \\n
    .replace(/\\n/g, '\n');      // literal \n
}

export function sheetsClient() {
  const creds = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
  const auth = new google.auth.JWT(creds.client_email, null, creds.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  return { sheets: google.sheets({ version: 'v4', auth }), id: process.env.EMIRATES_CAR_DATABASE_ID };
}
function parseStamp(s = '') {
  // 2026-1-1 0:04:54  (Y-M-D)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  // 9/21/2024 2:09:53  (M/D/Y)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[1] - 1, +m[2], +(m[4] || 0), +(m[5] || 0));
  return null;
}

export async function readLeads(months = 2) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const { sheets, id } = sheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `'${SHEET}'` });

  return (res.data.values || [])
    .map((r, i) => ({
      row: i + 1,
      timestamp: r[0] || '',
      ref: r[1] || '',
      email: r[2] || '',
      brand: r[3] || '',
      contact: r[4] || '',
      description: r[5] || '',
      partList: r[6] || '',
      year: r[7] || '',
      model: r[8] || '',
      address: r[9] || '',
      sent: r[20] || '',
    }))
    .filter((l) => /^\d{5,}$/.test(l.ref))
    .filter((l) => {
      if (!months) return true; // months = 0 means no limit
      const d = parseStamp(l.timestamp);
      return !d || d >= cutoff; // unreadable dates stay visible
    })
    .reverse();
}

export async function markSent(row, text) {
  const { sheets, id } = sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `'${SHEET}'!U${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[text]] },
  });
}

export const authorized = (req) =>
  !!process.env.DASHBOARD_PASSWORD && req.headers.get('x-dashboard-key') === process.env.DASHBOARD_PASSWORD;
