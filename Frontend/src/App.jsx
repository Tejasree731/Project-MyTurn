import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import QueueStatus from './pages/QueueStatus'
import AdminQueueMonitor from './pages/AdminQueueMonitor'
import Profile from './pages/Profile'
import Chatbot from './components/Chatbot'
// import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<><Navbar /><UserDashboard /></>} />
          <Route path="/queue/:id" element={<><Navbar /><QueueStatus /></>} />
          <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />
          <Route path="/admin/queue/:id" element={<><Navbar /><AdminQueueMonitor /></>} />
          <Route path="/profile" element={<><Navbar /><Profile /></>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Chatbot />
      </div>
    </Router>
    </ThemeProvider>
  )
}

export default App
