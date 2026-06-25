import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Plus, Edit2, Trash2, Save, X, Laptop, Tablet, Search, Sliders
} from 'lucide-react'

export default function PriceEngine() {
  const { priceEngineModels, fetchPriceEngine, addPriceModel, updatePriceEngine, deletePriceModel, isLoading } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [addForm, setAddForm] = useState({ device_type: 'MacBook', model_name: '', base_price: '' })
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchPriceEngine() }, [])

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const filteredModels = priceEngineModels.filter(model => {
    const matchesFilter = filter === 'all' || model.device_type === filter
    const matchesSearch = !searchQuery || model.model_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleAdd = async () => {
    if (!addForm.model_name || !addForm.base_price) return
    const success = await addPriceModel(addForm.device_type, addForm.model_name, parseInt(addForm.base_price) || 0)
    if (success) {
      setShowAdd(false)
      setAddForm({ device_type: 'MacBook', model_name: '', base_price: '' })
      showMsg('success', 'Model added successfully')
    }
  }

  const handleEdit = async (id) => {
    const success = await updatePriceEngine(id, { base_price: parseInt(editPrice) || 0 })
    if (success) { setEditingId(null); showMsg('success', 'Price updated') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    const success = await deletePriceModel(id)
    if (success) showMsg('success', 'Model deleted')
  }

  const numToInt = (v) => {
    if (v == null) return 0
    if (typeof v === 'number') return Math.round(v)
    return parseInt(v) || 0
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Price Engine</h1>
          <p className="text-gray-400 text-sm">Manage buyback pricing for all device models</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/condition-deductions')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm">
            <Sliders className="w-4 h-4" /> Deductions
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 gradient-admin text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all font-medium text-sm">
            <Plus className="w-4 h-4" /> Add Model
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {msg.text}
        </div>
      )}

      {/* Add Model Dialog */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-scale-in">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Add New Device Model</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Device Type</label>
              <select value={addForm.device_type} onChange={(e) => setAddForm({ ...addForm, device_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm bg-gray-50">
                <option value="MacBook">MacBook</option>
                <option value="iPad">iPad</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Model Name</label>
              <input type="text" value={addForm.model_name} onChange={(e) => setAddForm({ ...addForm, model_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm bg-gray-50"
                placeholder="e.g., MacBook Air M1" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Base Price (₹)</label>
              <input type="number" value={addForm.base_price} onChange={(e) => setAddForm({ ...addForm, base_price: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm bg-gray-50"
                placeholder="e.g., 45000" />
            </div>
          </div>
          <div className="flex gap-2.5 mt-4">
            <button onClick={handleAdd} className="px-4 py-2 gradient-admin text-white rounded-xl font-medium text-sm">Add Model</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header: Search + Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search models..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none text-sm bg-gray-50" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {['all', 'MacBook', 'iPad'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium">{filteredModels.length} models</span>
          </div>
        </div>

        {/* Table */}
        {isLoading && priceEngineModels.length === 0 ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading prices...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-16">
            <Laptop className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 text-sm mb-1">No Models Found</h3>
            <p className="text-xs text-gray-400">Add a model or adjust your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-violet-600 uppercase tracking-wider">Model</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-violet-600 uppercase tracking-wider">Category</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-violet-600 uppercase tracking-wider">Base Price</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-violet-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredModels.map(model => {
                    const basePrice = numToInt(model.base_price)
                    return (
                      <tr key={model.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-sm text-gray-900">{model.model_name}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            model.device_type === 'MacBook' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'
                          }`}>
                            {model.device_type === 'MacBook' ? <Laptop className="w-3 h-3" /> : <Tablet className="w-3 h-3" />}
                            {model.device_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {editingId === model.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-gray-400 text-sm">₹</span>
                              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                                className="w-28 px-2.5 py-1.5 border border-violet-300 rounded-lg text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500/30 bg-violet-50/50" autoFocus />
                              <button onClick={() => handleEdit(model.id)} className="p-1.5 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors">
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-sm text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {editingId !== model.id && (
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingId(model.id); setEditPrice(numToInt(model.base_price).toString()) }}
                                className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(model.id, model.model_name)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filteredModels.map(model => {
                const basePrice = numToInt(model.base_price)
                return (
                  <div key={model.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          model.device_type === 'MacBook' ? 'bg-indigo-50' : 'bg-violet-50'
                        }`}>
                          {model.device_type === 'MacBook' ? <Laptop className="w-4 h-4 text-indigo-600" /> : <Tablet className="w-4 h-4 text-violet-600" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">{model.model_name}</h3>
                          <p className="text-[10px] text-gray-400">{model.device_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === model.id ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-right text-sm font-semibold outline-none" autoFocus />
                            <button onClick={() => handleEdit(model.id)} className="p-1 bg-violet-100 text-violet-600 rounded-lg"><Save className="w-3 h-3" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 bg-gray-100 text-gray-500 rounded-lg"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-sm text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                            <button onClick={() => { setEditingId(model.id); setEditPrice(numToInt(model.base_price).toString()) }}
                              className="p-1.5 text-gray-400 hover:text-violet-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(model.id, model.model_name)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4">
        <h3 className="font-bold text-violet-800 mb-2 text-sm">How Pricing Works</h3>
        <p className="text-xs text-violet-700">
          <strong>Base Price</strong> is the maximum buyback value for each model.
          <strong> Condition Deductions</strong> are subtracted based on device condition.
          Final Price = Base Price - Deductions + Bonuses.
        </p>
      </div>
    </div>
  )
}
