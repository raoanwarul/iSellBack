import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Laptop, Search, Smartphone } from 'lucide-react'
import { useStore } from '../store/useStore'

const CONDITIONS = [
  { id: 'good', label: 'Good', desc: 'Few scratches, fully working', multiplier: 1 },
  { id: 'fair', label: 'Fair', desc: 'Visible wear, all key functions work', multiplier: 0.82 },
  { id: 'poor', label: 'Poor', desc: 'Heavy wear or multiple issues', multiplier: 0.6 },
]

function formatPrice(value) {
  return `₹${Math.max(0, Math.round(value || 0)).toLocaleString('en-IN')}`
}

function groupModels(models) {
  const groups = new Map()

  models.forEach((model) => {
    const name = model.model_name || ''
    let key = 'Other'
    if (/air/i.test(name)) key = 'Air'
    else if (/pro/i.test(name)) key = 'Pro'
    else if (/mini/i.test(name)) key = 'Mini'
    else if (/ipad/i.test(name)) key = 'iPad'
    else if (/macbook/i.test(name)) key = 'MacBook'

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(model)
  })

  return Array.from(groups.entries()).map(([label, rows]) => ({
    label,
    rows: rows.sort((a, b) => (a.model_name || '').localeCompare(b.model_name || '')),
  }))
}

export default function QuickQuoteWidget({ variant = 'panel', ctaLabel = 'Continue to full quote', onContinue }) {
  const {
    priceEngineModels,
    fetchPriceEngine,
    resetSellFlow,
    setDeviceType,
    setModel,
  } = useStore()

  const [deviceType, setLocalDeviceType] = useState(null)
  const [modelId, setModelId] = useState('')
  const [condition, setCondition] = useState('good')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!priceEngineModels.length) {
      fetchPriceEngine()
    }
  }, [fetchPriceEngine, priceEngineModels.length])

  const deviceModels = useMemo(() => {
    if (!deviceType) return []
    const rows = priceEngineModels.filter((model) => model.device_type === deviceType)
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((model) => (model.model_name || '').toLowerCase().includes(needle))
  }, [deviceType, priceEngineModels, search])

  const groupedModels = useMemo(() => groupModels(deviceModels), [deviceModels])

  const selectedModel = useMemo(
    () => priceEngineModels.find((model) => model.id === modelId),
    [priceEngineModels, modelId]
  )

  const selectedCondition = CONDITIONS.find((entry) => entry.id === condition) || CONDITIONS[0]
  const estimatedPrice = selectedModel
    ? Math.max(5000, Math.round((selectedModel.base_price || 0) * selectedCondition.multiplier / 100) * 100)
    : null

  const dark = variant === 'hero'
  const shellClass = dark
    ? 'bg-slate-950/80 border-white/10 text-white'
    : 'bg-white border-gray-100 text-gray-900'
  const mutedClass = dark ? 'text-white/60' : 'text-gray-500'
  const fieldClass = dark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/35 focus:border-indigo-300'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300'

  function handleContinue() {
    if (!selectedModel || !deviceType) return

    resetSellFlow()
    setDeviceType(deviceType)
    setModel(selectedModel)

    if (onContinue) {
      onContinue({
        deviceType,
        model: selectedModel,
        condition,
        estimatedPrice,
      })
    }
  }

  return (
    <div className={`overflow-hidden rounded-[28px] border shadow-xl ${shellClass}`}>
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Step 1 · Device</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { id: 'iPad', label: 'iPad', icon: Smartphone, desc: 'Mini · Air · Pro' },
                { id: 'MacBook', label: 'MacBook', icon: Laptop, desc: 'Air · Pro' },
              ].map((item) => {
                const active = deviceType === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLocalDeviceType(item.id)
                      setModelId('')
                      setSearch('')
                    }}
                    className={`group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? dark
                          ? 'border-indigo-300 bg-indigo-400/10'
                          : 'border-indigo-300 bg-indigo-50'
                        : dark
                          ? 'border-white/10 bg-white/5 hover:border-indigo-300/50'
                          : 'border-gray-200 bg-gray-50 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : dark ? 'bg-white/10 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.label}</p>
                      <p className={`truncate text-[11px] ${mutedClass}`}>{item.desc}</p>
                    </div>
                    {active ? <Check className="h-4 w-4 text-indigo-400" /> : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={deviceType ? '' : 'pointer-events-none opacity-40'}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Step 2 · Model</p>
              <div className="relative w-full max-w-[220px]">
                <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search model"
                  className={`h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition ${fieldClass}`}
                />
              </div>
            </div>
            <div className="mt-3 max-h-[230px] overflow-y-auto space-y-3 pr-1">
              {groupedModels.length === 0 ? (
                <div className={`rounded-2xl border border-dashed p-5 text-sm ${dark ? 'border-white/10 bg-white/5 text-white/55' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                  {deviceType ? 'No models found for this search.' : 'Choose a device to load models.'}
                </div>
              ) : (
                groupedModels.map((group) => (
                  <div key={group.label}>
                    <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${mutedClass}`}>{group.label}</p>
                    <div className="space-y-2">
                      {group.rows.map((model) => {
                        const active = model.id === modelId
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => setModelId(model.id)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              active
                                ? dark
                                  ? 'border-indigo-300 bg-indigo-400/10'
                                  : 'border-indigo-300 bg-indigo-50'
                                : dark
                                  ? 'border-white/10 bg-white/5 hover:border-indigo-300/40'
                                  : 'border-gray-200 bg-white hover:border-indigo-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{model.model_name}</p>
                                <p className={`mt-0.5 text-[11px] ${mutedClass}`}>Up to {formatPrice(model.base_price)}</p>
                              </div>
                              {active ? <Check className="h-4 w-4 text-indigo-400 shrink-0" /> : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={selectedModel ? '' : 'pointer-events-none opacity-40'}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Step 3 · Condition</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {CONDITIONS.map((entry) => {
                const active = condition === entry.id
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setCondition(entry.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? dark
                          ? 'border-indigo-300 bg-indigo-400/10'
                          : 'border-indigo-300 bg-indigo-50'
                        : dark
                          ? 'border-white/10 bg-white/5 hover:border-indigo-300/40'
                          : 'border-gray-200 bg-gray-50 hover:border-indigo-200'
                    }`}
                  >
                    <p className="text-sm font-semibold">{entry.label}</p>
                    <p className={`mt-1 text-[11px] leading-relaxed ${mutedClass}`}>{entry.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className={`flex flex-col justify-between gap-4 border-t p-5 sm:p-6 lg:border-l lg:border-t-0 ${dark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50/70'}`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>Estimated payout</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums">
              {estimatedPrice != null ? formatPrice(estimatedPrice) : '—'}
            </p>

            {selectedModel ? (
              <div className="mt-4 space-y-2 text-sm">
                <SummaryRow label="Model" value={selectedModel.model_name} dark={dark} />
                <SummaryRow label="Base price" value={formatPrice(selectedModel.base_price)} dark={dark} />
                <SummaryRow label="Condition" value={selectedCondition.label} dark={dark} />
                <SummaryRow label="Indicative quote" value={estimatedPrice != null ? formatPrice(estimatedPrice) : '—'} dark={dark} strong />
              </div>
            ) : (
              <p className={`mt-4 text-xs leading-relaxed ${mutedClass}`}>
                Pick a device, model, and condition to see a live indicative quote. The detailed sell flow will calculate the final price using the full device checklist.
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={!selectedModel || !deviceType}
              onClick={handleContinue}
              className="group inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white transition enabled:hover:shadow-lg enabled:hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ctaLabel}
              <ChevronRight className="h-4 w-4 transition group-enabled:group-hover:translate-x-0.5" />
            </button>
            <p className={`mt-3 text-[11px] leading-relaxed ${mutedClass}`}>
              Indicative quote only. Final offer updates after the complete questionnaire and inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, dark, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={dark ? 'text-white/60' : 'text-gray-500'}>{label}</span>
      <span className={`text-right ${strong ? 'font-bold text-base' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
