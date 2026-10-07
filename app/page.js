'use client';
import { useEffect, useMemo, useState } from 'react';
import Suppliers from './Suppliers';

export default function Page() {
  const [key, setKey] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('pending');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [view, setView] = useState('leads');

  const load = async (k) => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/leads', { headers: { 'x-dashboard-key': k } });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      if (res.status === 401) { localStorage.removeItem('dkey'); setKey(''); }
      return;
    }
    localStorage.setItem('dkey', k);
    setKey(k);
    setLeads(data.leads);
  };

  useEffect(() => {
    const k = localStorage.getItem('dkey');
    if (k) load(k);
  }, []);

  const send = async (lead) => {
    setBusy(lead.ref);
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dashboard-key': key },
      body: JSON.stringify({ ref: lead.ref }),
    });
    const data = await res.json();
    setBusy('');
    if (!res.ok) return setToast(data.error);
    if (data.mode === 'links') data.results.forEach((r) => r.link && window.open(r.link, '_blank'));
    const failed = data.results.filter((r) => !r.ok);
    setToast(
      failed.length
        ? `Failed for ${failed.map((f) => f.name + (f.error ? ` (${f.error})` : '')).join(', ')}`
        : `Sent to ${data.results.map((r) => r.name).join(', ')}`
    );
    load(key);
  };

  const shown = useMemo(
    () =>
      leads.filter((l) => {
        if (tab === 'pending' && l.sent) return false;
        if (tab === 'sent' && !l.sent) return false;
        return `${l.ref} ${l.brand} ${l.model} ${l.partList} ${l.address}`.toLowerCase().includes(q.toLowerCase());
      }),
    [leads, q, tab]
  );
  const sentCount = leads.filter((l) => l.sent).length;

  if (!key)
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-sm bg-white border border-stone-300 rounded-lg p-6">
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-sm text-stone-500 mt-1">Enter the dashboard password.</p>
          <input
            type="password"
            autoFocus
            placeholder="Password"
            onKeyDown={(e) => e.key === 'Enter' && load(e.target.value)}
            className="mt-4 w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
          {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
        </div>
      </main>
    );
  if (view === 'suppliers')
    return (
      <main className="max-w-3xl mx-auto p-4 sm:p-8">
        <button onClick={() => setView('leads')} className="text-sm text-teal-700 mb-4">← Back to leads</button>
        <Suppliers apiKey={key} />
      </main>
    );

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-stone-500 mt-1">
            {leads.length} total · {leads.length - sentCount} waiting · {sentCount} sent to suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, part, ref"
            className="border border-stone-300 bg-white rounded-md px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
          <button onClick={() => load(key)} className="border border-stone-300 bg-white rounded-md px-3 py-2 text-sm hover:bg-stone-50">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button onClick={() => setView('suppliers')} className="border border-stone-300 bg-white rounded-md px-3 py-2 text-sm hover:bg-stone-50">
            Suppliers
          </button>
        </div>
      </header>

      <nav className="mt-6 flex gap-1 border-b border-stone-300">
        {[['pending', 'Waiting'], ['sent', 'Sent'], ['all', 'All']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 ${tab === id ? 'border-teal-700 font-medium' : 'border-transparent text-stone-500'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-4 bg-white border border-stone-300 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500 bg-stone-50">
            <tr>
              <th className="p-3 font-medium">Ref</th>
              <th className="p-3 font-medium">Vehicle</th>
              <th className="p-3 font-medium">Part</th>
              <th className="p-3 font-medium">City</th>
              <th className="p-3 font-medium">Received</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.ref} className="border-t border-stone-200 align-top">
                <td className="p-3 whitespace-nowrap">{l.ref}</td>
                <td className="p-3">
                  <div className="font-medium">{l.brand}</div>
                  <div className="text-stone-500">{l.year} {l.model}</div>
                </td>
                <td className="p-3 max-w-xs">{l.partList}</td>
                <td className="p-3">{l.address}</td>
                <td className="p-3 whitespace-nowrap text-stone-500">{l.timestamp}</td>
                <td className="p-3 text-xs text-stone-600 max-w-[180px]">{l.sent || <span className="text-amber-700">Not sent</span>}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => send(l)}
                    disabled={busy === l.ref}
                    className={`rounded-md px-3 py-1.5 font-medium disabled:opacity-50 ${l.sent ? 'border border-stone-300 hover:bg-stone-50' : 'bg-teal-700 text-white hover:bg-teal-800'}`}
                  >
                    {busy === l.ref ? 'Sending…' : l.sent ? 'Send again' : 'Send'}
                  </button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={7} className="p-8 text-center text-stone-500">{loading ? 'Loading leads…' : 'No leads here.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div role="status" onClick={() => setToast('')} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm rounded-md px-4 py-3 shadow-lg cursor-pointer">
          {toast}
        </div>
      )}
    </main>
  );
}
