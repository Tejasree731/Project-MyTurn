import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, ArrowLeft, LogOut, CheckCircle2, Ticket, TrendingDown, LayoutList, X, Bell } from 'lucide-react'
import api from '../utils/api'
import socket from '../utils/socket'

const QueueStatus = () => {
    const { id } = useParams()
    const [myTickets, setMyTickets] = React.useState([])
    const [liveQueue, setLiveQueue] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [leaving, setLeaving] = React.useState(false)
    const [error, setError] = React.useState('')
    const [broadcast, setBroadcast] = React.useState(null)

    React.useEffect(() => {
        fetchStatus()
        
        // 🌐 Socket.io Connection
        socket.connect()
        socket.emit("joinQueueRoom", id)

        socket.on("queueUpdated", () => {
            console.log("Queue updated. Fetching fresh status...")
            fetchStatus()
        })

        socket.on("broadcastMessage", (data) => {
            setBroadcast(data.message)
            // Auto hide after 10 seconds
            setTimeout(() => setBroadcast(null), 10000)
        })

        socket.on("queueReset", () => {
            alert("This queue has been reset for a new day.")
            window.location.href = '/dashboard'
        })

        return () => {
            socket.off("queueUpdated")
            socket.off("broadcastMessage")
            socket.off("queueReset")
            socket.disconnect()
        }
    }, [id])

    const fetchStatus = async () => {
        try {
            const { data } = await api.get(`/api/queues/${id}/status`)
            setMyTickets(data.myTickets)
            setLiveQueue(data.liveQueue)
            setError('')
        } catch (err) {
            setError('Could not fetch status. You might not be in this queue.')
            console.error('Failed to fetch status')
        } finally {
            setLoading(false)
        }
    }

    const leaveQueueAll = async () => {
        if (!window.confirm('Are you sure you want to withdraw ALL your tickets from this queue?')) return
        setLeaving(true)
        try {
            await api.post('/api/queues/leave', { queueId: id })
            window.location.href = '/dashboard'
        } catch (err) {
            alert('Failed to leave queue')
            setLeaving(false);
        }
    }

    const withdrawSingleTicket = async (ticketNumber) => {
        if (!window.confirm(`Cancel Ticket #${ticketNumber}? This action cannot be undone.`)) return
        try {
            await api.post('/api/queues/leave', { queueId: id, ticketNumber })
            fetchStatus(); 
        } catch (err) {
            alert('Failed to cancel ticket')
        }
    }

    if (loading) {
        return <div className="container mx-auto px-6 py-20 text-center"><p className="text-xl text-primary animate-pulse">Syncing with live queue...</p></div>
    }

    if (error || !myTickets || myTickets.length === 0) {
        return (
            <div className="container mx-auto px-6 py-20 text-center">
                <div className="glass-card max-w-lg mx-auto py-12">
                   <Users size={48} className="mx-auto mb-6 text-red-400 opacity-50" />
                   <h2 className="text-2xl font-bold mb-4">Queue Not Found</h2>
                   <p className="text-slate-400 mb-8">{error || 'You have no active tickets in this queue.'}</p>
                   <Link to="/dashboard" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg shadow-primary/20 transition-all">
                      Return to Dashboard
                   </Link>
                </div>
            </div>
        )
    }

    const sortedTickets = [...myTickets].sort((a, b) => a.position - b.position)
    const activeStatus = sortedTickets[0]
    const extraTickets = sortedTickets.slice(1)

    return (
        <div className="container mx-auto px-4 sm:px-6 py-12 pt-16 relative">
            {/* 📢 Broadcast Alert */}
            <AnimatePresence>
                {broadcast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6"
                    >
                        <div className="bg-primary/90 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-2xl flex items-start gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                <Bell className="text-white animate-ring" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">Admin Broadcast</p>
                                <p className="text-white font-medium leading-relaxed">{broadcast}</p>
                            </div>
                            <button onClick={() => setBroadcast(null)} className="text-white/50 hover:text-white p-1">
                                <X size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
                
                {/* Left Column: Tickets & Visualizer */}
                <div className="space-y-6">
                    
                    {/* Live Line Visualizer */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex justify-between items-center">
                            <span>Live Queue Feed</span>
                            <span className="text-xs bg-surface-hover px-2 py-1 rounded text-white flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                Live Sync
                            </span>
                        </h3>
                        
                        <div className="relative pb-2">
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
                            
                            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar relative z-10 px-2 scroll-smooth">
                                {liveQueue.map((item) => (
                                    <div 
                                        key={item.ticketNumber} 
                                        className={`flex flex-col items-center flex-shrink-0 transition-all ${
                                            item.isMe 
                                            ? '-translate-y-2' 
                                            : 'opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="text-[10px] font-bold text-slate-500 mb-1">Pos {item.position}</div>
                                        <div 
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold border-2 transition-all ${
                                                item.isMe 
                                                ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/40 ring-4 ring-cyan-500/20' 
                                                : 'bg-surface border-white/5 text-slate-500 shadow-lg'
                                            }`}
                                        >
                                            #{item.ticketNumber}
                                        </div>
                                        {item.isMe && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Primary Ticket */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card bg-primary/5 border-primary/20 overflow-hidden relative"
                    >
                        <button 
                            onClick={() => withdrawSingleTicket(activeStatus.ticketNumber)}
                            className="absolute top-4 right-4 z-10 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg backdrop-blur-md transition-colors group"
                            title="Withdraw this specific ticket"
                        >
                            <X size={18} className="group-hover:scale-110 transition-transform" />
                        </button>

                        <div className="p-10 text-center relative mt-4">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-full -z-10 blur-xl"></div>
                            
                            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-inner">
                               <Ticket className="text-primary" size={40} />
                            </div>
                            
                            <p className="text-cyan-500 font-bold mb-1">{activeStatus.username}</p>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Primary Ticket</p>
                            <h2 className="text-7xl font-bold text-primary mb-8 tracking-tight font-mono">#{activeStatus.ticketNumber}</h2>
                            
                            <div className="flex justify-center gap-4">
                                <div className="bg-background/80 p-4 rounded-xl border border-white/5 flex-1 shadow-md">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1 font-bold">Position</p>
                                    <p className="text-2xl font-bold font-mono">#{activeStatus.position}</p>
                                </div>
                                <div className="bg-background/80 p-4 rounded-xl border border-white/5 flex-1 shadow-md">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1 font-bold">Users Ahead</p>
                                    <p className="text-2xl font-bold font-mono">#{activeStatus.usersAhead}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background/60 border-t border-white/5 p-8 text-center backdrop-blur-xl">
                            {activeStatus.position === 1 ? (
                                <div className="flex flex-col items-center gap-4 text-green-400">
                                    <CheckCircle2 size={48} className="animate-bounce drop-shadow-[0_0_15px_rgba(7ade80,0.5)]" />
                                    <div className="text-lg font-bold">It's Your Turn!</div>
                                    <p className="text-sm text-slate-300">Please report to the {activeStatus.queueName} service area now.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <TrendingDown size={32} className="text-cyan-400 animate-pulse" />
                                    <div className="text-lg font-bold">Estimated Time: <span className="text-cyan-400">~{activeStatus.usersAhead * 5} mins</span></div>
                                    <p className="text-sm text-slate-400">Updating live via Socket.io. You can track your place via the feed above.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Queue Details & Extra Tickets */}
                <div className="space-y-6">
                     
                    {/* Secondary Tickets */}
                    {extraTickets.length > 0 && (
                        <div className="glass-card">
                            <div className="flex items-center justify-between border-b border-white/5 p-6 pb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <LayoutList size={20} className="text-cyan-400"/> Additional Tickets
                                </h3>
                                <span className="text-xs bg-surface-hover px-2 py-1 rounded text-slate-300">{extraTickets.length} active</span>
                            </div>
                            
                            <div className="p-6 space-y-3">
                                <AnimatePresence>
                                {extraTickets.map(ticket => (
                                    <motion.div 
                                        key={ticket.ticketNumber}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center font-bold text-lg border border-white/5 shadow-inner">
                                                #{ticket.ticketNumber}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{ticket.username}</p>
                                                <p className="text-xs text-slate-400">Pos: #{ticket.position} | Est: {ticket.usersAhead * 5}m</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {ticket.position === 1 && (
                                               <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Next</span> 
                                            )}
                                            <button 
                                                onClick={() => withdrawSingleTicket(ticket.ticketNumber)}
                                                className="p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                title="Cancel this ticket"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    <div className="glass-card">
                         <h3 className="text-xl font-bold p-6 pb-4 border-b border-white/5">Queue Details</h3>
                         <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400 flex items-center gap-2 text-sm"><Users size={16}/> Queue Name</span>
                                <span className="font-semibold text-right">{activeStatus.queueName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400 flex items-center gap-2 text-sm"><Ticket size={16}/> Tokens Owned</span>
                                <span className="font-semibold text-cyan-400 px-2 bg-cyan-500/10 rounded">{myTickets.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400 flex items-center gap-2 text-sm"><Clock size={16}/> Joined At</span>
                                <span className="font-semibold">{new Date(activeStatus.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400 flex items-center gap-2 text-sm"><Users size={16}/> Current Waitlist</span>
                                <span className="font-semibold bg-surface-hover px-2 rounded">{activeStatus.totalEntries} People</span>
                            </div>
                         </div>
                    </div>

                    <button 
                        onClick={leaveQueueAll}
                        disabled={leaving}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        {leaving ? 'Withdrawing...' : <><LogOut size={20} /> Withdraw Entirely (All Tickets)</>}
                    </button>

                    <div className="p-5 bg-cyan-500/5 rounded-2xl border border-dashed border-cyan-500/20 text-center">
                        <span className="font-bold text-cyan-500 mb-1 block text-sm">Pro Tip</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            You can withdraw individual tickets seamlessly. Just click the <X size={12} className="inline mx-0.5" /> button next to the ticket. 1 active token will be instantly refunded to your daily limit!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QueueStatus
