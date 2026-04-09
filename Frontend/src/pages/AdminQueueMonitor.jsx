import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Clock, Trash2, ArrowLeft, RefreshCw, CheckCircle2, XCircle, UserX, UserCheck, Play, Pause, Megaphone } from 'lucide-react'
import api from '../utils/api'
import socket from '../utils/socket'

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
        
        // 🌐 Socket.io Connection
        socket.connect()
        socket.emit("joinQueueRoom", id)

        socket.on("queueUpdated", () => {
            console.log("Admin Monitor: Queue updated. Refreshing...")
            fetchQueueData()
        })

        return () => {
            socket.off("queueUpdated")
            socket.disconnect()
        }
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
            // Socket will trigger refresh for us
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
            // Socket will trigger refresh for us
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
            // Socket will trigger refresh for us
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

    if (loading) return <div className="container mx-auto px-6 py-20 text-center animate-pulse text-primary font-bold">Initializing Admin Monitor...</div>

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
                        <p className="text-sm text-slate-400 mb-6">Send an instant email and push notification to every user currently waiting in this queue.</p>
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
                                className="flex-1 py-3 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg disabled:opacity-50 transition-colors"
                            >
                                {sendingBroadcast ? 'Sending...' : 'Send to All'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <Link to="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-3xl border border-white/5 shadow-inner">
                            {queue.icon || '🏢'}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{queue.name}</h1>
                            <p className="text-slate-400 text-sm capitalize">{queue.organization} | {queue.status} status</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={() => setShowBroadcast(true)}
                        className="px-6 py-3 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl font-bold flex items-center gap-2 border border-cyan-500/20 transition-all shadow-lg shadow-cyan-500/5"
                    >
                        <Megaphone size={20} /> Broadcast
                    </button>
                    <button 
                        onClick={toggleStatus}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 border transition-all ${
                            queue.status === 'open' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500'
                        } hover:text-white`}
                    >
                        {queue.status === 'open' ? <><Pause size={20} /> Close Queue</> : <><Play size={20} /> Open Queue</>}
                    </button>
                    <button 
                        onClick={clearQueue}
                        disabled={actionLoading === 'clear'}
                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
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
                            <div className="bg-background/50 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-500 uppercase mb-1">Users Waiting</p>
                                <p className="text-3xl font-bold">{entries.length}</p>
                            </div>
                            <div className="bg-background/50 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-500 uppercase mb-1">Capacity</p>
                                <p className="text-3xl font-bold">{queue.capacity}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card bg-primary/5 border-primary/20">
                         <div className="flex items-center gap-4 mb-6">
                             <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                                 <Users size={20} />
                             </div>
                             <h4 className="font-bold">Currently Serving</h4>
                             <span className="ml-auto text-xs bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded-full animate-pulse border border-cyan-400/20">Real-time</span>
                         </div>
                         {entries.length > 0 ? (
                             <div className="text-center py-6">
                                 <p className="text-sm text-slate-500 mb-2">Ticket Number</p>
                                 <p className="text-6xl font-bold tracking-tight text-primary">#{entries[0].ticketNumber}</p>
                                 <p className="mt-4 font-bold text-lg text-white">{entries[0].username}</p>
                                 
                                 <button 
                                     onClick={handleNextTurn}
                                     disabled={processingNext}
                                     className="mt-6 w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
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
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface/30">
                            <h3 className="text-xl font-bold">Live Waitlist Monitor</h3>
                            <button onClick={fetchQueueData} className="p-2 hover:bg-background rounded-lg transition-colors group">
                                <RefreshCw size={18} className="text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background/50 text-[10px] uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Position</th>
                                        <th className="px-6 py-4">Ticket</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Joined At</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {entries.length > 0 ? entries.map((entry, index) => (
                                        <motion.tr 
                                            key={entry._id || entry.userId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border border-white/5 text-slate-400'}`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-white">#{entry.ticketNumber}</td>
                                            <td className="px-6 py-5 font-semibold text-slate-200">{entry.username}</td>
                                            <td className="px-6 py-5 text-slate-400 text-sm">{new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => removeUser(entry.userId)}
                                                        disabled={actionLoading === entry.userId}
                                                        className="p-2 text-red-400 bg-red-400/10 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                        title="Remove from queue"
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-24 text-center text-slate-500 opacity-50 font-medium">
                                                <Users size={40} className="mx-auto mb-4" />
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
