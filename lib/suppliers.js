import { sheetsClient } from './sheets';
import seed from '@/data/suppliers.json';

const TAB = process.env.SUPPLIERS_TAB || 'suppliers';

async function ensureTab(sheets, id) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties.title' });
    if (!meta.data.sheets.some((s) => s.properties.title === TAB)) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: id,
            requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
        });
    }
}

export async function readSuppliers() {
    const { sheets, id } = sheetsClient();
    await ensureTab(sheets, id);
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `'${TAB}'` });
    if (!res.data.values) return seed; // empty tab: fall back to the JSON file
    return res.data.values
        .slice(1)
        .filter((r) => r[0] && r[1])
        .map((r) => ({
            name: r[0],
            phone: r[1],
            brands: (r[2] || '').split(',').map((b) => b.trim()).filter(Boolean),
        }));
}

export async function writeSuppliers(list) {
    const { sheets, id } = sheetsClient();
    await ensureTab(sheets, id);
    await sheets.spreadsheets.values.clear({ spreadsheetId: id, range: `'${TAB}'` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range: `'${TAB}'!A1`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [['name', 'phone', 'brands'], ...list.map((s) => [s.name, `'${s.phone}`.replace(/^'/, ''), s.brands.join(', ')])],
        },
    });
}