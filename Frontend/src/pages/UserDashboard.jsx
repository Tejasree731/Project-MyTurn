import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Search, Clock, Users, MapPin, LogOut, Ticket, Activity, CreditCard, Coins, CalendarDays, Plus, Minus, Download, CheckCircle2, History, X, Receipt, User, Camera } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import api from '../utils/api'

const UserDashboard = () => {
    const navigate = useNavigate()
    const [queues, setQueues] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [joining, setJoining] = React.useState(null)
    const [tokenInfo, setTokenInfo] = React.useState({ tokens: 0, maxTokens: 5, activeTokens: 0 })
    const [dailyUsage, setDailyUsage] = React.useState({}) // { queueId: count }
    const [quantities, setQuantities] = React.useState({}) // { queueId: selectedQty }
    const [receipt, setReceipt] = React.useState(null) // holds receipt data on success
    const [showHistory, setShowHistory] = React.useState(false)
    const [historyData, setHistoryData] = React.useState([])
    const [showScanner, setShowScanner] = React.useState(false)
    const profileStr = localStorage.getItem('profile')
    const profile = profileStr && profileStr !== 'undefined' ? JSON.parse(profileStr) : {}

    React.useEffect(() => {
        if(showHistory) fetchHistory()
    }, [showHistory])

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/api/payment/history')
            setHistoryData(data)
        } catch (err) {
            console.error('Failed to fetch history')
        }
    }

    React.useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/auth'); return }
        fetchQueues()
        fetchTokenInfo()
        fetchDailyUsage()
    }, [])

    React.useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render(
                (decodedText) => {
                    if (decodedText.includes('/queue/')) {
                        const extractedId = decodedText.split('/queue/')[1];
                        scanner.clear();
                        setShowScanner(false);
                        joinQueue(extractedId);
                    } else {
                        alert("Invalid Queue QR Format!");
                    }
                },
                (err) => { /* ignore normal scanning sweep errors */ }
            );
        }
        return () => {
            if (scanner) scanner.clear().catch(e => console.error("Scanner clear fail:", e));
        }
    }, [showScanner])

    const fetchQueues = async () => {
        try {
            const { data } = await api.get('/api/queues')
            // Init quantities to 1 for all queues
            const qtys = {};
            data.forEach(q => qtys[q._id] = 1);
            setQuantities(qtys);
            setQueues(data)
        } catch (err) {
            console.error('Failed to fetch queues')
        } finally {
            setLoading(false)
        }
    }

    const fetchTokenInfo = async () => {
        try {
            const { data } = await api.get('/api/payment/my-tokens')
            setTokenInfo(data)
        } catch (err) {
            console.error('Failed to fetch token info')
        }
    }

    const fetchDailyUsage = async () => {
        try {
            const { data } = await api.get('/api/payment/daily-usage')
            const usageMap = {}
            data.forEach(item => {
                usageMap[item._id] = item.count
            })
            setDailyUsage(usageMap)
        } catch (err) {
            console.error('Failed to fetch daily usage')
        }
    }

    const getQueueDailyUsage = (queueId) => dailyUsage[queueId] || 0
    const getMaxAllowedQty = (queueId) => Math.max(0, 5 - getQueueDailyUsage(queueId))

    const updateQuantity = (queueId, delta) => {
        setQuantities(prev => {
            const current = prev[queueId] || 1;
            const maxAllowed = getMaxAllowedQty(queueId);
            const next = current + delta;
            
            if (next >= 1 && next <= maxAllowed) {
                return { ...prev, [queueId]: next };
            }
            return prev;
        });
    }

    const isQueueLimitReached = (queueId) => {
        return getQueueDailyUsage(queueId) >= 5
    }

    const joinQueue = async (queueId) => {
        const qty = quantities[queueId] || 1;

        if (isQueueLimitReached(queueId) || qty > getMaxAllowedQty(queueId)) {
            alert('Daily limit reached for this queue! Max 5 tokens per queue per day.')
            return
        }

        setJoining(queueId)
        try {
            // Step 1: Create Razorpay order with Quantity
            const { data: orderData } = await api.post('/api/payment/create-order', { queueId, quantity: qty })

            // Step 2: Open Razorpay Checkout popup
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'MyTurn',
                description: `Purchase ${qty} Tokens for ${orderData.queueName}`,
                order_id: orderData.orderId,
                prefill: {
                    name: orderData.userName || profile.username || '',
                    email: orderData.userEmail || ''
                },
                theme: {
                    color: '#6366f1'
                },
                handler: async function (response) {
                    try {
                        // Step 3: Verify payment on backend
                        const { data: verifyData } = await api.post('/api/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            queueId
                        })

                        if (verifyData.success) {
                            setTokenInfo(prev => ({ ...prev, tokens: prev.tokens + qty }))
                            setDailyUsage(prev => ({ ...prev, [queueId]: (prev[queueId] || 0) + qty }))
                            
                            // Show Receipt Modal
                            setReceipt({
                                ...verifyData,
                                queueId,
                                date: new Date().toLocaleString()
                            })
                        }
                    } catch (err) {
                        alert(err.response?.data?.message || 'Payment verification failed')
                    }
                },
                modal: {
                    ondismiss: function () {
                        setJoining(null)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (response) {
                alert('Payment failed. Please try again.')
                setJoining(null)
            })
            rzp.open()

        } catch (err) {
            alert(err.response?.data?.message || 'Failed to initiate payment')
            setJoining(null)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('profile')
        navigate('/auth')
    }

    const filteredQueues = queues.filter(q =>
        q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.organization.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            {/* Native App QR Scanner Modal */}
            <AnimatePresence>
                {showScanner && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
                    >
                        <div className="w-full max-w-md bg-surface border border-white/10 p-6 rounded-3xl text-center shadow-2xl relative">
                            <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-slate-400 hover:text-white" />
                            </button>
                            <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                                <Camera size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Scan Store QR</h2>
                            <p className="text-slate-400 text-sm mb-6 max-w-[250px] mx-auto">Point your camera at the physical queue poster generated by the establishment.</p>
                            
                            {/* QR Reader Anchor */}
                            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden shadow-inner border border-white/10 mb-2"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Receipt Modal Overlay */}
            <AnimatePresence>
                {receipt && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full blur-2xl -z-10"></div>
                            
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Payment Successful!</h2>
                                <p className="text-slate-400 text-sm mt-1">Your tokens have been securely generated.</p>
                            </div>

                            <div className="bg-background/80 rounded-2xl p-5 mb-6 border border-white/5 space-y-3 font-mono text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Receipt ID:</span>
                                    <span className="font-bold tracking-wider">{receipt.transactionId}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Queue:</span>
                                    <span className="font-bold text-right pl-4">{receipt.queueName}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Tokens Purchased:</span>
                                    <span className="font-bold text-cyan-400">{receipt.quantity}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Amount Paid:</span>
                                    <span className="font-bold text-green-400">₹{receipt.amount / 100}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500">Your Tickets:</span>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {receipt.tickets.map(t => (
                                            <span key={t} className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-hover border border-white/5 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Print
                                </button>
                                <button 
                                    onClick={() => navigate(`/queue/${receipt.queueId}`)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-colors"
                                >
                                    Proceed to Queue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment History Slide-Over Modal */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-end bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-surface border-l border-white/10 w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-surface/80 backdrop-blur-md z-10">
                                <h2 className="text-xl font-bold flex items-center gap-2"><History size={20} className="text-cyan-400" /> Transaction History</h2>
                                <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 flex-1">
                                {historyData.length > 0 ? historyData.map(h => (
                                    <div key={h._id} className="bg-background/50 border border-white/5 rounded-2xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-white">{h.queueId?.name || 'Unknown Queue'}</h4>
                                                <p className="text-[11px] text-slate-500">{new Date(h.createdAt).toLocaleString()}</p>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-green-500/10 text-green-400">Success</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="bg-surface p-2 rounded-lg">
                                                <p className="text-[10px] uppercase text-slate-500 mb-0.5 font-bold">Tokens</p>
                                                <p className="font-medium text-cyan-400">{h.quantity}</p>
                                            </div>
                                            <div className="bg-surface p-2 rounded-lg">
                                                <p className="text-[10px] uppercase text-slate-500 mb-0.5 font-bold">Amount Paid</p>
                                                <p className="font-medium">₹{h.amount / 100}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-white/5 font-mono text-[10px] text-slate-500 truncate select-all">
                                            TXN: {h.razorpayOrderId}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 text-slate-500">
                                        <Receipt size={40} className="mx-auto mb-4 opacity-30" />
                                        <p>No transaction history found.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar */}
            <div className="bg-surface/50 border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-cyan-500 rounded-lg flex items-center justify-center">
                            <Ticket className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-lg">MyTurn <span className="text-cyan-400 text-sm font-normal">/ User</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-background/80 border border-white/10 rounded-xl px-3.5 py-2">
                            <CalendarDays size={14} className="text-indigo-400" />
                            <span className="text-sm font-bold">
                                <span className="text-amber-300">{tokenInfo.tokens}</span>
                                <span className="text-slate-500"> today</span>
                            </span>
                        </div>
                        <span className="text-sm text-slate-400 hidden md:block">👋 Hi, <strong className="text-white">{profile.username || 'User'}</strong></span>
                        <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                            <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                                <History size={16} /> History
                            </button>
                            <Link to="/profile" className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-bold">
                                <User size={16} /> Profile
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-10">
                <div className="mb-10">
                    <h1 className="text-4xl font-black mb-3">Find a Queue</h1>
                    <p className="text-slate-400 text-lg">Browse available virtual queues and buy multiple tokens at once.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-5 bg-surface/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                            <CreditCard size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-300">Queue Token System</h3>
                            <p className="text-xs text-slate-500">₹5 per token • Max 5 tokens per queue per day • Instant receipt</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-3 bg-background/60 border border-white/5 rounded-xl px-4 py-2.5">
                            <CalendarDays size={16} className="text-indigo-400" />
                            <div>
                                <p className="text-xs text-slate-500">Today's Total</p>
                                <p className="text-sm font-bold text-white">{tokenInfo.tokens} tokens purchased</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/30 text-cyan-400 hover:text-white rounded-xl px-6 py-2.5 flex items-center justify-center gap-2 font-bold transition-all shadow-lg"
                        >
                            <Camera size={18} /> Scan Store QR
                        </button>
                    </div>
                </motion.div>

                <div className="relative w-full max-w-md mb-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by queue name or organization..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-surface border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-surface/50 rounded-2xl animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : filteredQueues.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQueues.map((queue, index) => {
                            const queueUsage = getQueueDailyUsage(queue._id)
                            const maxAllowed = getMaxAllowedQty(queue._id)
                            const limitReached = queueUsage >= 5
                            const currentQty = quantities[queue._id] || 1

                            return (
                                <motion.div
                                    key={queue._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-surface/40 border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-all group flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                                                {queue.icon || '🏢'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold truncate pr-2 max-w-[140px]">{queue.name}</h3>
                                                <p className="text-sm text-slate-400 flex items-center gap-1"><MapPin size={12} /> {queue.organization}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${queue.status === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {queue.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-background/60 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">
                                                <Users size={12} /> Waiting
                                            </div>
                                            <div className="text-xl font-bold">{queue.entries?.length || 0}</div>
                                        </div>
                                        <div className="bg-background/60 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">
                                                <Clock size={12} /> Est. Time
                                            </div>
                                            <div className="text-xl font-bold">{(queue.entries?.length || 0) * 5}m</div>
                                        </div>
                                    </div>

                                    {/* Usage info */}
                                    <div className="flex items-center justify-between mb-4 px-3 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-indigo-400" />
                                            <span className="text-xs text-indigo-300 font-medium">₹5 per token</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Coins size={12} className={limitReached ? 'text-red-400' : 'text-amber-400'} />
                                            <span className={`text-xs font-bold ${limitReached ? 'text-red-400' : 'text-amber-300'}`}>
                                                {queueUsage}/5
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex gap-3">
                                        {/* Quantity Selector */}
                                        <div className="flex-shrink-0 bg-background/50 border border-white/10 rounded-xl flex items-center overflow-hidden">
                                            <button 
                                                onClick={() => updateQuantity(queue._id, -1)}
                                                disabled={currentQty <= 1 || limitReached}
                                                className="w-10 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <div className="w-8 text-center font-bold text-white select-none">
                                                {limitReached ? 0 : currentQty}
                                            </div>
                                            <button 
                                                onClick={() => updateQuantity(queue._id, 1)}
                                                disabled={currentQty >= maxAllowed || limitReached}
                                                className="w-10 h-12 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => joinQueue(queue._id)}
                                            disabled={queue.status !== 'open' || joining === queue._id || limitReached}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                limitReached
                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20'
                                                : queue.status === 'open'
                                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 active:scale-[0.98]'
                                                : 'bg-surface text-slate-500 cursor-not-allowed border border-white/5'
                                            }`}
                                        >
                                            {limitReached ? (
                                                <><Coins size={16} /> Daily Limit</>
                                            ) : joining === queue._id ? (
                                                <><Activity size={16} className="animate-spin" /> Processing...</>
                                            ) : queue.status === 'open' ? (
                                                <><CreditCard size={18} /> Pay ₹{currentQty * 5}</>
                                            ) : (
                                                'Queue Closed'
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-surface/30 border border-white/5 rounded-2xl py-20 text-center">
                        <Search size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-bold mb-2">No Queues Found</h3>
                        <p className="text-slate-500">Try a different search or check back later.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserDashboard
