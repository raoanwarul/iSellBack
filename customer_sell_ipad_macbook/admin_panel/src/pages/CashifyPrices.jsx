import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ExternalLink, Plus, Trash2, Save, RefreshCw, Laptop, Tablet, TrendingUp, ArrowRightLeft, Zap, CheckCircle2, AlertTriangle } from 'lucide-react'

const MACBOOK_MODELS = [
  'MacBook Air M1 (2020)', 'MacBook Air M2 (2022)', 'MacBook Air M2 15-inch (2023)',
  'MacBook Air M3 (2024)', 'MacBook Air M4 (2025)', 'MacBook Air Mid 2017 (Intel)',
  'MacBook Pro 2020 (Intel)', 'MacBook Pro M1 Pro 14-inch (2021)',
  'MacBook Pro M1 Max 14-inch (2021)', 'MacBook Pro M1 Max 16-inch (2021)',
  'MacBook Pro M2 13-inch (2022)', 'MacBook Pro M2 Pro 14-inch (2023)',
  'MacBook Pro M2 Pro 16-inch (2023)', 'MacBook Pro M2 Max 14-inch (2023)',
  'MacBook Pro M2 Max 16-inch (2023)', 'MacBook Pro M3 14-inch (2024)',
  'MacBook Pro M3 Pro 14-inch (2024)', 'MacBook Pro M3 Pro 16-inch (2024)',
  'MacBook Pro M3 Max 14-inch (2024)', 'MacBook Pro M3 Max 16-inch (2024)',
  'MacBook Pro M4 Pro 14-inch (2025)', 'MacBook Pro M4 Pro 16-inch (2025)',
  'MacBook Pro M4 Max 14-inch (2025)', 'MacBook Pro M4 Max 16-inch (2025)',
]

const IPAD_MODELS = [
  'iPad 9.7-inch (2018) 6th Gen', 'iPad 10.2-inch (2019) 7th Gen',
  'iPad 10.2-inch (2020) 8th Gen', 'iPad 10.2-inch (2021) 9th Gen',
  'iPad 10.9-inch (2022) 10th Gen', 'iPad 11-inch (2025)',
  'iPad Air 4th Gen (2020)', 'iPad Air 5th Gen M1 (2022)',
  'iPad Pro 11-inch M1 (2021)', 'iPad Pro 12.9-inch M1 (2021)',
  'iPad Pro 11-inch M2 (2022)', 'iPad Pro 12.9-inch M2 (2022)',
  'iPad Pro 11-inch M4 (2024)', 'iPad Pro 13-inch M4 (2024)',
  'iPad Pro M4 (2024)', 'iPad Mini 5th Gen (2019)', 'iPad Mini 6th Gen (2021)',
]

function getCashifyUrl(modelName, deviceType) {
  const slug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (deviceType === 'MacBook') return `https://www.cashify.in/sell-old-laptop/used-apple-${slug}`
  return `https://www.cashify.in/sell-old-tablet/used-apple-${slug}`
}

export default function CashifyPrices() {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ model_name: '', device_type: 'MacBook', storage: '', ram: '', min_price: '', max_price: '', notes: '' })
  const [filter, setFilter] = useState('all')

  const showMessage = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const fetchPrices = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('cashify_reference_prices').select('*').order('device_type').order('model_name')
    if (!error) setPrices(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPrices() }, [])

  const handleAdd = async () => {
    if (!form.model_name || !form.min_price || !form.max_price) { showMessage('e', 'Fill model name, min and max price'); return }
    setSaving(true)
    const { error } = await supabase.from('cashify_reference_prices').insert({
      ...form,
      min_price: parseInt(form.min_price) || 0,
      max_price: parseInt(form.max_price) || 0,
      cashify_url: getCashifyUrl(form.model_name, form.device_type),
      last_updated: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { showMessage('e', 'Error: ' + error.message); return }
    showMessage('s', 'Price added!')
    setShowAdd(false)
    setForm({ model_name: '', device_type: 'MacBook', storage: '', ram: '', min_price: '', max_price: '', notes: '' })
    fetchPrices()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this price reference?')) return
    await supabase.from('cashify_reference_prices').delete().eq('id', id)
    fetchPrices()
  }

  const handleInlineEdit = async (row, field, value) => {
    const updateData = { [field]: ['min_price', 'max_price'].includes(field) ? parseInt(value) || 0 : value, last_updated: new Date().toISOString() }
    await supabase.from('cashify_reference_prices').update(updateData).eq('id', row.id)
    setPrices(prev => prev.map(p => p.id === row.id ? { ...p, ...updateData } : p))
  }

  // ===== SYNC CASHIFY PRICES → PRICE ENGINE =====
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [fetching, setFetching] = useState(false)

  // Auto-fetch latest prices from Cashify via Vercel API route
  const fetchFromCashify = async () => {
    if (!confirm('Fetch latest prices directly from Cashify website?\n\nThis calls a serverless function that scrapes Cashify and updates prices automatically.')) return
    setFetching(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/sync-cashify', { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Fetch failed')
      showMessage('s', data.message || 'Prices updated from Cashify!')
      setSyncResult({ success: true, updated: data.results?.filter(r => r.status === 'updated').length || 0, inserted: 0, skipped: data.results?.filter(r => r.status === 'failed').length || 0, source: 'cashify' })
      fetchPrices() // Reload table
    } catch (err) {
      showMessage('e', 'Cashify fetch failed: ' + (err.message || 'Server error'))
      setSyncResult({ success: false, error: err.message || 'API route error' })
    }
    setFetching(false)
  }

  const syncToPriceEngine = async () => {
    if (!confirm('Sync Cashify max_price as base_price to Price Engine?\n\nThis will UPDATE existing entries and INSERT new ones.')) return
    setSyncing(true)
    setSyncResult(null)
    try {
      // Get current price_engine entries
      const { data: engineData } = await supabase.from('price_engine').select('id, model_name, base_price, device_type')
      const engineMap = {}
      ;(engineData || []).forEach(e => { engineMap[e.model_name.toLowerCase().trim()] = e })

      let updated = 0, inserted = 0, skipped = 0

      for (const cashify of prices) {
        const key = cashify.model_name.toLowerCase().trim()
        const newBase = cashify.max_price // Use max_price as base (excellent condition)

        if (engineMap[key]) {
          // Update existing
          if (engineMap[key].base_price !== newBase) {
            await supabase.from('price_engine').update({ base_price: newBase, updated_at: new Date().toISOString() }).eq('id', engineMap[key].id)
            updated++
          } else {
            skipped++
          }
        } else {
          // Insert new entry into price_engine
          const { error } = await supabase.from('price_engine').insert({
            model_name: cashify.model_name,
            device_type: cashify.device_type,
            base_price: newBase,
            scrap_value: Math.round(newBase * 0.15), // 15% of base as scrap
            is_active: true,
          })
          if (!error) inserted++
          else skipped++
        }
      }

      setSyncResult({ success: true, updated, inserted, skipped })
      showMessage('s', `Synced! ${updated} updated, ${inserted} new, ${skipped} unchanged`)
    } catch (err) {
      setSyncResult({ success: false, error: err.message })
      showMessage('e', 'Sync failed: ' + err.message)
    }
    setSyncing(false)
  }

  const filtered = prices.filter(p => filter === 'all' || p.device_type === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" /> Cashify Reference Prices
          </h1>
          <p className="text-sm text-gray-500 mt-1">Market reference prices from Cashify — use to compare & set fair offers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPrices} className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <a href="https://www.cashify.in/sell-old-laptop/sell-apple-macbook" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
            <ExternalLink className="w-4 h-4" /> View MacBooks on Cashify
          </a>
          <a href="https://www.cashify.in/sell-old-tablet/sell-apple" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50">
            <ExternalLink className="w-4 h-4" /> View iPads on Cashify
          </a>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
            <Plus className="w-4 h-4" /> Add Price
          </button>
          <button onClick={syncToPriceEngine} disabled={syncing || prices.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50">
            <ArrowRightLeft className="w-4 h-4" /> {syncing ? 'Syncing...' : 'Sync → Price Engine'}
          </button>
          <button onClick={fetchFromCashify} disabled={fetching}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50">
            <Zap className="w-4 h-4" /> {fetching ? 'Fetching...' : 'Auto-Fetch Cashify'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 's' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['all', 'MacBook', 'iPad'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === f ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {f === 'all' ? 'All Devices' : f === 'MacBook' ? <span className="flex items-center gap-1.5"><Laptop className="w-4 h-4" /> MacBooks</span> : <span className="flex items-center gap-1.5"><Tablet className="w-4 h-4" /> iPads</span>}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Reference Price</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Device Type</label>
              <select value={form.device_type} onChange={e => setForm({ ...form, device_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="MacBook">MacBook</option>
                <option value="iPad">iPad</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Model Name</label>
              <select value={form.model_name} onChange={e => setForm({ ...form, model_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Select model...</option>
                {(form.device_type === 'MacBook' ? MACBOOK_MODELS : IPAD_MODELS).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Storage (optional)</label>
              <input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} placeholder="e.g. 256GB"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">RAM (optional)</label>
              <input value={form.ram} onChange={e => setForm({ ...form, ram: e.target.value })} placeholder="e.g. 8GB"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Min Price (₹)</label>
              <input type="number" value={form.min_price} onChange={e => setForm({ ...form, min_price: e.target.value })} placeholder="15000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Max Price (₹)</label>
              <input type="number" value={form.max_price} onChange={e => setForm({ ...form, max_price: e.target.value })} placeholder="35000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Notes (optional)</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Good condition, with box"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reference prices yet</p>
          <p className="text-sm text-gray-400 mt-1">Add prices by checking Cashify and entering them manually</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Add First Price
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Device / Model</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Specs</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cashify Price Range</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Updated</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.device_type === 'MacBook' ? <Laptop className="w-4 h-4 text-indigo-500" /> : <Tablet className="w-4 h-4 text-purple-500" />}
                      <div>
                        <p className="font-medium text-gray-900">{row.model_name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${row.device_type === 'MacBook' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                          {row.device_type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.storage && <span className="mr-2">{row.storage}</span>}
                    {row.ram && <span>{row.ram} RAM</span>}
                    {!row.storage && !row.ram && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-semibold">₹{(row.min_price || 0).toLocaleString('en-IN')}</span>
                      <span className="text-gray-400">–</span>
                      <span className="text-green-600 font-semibold">₹{(row.max_price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {row.notes && <p className="text-xs text-gray-400 mt-0.5">{row.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {row.last_updated ? new Date(row.last_updated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.cashify_url && (
                        <a href={row.cashify_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="View on Cashify">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${syncResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {syncResult.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          {syncResult.success
            ? <span>Sync complete: <strong>{syncResult.updated}</strong> updated, <strong>{syncResult.inserted}</strong> new entries, <strong>{syncResult.skipped}</strong> unchanged</span>
            : <span>Sync failed: {syncResult.error}</span>
          }
        </div>
      )}

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>How to use:</strong> Visit Cashify for the model, note the price range for Good/Like New condition, and enter it here.
        These prices are shown as market reference in the Requests detail panel when setting offers.
        Update prices periodically as Cashify prices change with market conditions.
      </div>

      {/* Sync explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong><ArrowRightLeft className="w-4 h-4 inline mr-1" />Sync → Price Engine:</strong> Clicking this button will push the <strong>max_price</strong> from
        Cashify as the <strong>base_price</strong> in your Price Engine. New models will be auto-created. Existing models will be updated only if price changed.
        <br /><span className="text-blue-600 mt-1 block">💡 Pro/Max chips have higher prices automatically based on chip tier.</span>
      </div>
    </div>
  )
}
