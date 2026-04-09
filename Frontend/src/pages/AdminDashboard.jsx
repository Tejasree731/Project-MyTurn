import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Users, Trash2, Monitor, Play, Pause, BarChart3, LogOut, Shield, TrendingUp, Clock, Activity, QrCode, Radio, Send, IndianRupee } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [queues, setQueues] = React.useState([])
  const [stats, setStats] = React.useState({ totalQueues: 0, activeQueues: 0, totalUsers: 0, totalRevenue: 0 })
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [newQueue, setNewQueue] = React.useState({ name: '', capacity: 50, icon: '🏢', color: '#6366f1' })
  const [activeTab, setActiveTab] = React.useState('open')
  const [broadcastMsg, setBroadcastMsg] = React.useState('')
  const [isBroadcasting, setIsBroadcasting] = React.useState(false)
  const [staff, setStaff] = React.useState([])
  const [showStaffModal, setShowStaffModal] = React.useState(false)
  const [newStaff, setNewStaff] = React.useState({ name: '', email: '', password: '' })
  const [isAddingStaff, setIsAddingStaff] = React.useState(false)

  const profileStr = localStorage.getItem('profile')
  const profile = profileStr && profileStr !== 'undefined' ? JSON.parse(profileStr) : {}

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/auth'); return }
    fetchData()
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/api/admin/staff')
      setStaff(data)
    } catch (err) {
      console.error('Failed to fetch staff')
    }
  }

  const fetchData = async () => {
    try {
      const [queuesRes, statsRes] = await Promise.all([
        api.get('/api/admin/queues'),
        api.get('/api/admin/dashboard')
      ])
      setQueues(queuesRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQueue = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/queue', newQueue)
      setShowModal(false)
      setNewQueue({ name: '', capacity: 50, icon: '🏢', color: '#6366f1' })
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create queue')
    }
  }

  const toggleQueue = async (id) => {
    try {
      await api.patch(`/api/admin/queue/${id}/toggle`, {})
      fetchData()
    } catch (err) {
      alert('Failed to toggle queue')
    }
  }

  const deleteQueue = async (id) => {
    if (!window.confirm('Are you sure you want to delete this queue?')) return
    try {
      await api.delete(`/api/admin/queue/${id}`)
      fetchData()
    } catch (err) {
      alert('Failed to delete queue')
    }
  }

  const downloadQR = (queueId, queueName) => {
    const canvas = document.getElementById(`qr-${queueId}`);
    if (canvas) {
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${queueName.replace(/\s+/g, '_')}_QR_Poster.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
  }

  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if(!broadcastMsg.trim()) return;
    setIsBroadcasting(true)
    try {
      await api.post('/api/admin/broadcasts', { message: broadcastMsg, type: 'info' })
      setBroadcastMsg('')
      alert('Global broadcast dispatched successfully!')
    } catch (err) {
      alert('Failed to send broadcast')
    } finally {
      setIsBroadcasting(false)
    }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setIsAddingStaff(true)
    try {
      await api.post('/api/admin/staff', newStaff)
      setNewStaff({ name: '', email: '', password: '' })
      setShowStaffModal(false)
      fetchStaff()
      alert('Staff member added successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add staff')
    } finally {
      setIsAddingStaff(false)
    }
  }

  const handleRemoveStaff = async (id) => {
    if(!window.confirm('Remove this staff member?')) return
    try {
      await api.delete(`/api/admin/staff/${id}`)
      fetchStaff()
    } catch (err) {
      alert('Failed to remove staff')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('profile')
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-surface/30 border-r border-white/5 p-6 hidden lg:flex flex-col justify-between fixed h-screen">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <span className="font-bold text-lg block leading-tight">MyTurn</span>
              <span className="text-xs text-primary font-semibold">Admin Panel</span>
            </div>
          </div>

          <nav className="space-y-2">
            <a href="#overview" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm">
              <BarChart3 size={18} /> Overview
            </a>
            <a href="#queues" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
              <Monitor size={18} /> Queue Management
            </a>
            <a href="#broadcast" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
              <Radio size={18} /> Broadcast Engine
            </a>
            {!stats.isStaff && (
              <a href="#staff" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white text-sm transition-colors">
                <Users size={18} /> Staff Management
              </a>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5">
          <Link to="/profile" className="flex items-center gap-3 mb-4 hover:bg-white/5 p-2 rounded-xl transition-colors">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {(profile.name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold hover:text-cyan-400 transition-colors uppercase tracking-wider">{profile.name || 'Profile'}</p>
              <p className="text-xs text-slate-500 truncate w-32">{profile.organizationName || 'Organization'}</p>
            </div>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">

        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10" id="overview">
            <div>
              <h1 className="text-3xl font-black mb-1">Dashboard Overview</h1>
              <p className="text-slate-400">{profile.organizationName || 'Your Organization'} — Queue Management</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus size={18} /> New Queue
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-surface/40 border border-white/5 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Queues</p>
                <p className="text-3xl font-black">{stats.totalQueues}</p>
              </div>
            </div>
            <div className="bg-surface/40 border border-white/5 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Activity className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Active Queues</p>
                <p className="text-3xl font-black">{stats.activeQueues}</p>
              </div>
            </div>
            <div className="bg-surface/40 border border-white/5 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <Users className="text-cyan-400" size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Users Waiting</p>
                <p className="text-3xl font-black">{stats.totalUsers}</p>
              </div>
            </div>
            {!stats.isStaff && (
                <div className="bg-surface/40 border border-white/5 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <IndianRupee className="text-amber-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                        <p className="text-3xl font-black">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
                    </div>
                </div>
            )}
          </div>

          {/* Analytics Chart */}
          {queues.length > 0 && (
            <div className="bg-surface/40 border border-white/5 rounded-3xl p-6 lg:p-8 mb-12 shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={20} /> Traffic Analytics Snapshot
                </h2>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full">Live Distribution</span>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queues.map(q => ({ name: q.name, Customers: q.entries?.length || 0, Capacity: q.capacity }))}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#11141e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#00f2fe', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="Customers" fill="url(#colorCyan)" radius={[8, 8, 0, 0]} barSize={48} />
                    <defs>
                      <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4facfe" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Queues Management */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6" id="queues">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Monitor size={20} className="text-primary" /> Your Queues
              </h2>
              <div className="flex bg-surface border border-white/5 rounded-xl p-1 shadow-inner">
                  <button 
                      onClick={() => setActiveTab('open')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'open' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                      Live & Active
                  </button>
                  <button 
                      onClick={() => setActiveTab('closed')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'closed' ? 'bg-surface-hover text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                      Expired / Closed
                  </button>
              </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-56 bg-surface/30 rounded-2xl animate-pulse border border-white/5"></div>)}
            </div>
          ) : queues.filter(q => q.status === activeTab).length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {queues.filter(q => q.status === activeTab).map((queue, index) => (
                <motion.div
                  key={queue._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-surface/40 border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all group overflow-hidden relative shadow-lg"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${queue.status === 'open' ? 'bg-gradient-to-r from-green-400 to-cyan-400' : 'bg-slate-700'}`}></div>
                  
                  {/* Hidden QR Generator payload */}
                  <div style={{ display: 'none' }}>
                    <QRCodeCanvas 
                        id={`qr-${queue._id}`}
                        value={`${window.location.origin}/queue/${queue._id}`} 
                        size={500} 
                        level={"H"}
                        includeMargin={true}
                    />
                  </div>

                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                        {queue.icon || '🏢'}
                      </div>
                      <div>
                        <h3 className="font-bold">{queue.name}</h3>
                        <span className={`text-xs font-bold uppercase ${queue.status === 'open' ? 'text-green-400' : 'text-red-400'}`}>
                          {queue.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleQueue(queue._id)} className="p-2 bg-background hover:bg-white/5 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all" title={queue.status === 'open' ? 'Pause' : 'Resume'}>
                        {queue.status === 'open' ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button onClick={() => downloadQR(queue._id, queue.name)} className="p-2 bg-background hover:bg-white/5 border border-white/5 rounded-lg text-slate-400 hover:text-cyan-400 transition-all" title="Download QR">
                        <QrCode size={14} />
                      </button>
                      <button onClick={() => deleteQueue(queue._id)} className="p-2 bg-background hover:bg-red-500/10 border border-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 bg-background/60 rounded-xl border border-white/5 mb-5">
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-slate-500 uppercase mb-0.5">In Queue</p>
                      <p className="text-lg font-bold">{queue.entries?.length || 0}</p>
                    </div>
                    <div className="h-8 w-px bg-white/5"></div>
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-slate-500 uppercase mb-0.5">Capacity</p>
                      <p className="text-lg font-bold">{queue.capacity}</p>
                    </div>
                  </div>

                  <Link
                    to={`/admin/queue/${queue._id}`}
                    className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-primary/20 transition-all"
                  >
                    <Monitor size={16} /> Live Monitor
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-surface/20 border-2 border-dashed border-white/10 rounded-3xl py-24 text-center mx-auto max-w-2xl">
              <Activity flex="1" size={48} className={`mx-auto mb-4 ${activeTab === 'open' ? 'text-primary' : 'text-slate-600'} opacity-50`} />
              <h3 className="text-2xl font-bold mb-2">{activeTab === 'open' ? 'No Active Queues' : 'No Expired Queues'}</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                {activeTab === 'open' 
                  ? 'Your active reception lists will appear here. Currently waiting for creation.' 
                  : 'Any queues that you explicitly paused or closed are archived safely here.'}
              </p>
              {activeTab === 'open' && (
                <button onClick={() => setShowModal(true)} className="px-8 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  Create First Queue
                </button>
              )}
            </div>
          )}

          {/* Broadcast Engine Section */}
          <div className="mt-16 mb-6" id="broadcast">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Radio size={20} className="text-red-400" /> Global Broadcast Engine
            </h2>
            <div className="bg-surface/40 border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl">
              <p className="text-sm text-slate-400 mb-6">Send an immediate, high-priority announcement to all active users waiting in any queue. Use this sparingly for critical operational updates.</p>
              <form onSubmit={handleSendBroadcast} className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="e.g. Due to system maintenance, all wait times are extended by 15 mins."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-background border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-red-400/50 focus:outline-none transition-colors"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isBroadcasting}
                  className="px-8 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isBroadcasting ? <Activity className="animate-spin" size={18} /> : <><Send size={18} /> Dispatch Global Alert</>}
                </button>
              </form>
            </div>
          </div>

          {!stats.isStaff && (
            <div className="mt-16 mb-6" id="staff">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users size={20} className="text-indigo-400" /> Organization Staff
                    </h2>
                    <button 
                        onClick={() => setShowStaffModal(true)}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> Add Staff Member
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.length > 0 ? staff.map(member => (
                        <div key={member._id} className="bg-surface/40 border border-white/5 rounded-2xl p-5 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                    {member.name[0].toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm truncate">{member.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRemoveStaff(member._id)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )) : (
                        <div className="col-span-full py-10 bg-surface/20 border border-dashed border-white/10 rounded-2xl text-center">
                            <p className="text-slate-500 text-sm italic">No staff members added yet.</p>
                        </div>
                    )}
                </div>
            </div>
          )}

        </div>
      </main>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Add Staff Member</h2>
            <form onSubmit={handleAddStaff} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="staff@organization.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl text-white focus:border-indigo-500/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 py-3 bg-background hover:bg-white/5 rounded-xl font-bold border border-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isAddingStaff} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                   {isAddingStaff ? <Activity className="animate-spin" size={18} /> : 'Create Staff User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Queue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Create New Queue</h2>
            <form onSubmit={handleCreateQueue} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Queue Name</label>
                <input
                  type="text"
                  placeholder="e.g. Main Lobby Reception"
                  value={newQueue.name}
                  onChange={(e) => setNewQueue({...newQueue, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Capacity</label>
                  <input
                    type="number"
                    value={newQueue.capacity}
                    onChange={(e) => setNewQueue({...newQueue, capacity: e.target.value})}
                    className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl text-white focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={newQueue.icon}
                    onChange={(e) => setNewQueue({...newQueue, icon: e.target.value})}
                    className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl text-white text-center text-xl focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-background hover:bg-white/5 rounded-xl font-bold border border-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">
                  Create Queue
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
