import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, User, LogOut, Menu, X, Coins, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import api from '../utils/api'

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tokenInfo, setTokenInfo] = React.useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  // Check if user is logged in
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const isUser = token && role !== 'admin'

  React.useEffect(() => {
    if (isUser) {
      fetchTokenInfo()
    }
  }, [location.pathname])

  const fetchTokenInfo = async () => {
    try {
      const { data } = await api.get('/api/payment/my-tokens')
      setTokenInfo(data)
    } catch (err) {
      // silently fail
    }
  }

  const navLinks = [
    { name: 'Features', path: '/#features' },
    { name: 'About', path: '/#about' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('profile')
    navigate('/auth')
  }

  const authLinks = token ? (
    <>
      {role === 'admin' ? (
        <Link to="/admin" className="flex items-center gap-2 hover:text-primary transition-colors">
          <LayoutDashboard size={18} />
          <span>Admin Panel</span>
        </Link>
      ) : (
        <>
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to="/profile" className="flex items-center gap-2 hover:text-primary transition-colors">
            <User size={18} />
            <span>Profile</span>
          </Link>
        </>
      )}
      
      {/* Token Badge */}
      {isUser && tokenInfo && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg border border-glass-border">
          <Coins size={14} className={tokenInfo.tokens >= tokenInfo.maxTokens ? 'text-red-400' : 'text-amber-400'} />
          <span className="text-sm font-bold">
            <span className={tokenInfo.tokens >= tokenInfo.maxTokens ? 'text-red-400' : 'text-amber-300'}>
              {tokenInfo.tokens}
            </span>
            <span className="text-slate-500">/{tokenInfo.maxTokens}</span>
          </span>
        </div>
      )}

      {/* universal logout */}
      <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors ml-2">
        <LogOut size={18} />
        <span className="hidden md:inline">Logout</span>
      </button>
    </>
  ) : (
    <>
      <Link to="/auth" className="hover:text-primary transition-colors">Login</Link>
      <Link to="/auth?mode=register" className="px-5 py-2.5 bg-primary hover:bg-primary-hover rounded-full text-white font-medium shadow-lg shadow-primary/20 transition-all">
        Get Started
      </Link>
    </>
  )

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-glass-border py-4">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Users className="text-white" size={20} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-text">MyTurn</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="text-text-muted hover:text-text transition-colors">
              {link.name}
            </Link>
          ))}
          <div className="h-6 w-[1px] bg-glass-border mx-2"></div>
          
          <button onClick={toggleTheme} className="p-2 bg-surface hover:bg-surface-hover rounded-full transition-colors order-last md:order-none">
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {authLinks}
        </div>

        {/* Mobile Toggle & Theme */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 bg-surface rounded-full">
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="text-text" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-surface border-b border-glass-border px-6 py-8 flex flex-col gap-6 absolute top-full left-0 w-full"
        >
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="text-lg text-text-muted hover:text-text" onClick={() => setIsOpen(false)}>
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-4 pt-4 border-t border-glass-border">
            {authLinks}
          </div>
        </motion.div>
      )}
    </nav>
  )
}

export default Navbar
