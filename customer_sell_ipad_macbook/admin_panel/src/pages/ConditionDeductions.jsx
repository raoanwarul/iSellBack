import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  ArrowLeft, Save, RotateCcw, Plus, Info,
  Monitor, Smartphone, Battery, Keyboard, Fingerprint, Usb, Volume2, Camera,
  Wifi, Cable, HardDrive, MemoryStick, Shield, Package
} from 'lucide-react'

// Default deductions matching Flutter condition_pricing_screen.dart exactly
const DEFAULT_DEDUCTIONS = [
  // Device Status (SCRAP TRIGGER)
  { category: 'DeviceStatus', condition_name: 'Device turns on', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DeviceStatus', condition_name: 'Device not turning on', value: 5000, deduction_type: 'SCRAP_TRIGGER', impact_level: 'CRITICAL' },

  // Screen Condition
  { category: 'Screen', condition_name: 'Perfect (No scratches)', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Screen', condition_name: 'Minor scratches', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Screen', condition_name: 'Visible scratches', value: 5000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Screen', condition_name: 'Cracked/Broken', value: 15000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Body Condition
  { category: 'Body', condition_name: 'Like new', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Body', condition_name: 'Minor dents/scratches', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Body', condition_name: 'Visible dents', value: 5000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Body', condition_name: 'Major damage', value: 12000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Battery Health
  { category: 'Battery', condition_name: '90-100%', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Battery', condition_name: '80-89%', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Battery', condition_name: '70-79%', value: 4000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Battery', condition_name: 'Below 70%', value: 7000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Keyboard
  { category: 'Keyboard', condition_name: 'Working perfectly', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Keyboard', condition_name: 'Some keys not working', value: 5000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Keyboard', condition_name: 'Not working', value: 12000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Trackpad
  { category: 'Trackpad', condition_name: 'Working perfectly', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Trackpad', condition_name: 'Click issues', value: 3000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Trackpad', condition_name: 'Not working', value: 8000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Ports
  { category: 'Ports', condition_name: 'All working', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Ports', condition_name: 'Some not working', value: 3000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Ports', condition_name: 'Most not working', value: 8000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Speakers
  { category: 'Speakers', condition_name: 'Working', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Speakers', condition_name: 'Distorted sound', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Speakers', condition_name: 'Not working', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Camera
  { category: 'Camera', condition_name: 'Working', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Camera', condition_name: 'Not working', value: 3000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // WiFi/Bluetooth
  { category: 'WiFi/Bluetooth', condition_name: 'Working', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'WiFi/Bluetooth', condition_name: 'Not working', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Screen Discolouration
  { category: 'ScreenDiscolouration', condition_name: 'No Discolouration', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ScreenDiscolouration', condition_name: 'Minor Discolouration', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ScreenDiscolouration', condition_name: 'Major Discolouration', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Screen Spots
  { category: 'ScreenSpots', condition_name: 'No spots on screen', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ScreenSpots', condition_name: '1-2 minor spots on screen', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ScreenSpots', condition_name: 'Large/heavy visible spots on screen', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Lines on Screen
  { category: 'ScreenLines', condition_name: 'No Lines', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ScreenLines', condition_name: 'Visible lines on Screen', value: 4000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ScreenLines', condition_name: 'Display Flickering', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },
  { category: 'ScreenLines', condition_name: 'Black Dots on Screen', value: 3000, deduction_type: 'FLAT', impact_level: 'MINOR' },

  // Dent on Top Panel
  { category: 'DentTopPanel', condition_name: 'No Dents on top panel', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DentTopPanel', condition_name: 'Upto 2 Minor Dents', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DentTopPanel', condition_name: 'More than 2 Minor Dents', value: 4000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DentTopPanel', condition_name: '1 or more Major Dents', value: 7000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Dent on Base Panel
  { category: 'DentBasePanel', condition_name: 'No Dents on base panel', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DentBasePanel', condition_name: 'Upto 2 Minor Dents', value: 2000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DentBasePanel', condition_name: 'More than 2 Minor Dents', value: 4000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'DentBasePanel', condition_name: '1 or more Major Dents', value: 7000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Loose Hinges
  { category: 'LooseHinges', condition_name: 'No Loose Hinges', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'LooseHinges', condition_name: 'Yes - Loose Hinges', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Cracked or Loose Panel
  { category: 'CrackedLoosePanel', condition_name: 'No Cracked or Loose Panel', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'CrackedLoosePanel', condition_name: 'Loose Panel', value: 4000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'CrackedLoosePanel', condition_name: 'Crack/Damage Panel', value: 8000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Charging Port
  { category: 'ChargingPort', condition_name: 'Working', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'ChargingPort', condition_name: 'Not working', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Hard Drive
  { category: 'HardDrive', condition_name: 'Working', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'HardDrive', condition_name: 'Missing/Defective', value: 8000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },

  // Motherboard
  { category: 'Motherboard', condition_name: 'Working fine', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Motherboard', condition_name: 'Issue - auto restart/hanging/heating/not booting', value: 15000, deduction_type: 'SCRAP_TRIGGER', impact_level: 'CRITICAL' },

  // Storage
  { category: 'Storage', condition_name: '2TB', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Storage', condition_name: '1TB', value: 5000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Storage', condition_name: '512GB', value: 10000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Storage', condition_name: '256GB', value: 15000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Storage', condition_name: '128GB', value: 18000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Storage', condition_name: '64GB', value: 20000, deduction_type: 'FLAT', impact_level: 'MINOR' },

  // RAM
  { category: 'RAM', condition_name: '64GB', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'RAM', condition_name: '32GB', value: 5000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'RAM', condition_name: '24GB', value: 8000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'RAM', condition_name: '16GB', value: 12000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'RAM', condition_name: '8GB', value: 15000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'RAM', condition_name: '4GB', value: 18000, deduction_type: 'FLAT', impact_level: 'MINOR' },

  // Warranty (BONUS - negative values add to price)
  { category: 'Warranty', condition_name: 'Out of Warranty / No Bill', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Warranty', condition_name: '0-3 Months Remaining', value: -1000, deduction_type: 'FLAT', impact_level: 'BONUS' },
  { category: 'Warranty', condition_name: '3-6 Months Remaining', value: -2000, deduction_type: 'FLAT', impact_level: 'BONUS' },
  { category: 'Warranty', condition_name: '6-11 Months Remaining', value: -4000, deduction_type: 'FLAT', impact_level: 'BONUS' },
  { category: 'Warranty', condition_name: 'Apple Care+ (12+ Months)', value: -7000, deduction_type: 'FLAT', impact_level: 'BONUS' },

  // Accessories
  { category: 'Accessories', condition_name: 'Charger included', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Accessories', condition_name: 'No charger', value: 1500, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'Accessories', condition_name: 'Box included', value: -1000, deduction_type: 'FLAT', impact_level: 'BONUS' },
  { category: 'Accessories', condition_name: 'Apple Pencil included', value: -2500, deduction_type: 'FLAT', impact_level: 'BONUS' },
  { category: 'Accessories', condition_name: 'Magic Keyboard included', value: -4000, deduction_type: 'FLAT', impact_level: 'BONUS' },

  // Cycle Count
  { category: 'CycleCount', condition_name: '0-299 cycles', value: 0, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'CycleCount', condition_name: '300-499 cycles', value: 1500, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'CycleCount', condition_name: '500-799 cycles', value: 3000, deduction_type: 'FLAT', impact_level: 'MINOR' },
  { category: 'CycleCount', condition_name: '800+ cycles', value: 5000, deduction_type: 'FLAT', impact_level: 'CRITICAL' },
]

const CATEGORY_CONFIG = {
  DeviceStatus: { icon: Smartphone, color: 'text-red-600', bg: 'bg-red-50' },
  Screen: { icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
  Body: { icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
  Battery: { icon: Battery, color: 'text-violet-600', bg: 'bg-green-50' },
  Keyboard: { icon: Keyboard, color: 'text-orange-600', bg: 'bg-orange-50' },
  Trackpad: { icon: Fingerprint, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  Ports: { icon: Usb, color: 'text-amber-700', bg: 'bg-amber-50' },
  Speakers: { icon: Volume2, color: 'text-pink-600', bg: 'bg-pink-50' },
  Camera: { icon: Camera, color: 'text-gray-600', bg: 'bg-gray-100' },
  'WiFi/Bluetooth': { icon: Wifi, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ScreenDiscolouration: { icon: Monitor, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ScreenSpots: { icon: Monitor, color: 'text-orange-600', bg: 'bg-orange-50' },
  ScreenLines: { icon: Monitor, color: 'text-red-500', bg: 'bg-red-50' },
  DentTopPanel: { icon: Smartphone, color: 'text-stone-600', bg: 'bg-stone-50' },
  DentBasePanel: { icon: Smartphone, color: 'text-zinc-600', bg: 'bg-zinc-50' },
  LooseHinges: { icon: Smartphone, color: 'text-rose-600', bg: 'bg-rose-50' },
  CrackedLoosePanel: { icon: Smartphone, color: 'text-red-700', bg: 'bg-red-50' },
  ChargingPort: { icon: Cable, color: 'text-amber-600', bg: 'bg-amber-50' },
  HardDrive: { icon: HardDrive, color: 'text-slate-600', bg: 'bg-slate-100' },
  Motherboard: { icon: Smartphone, color: 'text-red-800', bg: 'bg-red-100' },
  Storage: { icon: HardDrive, color: 'text-teal-600', bg: 'bg-teal-50' },
  RAM: { icon: MemoryStick, color: 'text-violet-600', bg: 'bg-violet-50' },
  Warranty: { icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
  Accessories: { icon: Cable, color: 'text-sky-600', bg: 'bg-sky-50' },
  CycleCount: { icon: Battery, color: 'text-lime-700', bg: 'bg-lime-50' },
}

export default function ConditionDeductions() {
  const { conditionDeductions, fetchConditionDeductions, saveConditionDeductions, isLoading } = useStore()
  const navigate = useNavigate()
  const [localDeductions, setLocalDeductions] = useState([])
  const [editItem, setEditItem] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editIsBonus, setEditIsBonus] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ category: '', condition_name: '', value: '5000', isBonus: false })
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchConditionDeductions() }, [])

  useEffect(() => {
    if (conditionDeductions.length > 0) {
      setLocalDeductions(conditionDeductions)
    } else if (!isLoading) {
      setLocalDeductions(DEFAULT_DEDUCTIONS)
    }
  }, [conditionDeductions, isLoading])

  const showMessage = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  // Group by category
  const categories = {}
  for (const d of localDeductions) {
    if (!categories[d.category]) categories[d.category] = []
    categories[d.category].push(d)
  }

  const formatPrice = (price) => {
    return Math.abs(price).toLocaleString('en-IN')
  }

  const handleEditClick = (item) => {
    const val = item.value ?? item.deduction_amount ?? 0
    setEditItem(item)
    setEditValue(Math.abs(val).toString())
    setEditIsBonus(val < 0)
  }

  const handleEditSave = () => {
    const amount = parseInt(editValue) || 0
    const newValue = editIsBonus ? -amount : amount
    setLocalDeductions(prev => prev.map(d =>
      d === editItem ? { ...d, value: newValue, impact_level: newValue < 0 ? 'BONUS' : (newValue === 0 ? 'MINOR' : d.impact_level) } : d
    ))
    setEditItem(null)
  }

  const handleAddCustom = () => {
    if (!addForm.category || !addForm.condition_name) return
    const amount = parseInt(addForm.value) || 0
    setLocalDeductions(prev => [...prev, {
      category: addForm.category,
      condition_name: addForm.condition_name,
      value: addForm.isBonus ? -amount : amount,
      deduction_type: 'FLAT',
      impact_level: addForm.isBonus ? 'BONUS' : 'MINOR',
    }])
    setShowAdd(false)
    setAddForm({ category: '', condition_name: '', value: '5000', isBonus: false })
  }

  const handleSaveAll = async () => {
    const result = await saveConditionDeductions(localDeductions)
    if (result === true || result?.success !== false) {
      showMessage('success', `All ${localDeductions.length} deductions saved!`)
    } else {
      showMessage('error', `Failed: ${result?.message || 'Unknown error'}`)
    }
  }

  const handleResetDefaults = () => {
    setLocalDeductions(DEFAULT_DEDUCTIONS)
    showMessage('success', 'Reset to defaults. Click Save to apply.')
  }

  return (
    <div className="space-y-5 animate-fade-in-up pb-4 lg:pb-0">
      {/* Sticky Header with Save/Reset */}
      <div className="sticky top-0 z-30 glass pb-3 pt-1 -mx-3 lg:-mx-5 px-3 lg:px-5 border-b border-gray-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/price-engine')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Condition-Based Pricing</h1>
              <p className="text-gray-400 text-sm">Set ₹ deductions from base price for each condition</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetDefaults} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSaveAll} disabled={isLoading} className="flex items-center gap-2 px-4 py-2.5 gradient-admin text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/20 font-medium text-sm disabled:opacity-50 transition-all">
              {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save All
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-violet-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Compact Multi-Column Grid Layout - All categories visible at once */}
      {isLoading && localDeductions.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Object.entries(categories).map(([category, items]) => {
            const config = CATEGORY_CONFIG[category] || { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' }
            const Icon = config.icon

            return (
              <div key={category} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Compact Category Header */}
                <div className={`${config.bg} px-3 py-2 flex items-center gap-2`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <h3 className={`font-bold text-xs uppercase ${config.color}`}>{category}</h3>
                </div>
                {/* Compact Items List */}
                <div className="divide-y divide-gray-50">
                  {items.map((item, idx) => {
                    const amount = item.value ?? item.deduction_amount ?? 0
                    const isBonus = amount < 0
                    const displayText = isBonus
                      ? `+₹${formatPrice(amount)}`
                      : amount === 0 ? '₹0' : `-₹${formatPrice(amount)}`

                    return (
                      <div
                        key={`${category}-${idx}`}
                        className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 cursor-pointer group"
                        onClick={() => handleEditClick(item)}
                      >
                        <span className="text-gray-700 text-xs truncate max-w-[60%]" title={item.condition_name}>{item.condition_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          isBonus ? 'bg-green-100 text-violet-700' :
                          amount === 0 ? 'bg-gray-100 text-gray-500' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {displayText}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Add Custom Card */}
          <div className="bg-white rounded-xl border border-dashed border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-3 py-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-xs uppercase text-gray-500">Add Custom</h3>
            </div>
            {!showAdd ? (
              <button
                onClick={() => setShowAdd(true)}
                className="flex-1 flex items-center justify-center py-4 text-violet-600 hover:bg-violet-50 text-sm font-medium"
              >
                + Add Condition
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={addForm.condition_name}
                  onChange={(e) => setAddForm({ ...addForm, condition_name: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Condition name"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={addForm.value}
                    onChange={(e) => setAddForm({ ...addForm, value: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="₹ Amount"
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={addForm.isBonus}
                      onChange={(e) => setAddForm({ ...addForm, isBonus: e.target.checked })}
                      className="w-3 h-3"
                    />
                    Bonus
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddCustom} className="flex-1 py-1.5 bg-violet-600 text-white rounded text-xs font-medium">Add</button>
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 mb-4">Edit: {editItem.condition_name}</h3>

            {/* Toggle Deduction / Bonus */}
            <div className="flex rounded-xl overflow-hidden mb-5">
              <button
                onClick={() => setEditIsBonus(false)}
                className={`flex-1 py-3 font-bold text-center ${!editIsBonus ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                Deduction
              </button>
              <button
                onClick={() => setEditIsBonus(true)}
                className={`flex-1 py-3 font-bold text-center ${editIsBonus ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                Bonus
              </button>
            </div>

            {/* Amount Input */}
            <div className="relative mb-4">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${editIsBonus ? 'text-violet-600' : 'text-red-600'}`}>
                {editIsBonus ? '+₹' : '-₹'}
              </span>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full pl-16 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50"
                autoFocus
              />
            </div>

            <p className="text-sm text-gray-500 text-center mb-4">
              {editIsBonus ? 'This amount will be ADDED to the price' : 'This amount will be DEDUCTED from the price'}
            </p>

            <div className="flex gap-3">
              <button onClick={() => setEditItem(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Cancel</button>
              <button onClick={handleEditSave} className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
