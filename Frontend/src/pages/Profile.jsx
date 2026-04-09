import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, User, Mail, Building, History, Receipt, CreditCard, Clock, 
    CheckCircle2, Shield, LogOut, ExternalLink, Calendar, Activity 
} from 'lucide-react'
import api from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'

const Profile = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = React.useState(true)
    const [profileData, setProfileData] = React.useState(null)
    const [historyData, setHistoryData] = React.useState([])
    const role = localStorage.getItem('role') || 'user'

    React.useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/auth'); return }

        if (role === 'admin') {
            fetchAdminProfile()
        } else {
            fetchUserProfile()
            fetchHistory()
        }
    }, [role, navigate])

    const fetchAdminProfile = async () => {
        try {
            const { data } = await api.get('/api/admin/profile')
            setProfileData(data)
        } catch (err) {
            console.error('Failed to fetch admin profile')
        } finally {
            setLoading(false)
        }
    }

    const fetchUserProfile = () => {
       const localProfile = localStorage.getItem('profile')
       if(localProfile && localProfile !== 'undefined') {
           setProfileData(JSON.parse(localProfile))
       }
       setLoading(false)
    }

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/api/payment/history')
            setHistoryData(data)
        } catch (err) {
            console.error('Failed to fetch history')
        }
    }

    const handleLogout = () => {
        localStorage.clear()
        navigate('/auth')
    }

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Profile...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-primary/30 relative overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            {/* Navigation */}
            <nav className="border-b border-white/5 bg-surface/30 backdrop-blur-2xl sticky top-0 z-50">
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <Link 
                        to={role === 'admin' ? '/admin' : '/dashboard'} 
                        className="flex items-center gap-3 text-slate-400 hover:text-white transition-all group"
                    >
                        <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 group-hover:-translate-x-1 transition-all">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="font-bold tracking-tight">Return to Terminal</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block">Security Protocol Active</span>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="grid lg:grid-cols-12 gap-10">
                    
                    {/* Left Panel: Identity & Access */}
                    <div className="lg:col-span-4 space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-8 text-center relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield size={80} />
                            </div>
                            
                            <div className="relative inline-block mb-6">
                                <div className="w-32 h-32 bg-gradient-to-tr from-primary via-indigo-500 to-cyan-400 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-primary/20 rotate-3 group-hover:rotate-6 transition-transform">
                                    {(profileData?.name || profileData?.username || 'U')[0].toUpperCase()}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#020617] border border-white/10 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Shield size={20} className="text-emerald-400" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black tracking-tight mb-2 capitalize">
                                {profileData?.name || profileData?.username || 'Anonymous Node'}
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-8">
                                System {role === 'admin' ? 'Administrator' : 'Access Node'}
                            </p>

                            <div className="space-y-4 text-left">
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                                            <Mail size={18} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Primary Link</p>
                                            <p className="text-sm font-bold truncate">{profileData?.email || 'unlinked_account'}</p>
                                        </div>
                                    </div>
                                </div>

                                {role === 'admin' && (
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-400/20 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-cyan-400/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-400/10">
                                                <Building size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Control Center</p>
                                                <p className="text-sm font-bold truncate">{profileData?.organizationName || 'Master Org'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleLogout}
                                className="mt-10 w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-red-500/10 active:scale-95"
                            >
                                <LogOut size={18} /> Kill Session
                            </button>
                        </motion.div>

                        {/* System Stats Section */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-6 bg-emerald-500/5 border-emerald-500/10"
                        >
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-6 flex items-center gap-2">
                                <Activity size={14} /> Network Health
                            </h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-black text-white">99.9%</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Uptime Stability</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,1,2].map((_, i) => (
                                            <div key={i} className="w-1.5 h-6 bg-emerald-500/30 rounded-full overflow-hidden relative">
                                                <div className="absolute bottom-0 left-0 w-full bg-emerald-500 animate-[bounce_1s_infinite]" style={{height: `${Math.random()*100}%`, animationDelay: `${i*0.2}s`}}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-px bg-white/5 w-full"></div>
                                <div className="flex justify-between">
                                    <div className="text-center">
                                        <p className="text-lg font-bold">24ms</p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase">Latency</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold">Encrypted</p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase">AES-256</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold">Verified</p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase">Passport.js</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Panel: Transaction Stream */}
                    <div className="lg:col-span-8">
                        {role === 'user' ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card min-h-[600px] flex flex-col p-0 overflow-hidden"
                            >
                                <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                            <History className="text-primary" size={28} /> Activity Log
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">Timeline of all virtual tokens purchased across the network.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
                                        <Receipt size={16} className="text-primary" />
                                        <span className="text-xs font-black uppercase text-primary">{historyData.length} records</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                                    {historyData.length > 0 ? (
                                        <div className="space-y-6">
                                            {historyData.map((tx, i) => (
                                                <motion.div 
                                                    key={tx._id} 
                                                    initial={{ opacity: 0, x: 10 }} 
                                                    animate={{ opacity: 1, x: 0 }} 
                                                    transition={{ delay: 0.3 + (i * 0.05) }}
                                                    className="relative pl-10 group"
                                                >
                                                    {/* Vertical Timeline Link */}
                                                    {i !== historyData.length - 1 && (
                                                        <div className="absolute left-[19px] top-10 bottom-[-30px] w-px bg-gradient-to-b from-primary/30 to-transparent"></div>
                                                    )}
                                                    
                                                    {/* Timeline Dot */}
                                                    <div className="absolute left-0 top-1 w-10 h-10 bg-[#020617] border-2 border-primary/40 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:border-primary transition-all z-10 shadow-lg shadow-primary/10">
                                                        <Calendar size={18} className="text-primary group-hover:text-white transition-colors" />
                                                    </div>

                                                    <div className="glass-card-inner p-6 border-white/5 hover:border-primary/20 transition-all bg-white/2">
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                                            <div>
                                                                <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">
                                                                    {tx.queueId?.name || 'Experimental Node'}
                                                                </h4>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                                        <Clock size={12} /> {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </p>
                                                                    <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                        {new Date(tx.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-lg shadow-emerald-500/5">
                                                                    <CheckCircle2 size={12} /> Confirmed
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                            <div className="bg-white/3 p-3 rounded-2xl border border-white/5 group-hover:bg-white/5 transition-colors">
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Exchange</p>
                                                                <p className="text-sm font-black text-white">₹{tx.amount / 100}</p>
                                                            </div>
                                                            <div className="bg-white/3 p-3 rounded-2xl border border-white/5 group-hover:bg-white/5 transition-colors">
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Payload</p>
                                                                <p className="text-sm font-black text-cyan-400">{tx.quantity} Tickets</p>
                                                            </div>
                                                            <div className="hidden sm:block sm:col-span-2 bg-white/3 p-3 rounded-2xl border border-white/5 font-mono text-[9px] group-hover:bg-white/5 transition-colors">
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Signature</p>
                                                                <p className="text-slate-400 truncate">{tx.razorpayOrderId}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-30 select-none">
                                            <Receipt size={80} className="mb-6 stroke-[1.5]" />
                                            <h4 className="text-xl font-black uppercase tracking-widest">No Active Sessions</h4>
                                            <p className="text-sm mt-2 max-w-[250px]">Join virtual queues to generate transaction logs.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                           <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card min-h-[600px] flex items-center justify-center p-12 text-center relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-cyan-400 to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-3xl rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Shield size={48} className="text-primary animate-pulse" />
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tighter mb-4">Command Center</h3>
                                    <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed mb-8">
                                        You are currently logged in as a <span className="text-white font-bold">System Root Admin</span>. Full organizational control and real-time broadcast modules are active.
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-sm mx-auto">
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Status</p>
                                            <p className="text-sm font-black text-emerald-400">Authenticated</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Access</p>
                                            <p className="text-sm font-black text-indigo-400">Full Root</p>
                                        </div>
                                    </div>

                                    <Link 
                                        to="/admin" 
                                        className="inline-flex items-center gap-3 px-10 py-5 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all group"
                                    >
                                        Launch Dashboard <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Link>
                                </div>
                                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors"></div>
                           </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Profile
