import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Package, Search,
  Laptop, Smartphone, CheckCircle2, XCircle, Clock,
  ChevronDown, X, Save, AlertCircle, Building2, RefreshCw
} from 'lucide-react'

const DEVICE_TYPES = ['MacBook', 'iPad']
const CONDITIONS = [
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]
const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-100 text-amber-700' },
  { value: 'sold', label: 'Sold', color: 'bg-blue-100 text-blue-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
]

const EMPTY_FORM = {
  business_id: '',
  title: '',
  device_type: 'MacBook',
  brand: 'Apple',
  model: '',
  variant: '',
  storage_gb: '',
  color: '',
  year: new Date().getFullYear().toString(),
  condition: 'good',
  price_inr: '',
  mrp_inr: '',
  description: '',
  warranty_months: '0',
  status: 'draft',
  is_featured: false,
}

function fmt(n) { return n ? `₹${Number(n).toLocaleString('en-IN')}` : '—' }

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.color}`}>
      {s.label}
    </span>
  )
}

function ConditionBadge({ condition }) {
  const c = CONDITIONS.find(x => x.value === condition)
  const tone = {
    like_new: 'bg-emerald-50 text-emerald-700',
    excellent: 'bg-blue-50 text-blue-700',
    good: 'bg-amber-50 text-amber-700',
    fair: 'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${tone[condition] || 'bg-gray-50 text-gray-600'}`}>
      {c?.label || condition}
    </span>
  )
}

export default function Listings() {
  const { admin, businesses, selectedBusinessId, fetchAccessibleBusinesses } = useStore()
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const formRef = useRef(null)

  useEffect(() => {
    if (!businesses.length) fetchAccessibleBusinesses()
  }, [])

  useEffect(() => {
    loadListings()
  }, [selectedBusinessId])

  async function loadListings() {
    setIsLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          businesses(id, name, city, slug)
        `)
        .order('created_at', { ascending: false })

      if (selectedBusinessId) {
        query = query.eq('business_id', selectedBusinessId)
      }

      const { data, error } = await query
      if (error) throw error
      setListings(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() {
    const defaultBizId = selectedBusinessId || businesses[0]?.id || ''
    setForm({ ...EMPTY_FORM, business_id: defaultBizId })
    setEditingId(null)
    setError(null)
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function openEdit(listing) {
    setForm({
      business_id: listing.business_id || '',
      title: listing.title || '',
      device_type: listing.device_type || 'MacBook',
      brand: listing.brand || 'Apple',
      model: listing.model || '',
      variant: listing.variant || '',
      storage_gb: listing.storage_gb?.toString() || '',
      color: listing.color || '',
      year: listing.year?.toString() || '',
      condition: listing.condition || 'good',
      price_inr: listing.price_inr?.toString() || '',
      mrp_inr: listing.mrp_inr?.toString() || '',
      description: listing.description || '',
      warranty_months: listing.warranty_months?.toString() || '0',
      status: listing.status || 'draft',
      is_featured: listing.is_featured || false,
    })
    setEditingId(listing.id)
    setError(null)
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.business_id) { setError('Please select a business.'); return }
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.model.trim()) { setError('Model is required.'); return }
    if (!form.price_inr) { setError('Price is required.'); return }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        business_id: form.business_id,
        title: form.title.trim(),
        device_type: form.device_type,
        brand: form.brand || 'Apple',
        model: form.model.trim(),
        variant: form.variant.trim() || null,
        storage_gb: form.storage_gb ? parseInt(form.storage_gb) : null,
        color: form.color.trim() || null,
        year: form.year ? parseInt(form.year) : null,
        condition: form.condition,
        price_inr: parseInt(form.price_inr),
        mrp_inr: form.mrp_inr ? parseInt(form.mrp_inr) : null,
        description: form.description.trim() || null,
        warranty_months: parseInt(form.warranty_months || '0'),
        status: form.status,
        is_featured: form.is_featured,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase.from('listings').update(payload).eq('id', editingId)
        if (error) throw error
        setSuccessMsg('Listing updated successfully.')
      } else {
        const { error } = await supabase.from('listings').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
        setSuccessMsg('Listing published successfully.')
      }

      await loadListings()
      closeForm()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(listing) {
    const nextStatus = listing.status === 'active' ? 'paused' : 'active'
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', listing.id)
      if (error) throw error
      await loadListings()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteListing(id) {
    try {
      const { error } = await supabase.from('listings').delete().eq('id', id)
      if (error) throw error
      setDeleteConfirmId(null)
      await loadListings()
      setSuccessMsg('Listing deleted.')
      setTimeout(() => setSuccessMsg(null), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = listings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (deviceFilter !== 'all' && l.device_type !== deviceFilter) return false
    if (search) {
      const hay = `${l.title} ${l.model} ${l.businesses?.name || ''}`.toLowerCase()
      if (!hay.includes(search.toLowerCase())) return false
    }
    return true
  })

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    draft: listings.filter(l => l.status === 'draft').length,
    featured: listings.filter(l => l.is_featured).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish and manage store inventory for all verified partner businesses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadListings}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && !showForm && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', value: stats.total, color: 'indigo' },
          { label: 'Active', value: stats.active, color: 'emerald' },
          { label: 'Drafts', value: stats.draft, color: 'amber' },
          { label: 'Featured', value: stats.featured, color: 'purple' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div
          ref={formRef}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
            <div>
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit Listing' : 'Create New Listing'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Fill in device details and publish inventory for customers to browse.</p>
            </div>
            <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 sm:p-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Business */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Business *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.business_id}
                    onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    required
                  >
                    <option value="">Select business...</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Listing Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder='e.g. MacBook Air M2 - 13.6 inch Space Gray'
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* Device Type */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Device Type *</label>
                <select
                  value={form.device_type}
                  onChange={e => setForm(f => ({ ...f, device_type: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Model *</label>
                <input
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  placeholder="MacBook Air M2"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* Variant */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Variant</label>
                <input
                  value={form.variant}
                  onChange={e => setForm(f => ({ ...f, variant: e.target.value }))}
                  placeholder="8GB / 256GB"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Storage */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Storage (GB)</label>
                <input
                  type="number"
                  value={form.storage_gb}
                  onChange={e => setForm(f => ({ ...f, storage_gb: e.target.value }))}
                  placeholder="256"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Color</label>
                <input
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="Space Gray"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="2023"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Condition *</label>
                <select
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Selling Price (₹) *</label>
                <input
                  type="number"
                  value={form.price_inr}
                  onChange={e => setForm(f => ({ ...f, price_inr: e.target.value }))}
                  placeholder="45000"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Original MRP (₹)</label>
                <input
                  type="number"
                  value={form.mrp_inr}
                  onChange={e => setForm(f => ({ ...f, mrp_inr: e.target.value }))}
                  placeholder="90000"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Warranty */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Warranty (months)</label>
                <input
                  type="number"
                  value={form.warranty_months}
                  onChange={e => setForm(f => ({ ...f, warranty_months: e.target.value }))}
                  placeholder="6"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Status *</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Device condition notes, included accessories, seller's remarks..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Featured toggle */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.is_featured ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_featured ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Feature this listing on homepage
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={closeForm}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-60">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Publish Listing')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, model, or business..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'draft', 'paused', 'sold'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All status' : s}
              </button>
            ))}
            <button
              onClick={() => setDeviceFilter(deviceFilter === 'all' ? 'MacBook' : deviceFilter === 'MacBook' ? 'iPad' : 'all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                deviceFilter !== 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {deviceFilter === 'all' ? 'All devices' : deviceFilter}
            </button>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-900 text-sm mb-1">No listings found</p>
            <p className="text-xs text-gray-400 mb-4">
              {listings.length === 0
                ? 'Start by creating your first listing.'
                : 'Try adjusting your filters.'}
            </p>
            {listings.length === 0 && (
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" />
                Create First Listing
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Listing</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Business</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Condition</th>
                    <th className="text-right px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Price</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(listing => (
                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            listing.device_type === 'MacBook' ? 'bg-indigo-50' : 'bg-emerald-50'
                          }`}>
                            {listing.device_type === 'MacBook'
                              ? <Laptop className="w-4 h-4 text-indigo-600" />
                              : <Smartphone className="w-4 h-4 text-emerald-600" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[200px]">{listing.title}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {listing.model}
                              {listing.storage_gb ? ` · ${listing.storage_gb}GB` : ''}
                              {listing.year ? ` · ${listing.year}` : ''}
                              {listing.is_featured ? ' · ⭐ Featured' : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-gray-600">
                        {listing.businesses?.name || '—'}
                      </td>
                      <td className="px-3 py-3.5">
                        <ConditionBadge condition={listing.condition} />
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <p className="font-bold text-gray-900">{fmt(listing.price_inr)}</p>
                        {listing.mrp_inr && (
                          <p className="text-[10px] text-gray-400 line-through">{fmt(listing.mrp_inr)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleStatus(listing)}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            title={listing.status === 'active' ? 'Pause listing' : 'Activate listing'}
                          >
                            {listing.status === 'active'
                              ? <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                              : <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            }
                          </button>
                          <button
                            onClick={() => openEdit(listing)}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                            title="Edit listing"
                          >
                            <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          {deleteConfirmId === listing.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteListing(listing.id)}
                                className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                                title="Confirm delete"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(listing.id)}
                              className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                              title="Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map(listing => (
                <div key={listing.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        listing.device_type === 'MacBook' ? 'bg-indigo-50' : 'bg-emerald-50'
                      }`}>
                        {listing.device_type === 'MacBook'
                          ? <Laptop className="w-5 h-5 text-indigo-600" />
                          : <Smartphone className="w-5 h-5 text-emerald-600" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {listing.businesses?.name} · {listing.model}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={listing.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ConditionBadge condition={listing.condition} />
                      <span className="text-sm font-bold text-gray-900">{fmt(listing.price_inr)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleStatus(listing)} className="p-2 rounded-lg border border-gray-200">
                        {listing.status === 'active'
                          ? <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                          : <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        }
                      </button>
                      <button onClick={() => openEdit(listing)} className="p-2 rounded-lg border border-gray-200">
                        <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(listing.id)} className="p-2 rounded-lg border border-gray-200">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {deleteConfirmId === listing.id && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-xs text-red-700 flex-1">Delete this listing?</p>
                      <button onClick={() => deleteListing(listing.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-semibold">Delete</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 border border-gray-200 text-xs rounded-lg font-semibold">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} shown</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
