import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { 
  UserPlus, Mail, Phone, MapPin, Trash2, CheckCircle2, 
  XCircle, Users, AlertCircle, Search, Shield
} from 'lucide-react'

export default function AgentManagement() {
  const { agents, fetchAllAgents, addApprovedAgentEmail, fetchApprovedAgentEmails, removeApprovedAgentEmail, toggleAgentStatus } = useStore()
  const [approvedEmails, setApprovedEmails] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAgent, setNewAgent] = useState({ email: '', name: '', phone: '', city: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAllAgents()
    loadApprovedEmails()
  }, [])

  const loadApprovedEmails = async () => {
    const data = await fetchApprovedAgentEmails()
    setApprovedEmails(data)
  }

  const handleAddAgent = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newAgent.email?.trim()) {
      setError('Email is required')
      return
    }

    setIsAdding(true)
    const result = await addApprovedAgentEmail(newAgent.email, newAgent.name, newAgent.phone, newAgent.city)
    if (result.success) {
      setSuccess(`Agent email ${newAgent.email} added successfully! They can now register at the Agent Panel.`)
      setNewAgent({ email: '', name: '', phone: '', city: '' })
      setShowAddForm(false)
      loadApprovedEmails()
    } else {
      setError(result.message || 'Failed to add agent')
    }
    setIsAdding(false)
  }

  const handleRemoveApproved = async (id, email) => {
    if (!confirm(`Remove ${email} from approved agents?`)) return
    const success = await removeApprovedAgentEmail(id)
    if (success) loadApprovedEmails()
  }

  const handleToggleAgent = async (agentId, currentStatus) => {
    await toggleAgentStatus(agentId, !currentStatus)
  }

  const filteredAgents = agents.filter(a => 
    !searchTerm || 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agent Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add and manage pickup agents</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors">
          <UserPlus className="w-4 h-4" /> Add Agent
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-violet-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Add Agent Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Add New Agent by Email</h3>
          <p className="text-xs text-gray-500 mb-4">Enter the agent's email. They will only be able to register using this approved email.</p>
          <form onSubmit={handleAddAgent} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    placeholder="agent@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                <input type="text" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                  placeholder="Agent name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="9876543210" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newAgent.city} onChange={e => setNewAgent({ ...newAgent, city: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="City" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isAdding}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
                {isAdding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isAdding ? 'Adding...' : 'Add Agent Email'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approved Emails (Pending Registration) */}
      {approvedEmails.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/50">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-600" /> Approved Emails (Pending Registration)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">These emails are approved. Agents can register using these emails only.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {approvedEmails.map(ae => (
              <div key={ae.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ae.email}</p>
                    <p className="text-xs text-gray-500">{[ae.name, ae.phone, ae.city].filter(Boolean).join(' · ') || 'No details'}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveApproved(ae.id, ae.email)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registered Agents */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" /> Registered Agents ({filteredAgents.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-violet-400 w-36 sm:w-44"
              placeholder="Search agents..." />
          </div>
        </div>
        {filteredAgents.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No agents registered yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAgents.map(agent => (
              <div key={agent.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${agent.is_active ? 'bg-violet-100' : 'bg-gray-100'}`}>
                    <Shield className={`w-4 h-4 ${agent.is_active ? 'text-violet-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{agent.name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500">{agent.email} {agent.phone ? `· ${agent.phone}` : ''} {agent.city ? `· ${agent.city}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => handleToggleAgent(agent.id, agent.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    agent.is_active 
                      ? 'bg-violet-100 text-violet-700 hover:bg-red-100 hover:text-red-700' 
                      : 'bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-700'
                  }`}>
                  {agent.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
