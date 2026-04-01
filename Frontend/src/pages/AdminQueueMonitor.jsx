import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Clock, Trash2, ArrowLeft, RefreshCw, CheckCircle2, XCircle, UserX, UserCheck, Play, Pause, Megaphone } from 'lucide-react'
import api from '../utils/api'

const AdminQueueMonitor = () => {
    const { id } = useParams()
    const [queue, setQueue] = React.useState(null)
    const [entries, setEntries] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState(null)
    const [processingNext, setProcessingNext] = React.useState(false)
    const [showBroadcast, setShowBroadcast] = React.useState(false)
    const [broadcastMsg, setBroadcastMsg] = React.useState('')
    const [sendingBroadcast, setSendingBroadcast] = React.useState(false)

    React.useEffect(() => {
        fetchQueueData()
        const interval = setInterval(fetchQueueData, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [id])

    const fetchQueueData = async () => {
        try {
            const [queueRes, entriesRes] = await Promise.all([
                api.get(`/api/admin/queue/${id}`),
                api.get(`/api/admin/queue/${id}/users`)
            ])
            setQueue(queueRes.data)
            setEntries(entriesRes.data)
        } catch (err) {
            console.error('Failed to fetch monitor data')
        } finally {
            setLoading(false)
        }
    }

    const removeUser = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this user from the queue?')) return
        setActionLoading(userId)
        try {
            await api.delete(`/api/admin/queue/${id}/user/${userId}`)
            fetchQueueData()
        } catch (err) {
            alert('Failed to remove user')
        } finally {
            setActionLoading(null)
        }
    }

    const clearQueue = async () => {
        if (!window.confirm('Are you sure you want to clear the entire queue? This action cannot be undone.')) return
        setActionLoading('clear')
        try {
            await api.delete(`/api/admin/queue/${id}/clear`)
            fetchQueueData()
        } catch (err) {
            alert('Failed to clear queue')
        } finally {
            setActionLoading(null)
        }
    }

    const handleNextTurn = async () => {
        if (entries.length === 0) return
        setProcessingNext(true)
        try {
            await api.post('/api/queues/complete-turn', {
                queueId: id,
                userId: entries[0].userId
            })
            fetchQueueData()
        } catch (err) {
            alert('Failed to process next turn')
        } finally {
            setProcessingNext(false)
        }
    }

    const toggleStatus = async () => {
        try {
            await api.patch(`/api/admin/queue/${id}/toggle`, {})
            fetchQueueData()
        } catch (err) {
            alert('Failed to toggle status')
        }
    }

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return
        setSendingBroadcast(true)
        try {
            const { data } = await api.post(`/api/admin/queue/${id}/broadcast`, { message: broadcastMsg })
            alert(data.message)
            setShowBroadcast(false)
            setBroadcastMsg('')
        } catch (err) {
            alert('Failed to send broadcast')
        } finally {
            setSendingBroadcast(false)
        }
    }

    if (loading) return <div className="container mx-auto px-6 py-20 text-center">Loading Monitor...</div>

    return (
        <div className="container mx-auto px-6 py-12 relative">
            {/* Broadcast Modal */}
            {showBroadcast && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface border border-white/5 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-cyan-400">
                            <Megaphone size={20} /> Announce Broadcast
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">Send an instant email notification to every user currently waiting in this queue.</p>
                        <textarea 
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            placeholder="e.g. The doctor is delayed by 30 minutes due to an emergency..."
                            className="w-full bg-background border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 mb-6 min-h-[120px] resize-none"
                        ></textarea>
                        <div className="flex gap-4">
                            <button onClick={() => setShowBroadcast(false)} className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button 
                                onClick={handleBroadcast} 
                                disabled={sendingBroadcast || !broadcastMsg.trim()}
                                className="flex-1 py-3 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg disabled:opacity-50 transition-colors"
                            >
                                {sendingBroadcast ? 'Sending...' : 'Send to All'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <Link to="/admin" className="flex items-center gap-2 text-text-muted hover:text-text mb-4 transition-colors">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-3xl border border-glass-border">
                            {queue.icon || '🏢'}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{queue.name}</h1>
                            <p className="text-text-muted text-sm capitalize">{queue.organization} | {queue.status} status</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={() => setShowBroadcast(true)}
                        className="px-6 py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl font-bold flex items-center gap-2 border border-indigo-500/20 transition-all"
                    >
                        <Megaphone size={20} /> Broadcast
                    </button>
                    <button 
                        onClick={toggleStatus}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-glass-border transition-all ${
                            queue.status === 'open' ? 'bg-warning/10 text-warning hover:bg-warning' : 'bg-success/10 text-success hover:bg-success'
                        } hover:text-white`}
                    >
                        {queue.status === 'open' ? <><Pause size={20} /> Close Queue</> : <><Play size={20} /> Open Queue</>}
                    </button>
                    <button 
                        onClick={clearQueue}
                        disabled={actionLoading === 'clear'}
                        className="px-6 py-3 bg-danger text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-danger/80 disabled:opacity-50"
                    >
                        <Trash2 size={20} /> Clear All
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Stats Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card">
                        <h3 className="text-xl font-bold mb-6">Queue Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-background/50 p-4 rounded-xl border border-glass-border">
                                <p className="text-xs text-text-muted uppercase mb-1">Users Waiting</p>
                                <p className="text-3xl font-bold">{entries.length}</p>
                            </div>
                            <div className="bg-background/50 p-4 rounded-xl border border-glass-border">
                                <p className="text-xs text-text-muted uppercase mb-1">Capacity</p>
                                <p className="text-3xl font-bold">{queue.capacity}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card bg-primary/5 border-primary/20">
                         <div className="flex items-center gap-4 mb-6">
                             <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                 <Users size={20} />
                             </div>
                             <h4 className="font-bold">Currently Serving</h4>
                         </div>
                         {entries.length > 0 ? (
                             <div className="text-center py-6">
                                 <p className="text-sm text-text-muted mb-2">Ticket #</p>
                                 <p className="text-6xl font-bold tracking-tight text-primary">#{entries[0].ticketNumber}</p>
                                 <p className="mt-4 font-bold text-lg">{entries[0].username}</p>
                                 
                                 <button 
                                     onClick={handleNextTurn}
                                     disabled={processingNext}
                                     className="mt-6 w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold border border-white/5 shadow-[0_0_20px_rgba(99,102,241,0.3)] shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                 >
                                     {processingNext ? 'Processing...' : <><CheckCircle2 size={20} /> Mark as Complete</>}
                                 </button>
                             </div>
                         ) : (
                             <div className="text-center py-10 opacity-30">
                                 <XCircle size={48} className="mx-auto mb-4" />
                                 <p>No users waiting</p>
                             </div>
                         )}
                    </div>
                </div>

                {/* Queue List */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="p-6 border-b border-glass-border flex justify-between items-center bg-surface/30">
                            <h3 className="text-xl font-bold">Waitlist Monitor</h3>
                            <button onClick={fetchQueueData} className="p-2 hover:bg-surface rounded-lg transition-colors">
                                <RefreshCw size={18} className="text-text-muted" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background/50 text-[10px] uppercase font-bold text-text-muted">
                                    <tr>
                                        <th className="px-6 py-4">Position</th>
                                        <th className="px-6 py-4">Ticket</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Joined At</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {entries.length > 0 ? entries.map((entry, index) => (
                                        <motion.tr 
                                            key={entry.userId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-surface/50 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-primary text-white' : 'bg-surface border border-glass-border'}`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-bold">#{entry.ticketNumber}</td>
                                            <td className="px-6 py-5 font-semibold">{entry.username}</td>
                                            <td className="px-6 py-5 text-text-muted text-sm">{new Date(entry.joinedAt).toLocaleTimeString()}</td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => removeUser(entry.userId)}
                                                        disabled={actionLoading === entry.userId}
                                                        className="p-2 text-danger bg-danger/10 hover:bg-danger hover:text-white rounded-lg transition-all"
                                                        title="Remove from queue"
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center text-text-muted opacity-50 font-medium">
                                                No people in the queue right now.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminQueueMonitor
