import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { 
  MessageSquare, PlusCircle, HelpCircle, AlertCircle, 
  CheckCircle2, Clock, ArrowLeft, Send, Sparkles, ShieldAlert 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'pricing_dispute', label: 'Pricing Dispute' },
  { value: 'pickup_issue', label: 'Pickup / Agent Issue' },
  { value: 'payment', label: 'Payment Delay / Failure' },
  { value: 'device_return', label: 'Device Return Request' },
  { value: 'data_privacy', label: 'Data Privacy & Deletion' },
  { value: 'other', label: 'Other Issue' }
]

const PRIORITIES = [
  { value: 'low', label: 'Low (General questions)', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  { value: 'normal', label: 'Normal (Standard support)', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { value: 'high', label: 'High (Urgent issues)', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { value: 'urgent', label: 'Urgent (Payment / Returns)', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
]

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: Clock },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  resolved: { label: 'Resolved', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  closed: { label: 'Closed', color: '#64748B', bg: 'rgba(100,116,139,0.1)', icon: CheckCircle2 }
}

export default function SupportTickets() {
  const { user, sellRequests, fetchUserRequests } = useStore()
  const navigate = useNavigate()
  
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'create'
  const [selectedTicket, setSelectedTicket] = useState(null)
  
  // Form State
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('normal')
  const [sellRequestId, setSellRequestId] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    fetchUserRequests()
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      console.error('Error fetching tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    if (!subject.trim() || !message.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    
    // Find business_id associated with selected sell_request, if any
    let businessId = null
    if (sellRequestId) {
      const selectedReq = sellRequests.find(r => r.id === sellRequestId)
      if (selectedReq) {
        businessId = selectedReq.business_id
      }
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          sell_request_id: sellRequestId || null,
          business_id: businessId || null,
          category,
          subject: subject.trim(),
          message: message.trim(),
          priority,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      setFormSuccess(true)
      setSubject('')
      setCategory('general')
      setPriority('normal')
      setSellRequestId('')
      setMessage('')
      fetchTickets()
      
      setTimeout(() => {
        setFormSuccess(false)
        setActiveTab('list')
      }, 2000)
    } catch (err) {
      console.error('Error creating support ticket:', err)
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseTicket = async (ticketId) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error
      
      // Update local state
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t))
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: 'closed' })
      }
    } catch (err) {
      console.error('Error closing ticket:', err)
    }
  }

  const getRequestName = (id) => {
    const req = sellRequests.find(r => r.id === id)
    return req ? `${req.model_name || req.device_type} (${id.substring(0, 8)})` : id.substring(0, 8)
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 space-y-6 pb-12">
      {/* Header back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 mb-2 font-bold text-xs transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <HelpCircle className="w-6 h-6 text-cyan-500" /> Support & Help Center
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Have questions or issues? Create a ticket and our support specialists will help you.
          </p>
        </div>
        <div className="flex rounded-xl p-1 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
          <button
            onClick={() => { setActiveTab('list'); setSelectedTicket(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'list' ? 'bg-white dark:bg-white/10 text-cyan-500 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}
          >
            My Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'create' ? 'bg-white dark:bg-white/10 text-cyan-500 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}
          >
            File New Ticket
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="card p-5 sm:p-6 max-w-2xl mx-auto animate-fadeIn">
          <h2 className="text-base font-black uppercase tracking-wider mb-4 pb-2 border-b flex items-center gap-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
            <PlusCircle className="w-5 h-5 text-cyan-500" /> Create a Support Ticket
          </h2>

          {formSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 mb-4 animate-scale-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Ticket submitted successfully! Redirecting...
            </div>
          )}

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 mb-4 animate-scale-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                required
                className="input w-full text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input w-full text-sm py-2"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input w-full text-sm py-2"
                >
                  <option value="low">Low (General Inquiry)</option>
                  <option value="normal">Normal (Standard Support)</option>
                  <option value="high">High (Urgent Action)</option>
                  <option value="urgent">Urgent (Payment/Return Dispute)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Link to Device Order (Optional)</label>
              <select
                value={sellRequestId}
                onChange={(e) => setSellRequestId(e.target.value)}
                className="input w-full text-sm py-2"
              >
                <option value="">-- No Order Linked --</option>
                {sellRequests.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.model_name || r.device_type} (ID: {r.id.substring(0, 8)}) - ₹{r.final_price || r.system_estimated_price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Describe your Issue *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                placeholder="Provide details about what went wrong, including specific dates, price differences, or agent details."
                className="input w-full text-sm py-3 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || formSuccess}
              className="w-full btn-primary h-11 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Submit Support Ticket</>
              )}
            </button>
          </form>
        </div>
      ) : selectedTicket ? (
        <div className="card p-5 sm:p-6 animate-fadeIn">
          {/* Back to list button */}
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex items-center gap-2 mb-4 font-bold text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Tickets
          </button>

          {/* Ticket Header Details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" style={{
                  color: STATUS_CONFIG[selectedTicket.status]?.color || '#777',
                  background: STATUS_CONFIG[selectedTicket.status]?.bg || 'rgba(0,0,0,0.05)'
                }}>
                  {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" style={{
                  color: PRIORITIES.find(p => p.value === selectedTicket.priority)?.color || '#777',
                  background: PRIORITIES.find(p => p.value === selectedTicket.priority)?.bg || 'rgba(0,0,0,0.05)'
                }}>
                  {selectedTicket.priority} Priority
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Created on {new Date(selectedTicket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-lg font-black mt-2" style={{ color: 'var(--color-text)' }}>{selectedTicket.subject}</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Category: <strong className="capitalize">{selectedTicket.category?.replace(/_/g, ' ')}</strong>
              </p>
            </div>
            
            {['open', 'in_progress'].includes(selectedTicket.status) && (
              <button
                onClick={() => handleCloseTicket(selectedTicket.id)}
                className="px-3.5 py-2 border rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 text-xs font-bold transition-all text-red-500"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Mark as Resolved / Close
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            {/* Left Main message */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-4 rounded-2xl border bg-stone-50/50 dark:bg-white/5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">You</div>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>Original Message</span>
                </div>
                <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {selectedTicket.message}
                </p>
              </div>

              {/* Admin Resolution / Notes */}
              {selectedTicket.resolution_notes ? (
                <div className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <h3 className="font-extrabold text-sm">Resolution Details</h3>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Resolved at: {new Date(selectedTicket.resolved_at).toLocaleString('en-IN')}
                  </p>
                  <div className="text-sm border-t pt-2 mt-2 leading-relaxed" style={{ borderColor: 'rgba(16,185,129,0.1)', color: 'var(--color-text)' }}>
                    {selectedTicket.resolution_notes}
                  </div>
                </div>
              ) : selectedTicket.status === 'in_progress' ? (
                <div className="p-5 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-600">Specialist Assigned</h4>
                    <p className="text-xs text-amber-600/80 mt-1">
                      A support agent has been assigned to this ticket and is investigating your concern. We will update you here shortly.
                    </p>
                  </div>
                </div>
              ) : selectedTicket.status === 'open' ? (
                <div className="p-5 rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/5 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-blue-600">Awaiting Assignment</h4>
                    <p className="text-xs text-blue-600/80 mt-1">
                      Your ticket is in queue. Standard response time is under 2 hours. Keep this tab open or check back later.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-stone-500/30 bg-stone-500/5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-stone-600">Ticket Closed</h4>
                    <p className="text-xs text-stone-600/80 mt-1">
                      This support ticket has been closed. If you have another issue, you can file a new support ticket.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info card */}
            <div className="space-y-4">
              <div className="card p-4 space-y-3.5 text-xs">
                <h4 className="font-black uppercase tracking-wider text-[11px]" style={{ color: 'var(--color-text)' }}>Ticket Summary</h4>
                <div className="space-y-2 border-t pt-2.5" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Ticket ID:</span>
                    <span className="font-mono text-stone-600 dark:text-stone-300 font-semibold">{selectedTicket.id.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Linked Order:</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-200">
                      {selectedTicket.sell_request_id ? (
                        <button 
                          onClick={() => navigate(`/dashboard/requests/${selectedTicket.sell_request_id}`)}
                          className="hover:underline text-cyan-500 font-bold"
                        >
                          {getRequestName(selectedTicket.sell_request_id)}
                        </button>
                      ) : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Category:</span>
                    <span className="font-semibold capitalize text-stone-700 dark:text-stone-200">{selectedTicket.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Last Activity:</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-200">
                      {new Date(selectedTicket.updated_at).toLocaleDateString('en-IN', { hour: 'numeric', minute: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List Tab */
        <div className="space-y-4 animate-fadeIn">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading support history...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="card p-8 text-center space-y-4 max-w-lg mx-auto">
              <MessageSquare className="w-12 h-12 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>No support tickets filed</h3>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  If you have issues with pricing, device return, or payment delay, file a support ticket to let us know.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="btn-primary px-5 py-2.5 text-xs font-bold"
              >
                File Your First Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const StatusIcon = STATUS_CONFIG[ticket.status]?.icon || Clock
                const prio = PRIORITIES.find(p => p.value === ticket.priority)
                return (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="card p-4 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded" style={{
                          color: STATUS_CONFIG[ticket.status]?.color || '#777',
                          background: STATUS_CONFIG[ticket.status]?.bg || 'rgba(0,0,0,0.05)'
                        }}>
                          {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                        </span>
                        {prio && (
                          <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded" style={{
                            color: prio.color,
                            background: prio.bg
                          }}>
                            {prio.value}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          ID: {ticket.id.substring(0, 8)} • {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {ticket.subject}
                      </h3>
                      
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {ticket.message}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {ticket.status === 'resolved' && (
                        <span className="text-[10px] font-bold text-emerald-500 hidden sm:inline-block">Resolved</span>
                      )}
                      <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChevronRight(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
      style={props.style}
      width="1em"
      height="1em"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
