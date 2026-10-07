'use client';
import { useEffect, useState } from 'react';

const blank = { name: '', phone: '', brands: '' };
const input = 'border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700';

export default function Suppliers({ apiKey }) {
    const [list, setList] = useState([]);
    const [form, setForm] = useState(blank);
    const [editing, setEditing] = useState(null);
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);

    const headers = { 'Content-Type': 'application/json', 'x-dashboard-key': apiKey };

    useEffect(() => {
        fetch('/api/suppliers', { headers })
            .then((r) => r.json())
            .then((d) => (d.error ? setMsg(d.error) : setList(d.suppliers)));
    }, []);

    const persist = async (next) => {
        setBusy(true);
        setMsg('');
        const res = await fetch('/api/suppliers', { method: 'PUT', headers, body: JSON.stringify({ suppliers: next }) });
        const d = await res.json();
        setBusy(false);
        if (!res.ok) return setMsg(d.error) || false;
        setList(d.suppliers);
        setMsg('Saved');
        return true;
    };

    const submit = async (e) => {
        e.preventDefault();
        const s = {
            name: form.name,
            phone: form.phone,
            brands: form.brands.split(',').map((b) => b.trim()).filter(Boolean),
        };
        const next = editing === null ? [...list, s] : list.map((x, i) => (i === editing ? s : x));
        if (await persist(next)) { setForm(blank); setEditing(null); }
    };

    const edit = (i) => {
        setEditing(i);
        setForm({ ...list[i], brands: list[i].brands.join(', ') });
    };

    const remove = (i) => {
        if (confirm(`Delete ${list[i].name}?`)) persist(list.filter((_, j) => j !== i));
    };

    return (
        <section>
            <h2 className="text-xl font-semibold">Suppliers</h2>
            <p className="text-sm text-stone-500 mt-1">Leads are sent to every supplier whose brands include the lead's brand. Use * for all brands.</p>

            <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto] bg-white border border-stone-300 rounded-lg p-3">
                <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
                <input required placeholder="9715xxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
                <input required placeholder="Brands, comma separated" value={form.brands} onChange={(e) => setForm({ ...form, brands: e.target.value })} className={input} />
                <div className="flex gap-2">
                    <button disabled={busy} className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50">
                        {editing === null ? 'Add' : 'Update'}
                    </button>
                    {editing !== null && (
                        <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="border border-stone-300 rounded-md px-3 py-2 text-sm">
                            Cancel
                        </button>
                    )}
                </div>
            </form>
            {msg && <p className={`text-sm mt-2 ${msg === 'Saved' ? 'text-teal-700' : 'text-red-700'}`}>{msg}</p>}

            <ul className="mt-4 bg-white border border-stone-300 rounded-lg divide-y divide-stone-200">
                {list.map((s, i) => (
                    <li key={i} className="p-3 flex items-start justify-between gap-4">
                        <div>
                            <div className="font-medium">{s.name} <span className="text-stone-500 font-normal">+{s.phone}</span></div>
                            <div className="text-sm text-stone-600 mt-0.5">{s.brands.join(', ')}</div>
                        </div>
                        <div className="flex gap-3 text-sm shrink-0">
                            <button onClick={() => edit(i)} className="text-teal-700 hover:underline">Edit</button>
                            <button onClick={() => remove(i)} className="text-red-700 hover:underline">Delete</button>
                        </div>
                    </li>
                ))}
                {!list.length && <li className="p-6 text-center text-stone-500 text-sm">No suppliers yet.</li>}
            </ul>
        </section>
    );
}