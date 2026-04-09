import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, CalendarDays, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'guest';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initial Greeting based on role
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let greeting = "Hello! I am the MyTurn Assistant. How can I help you today?";
      if (role === 'admin') {
        greeting = "Welcome Admin! Need help navigating your dashboard or managing queues?";
      } else if (role === 'user') {
        greeting = "Welcome back! You can ask me how to access the site, or check your queue status.";
      }
      setMessages([{ sender: 'bot', text: greeting }]);
    }
  }, [isOpen, role]);

  // Calendar ICS Generator
  const generateICS = (queueInfo) => {
    const { queueName, organization, estimatedTimeMinutes } = queueInfo;
    
    // Scheduled for now + estimated time
    const startDate = new Date(Date.now() + estimatedTimeMinutes * 60000);
    const endDate = new Date(startDate.getTime() + 15 * 60000); // 15 mins block

    const formatDT = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyTurn//Queue System//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@myturn.com
DTSTAMP:${formatDT(new Date())}
DTSTART:${formatDT(startDate)}
DTEND:${formatDT(endDate)}
SUMMARY:MyTurn: ${queueName}
DESCRIPTION:You are scheduled for your turn at ${organization} in approximately ${estimatedTimeMinutes} minutes. Please be ready!
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `myturn_${queueName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processMessage = async (msg) => {
    const lowercaseMsg = msg.toLowerCase();
    
    // Intents Setup
    if (lowercaseMsg.includes('access the website') || lowercaseMsg.includes('how to use')) {
      return { 
        text: "It's simple! For Users: Go to the Dashboard, search for an organization's queue, and click 'Pay' to get a ticket. For Admins: Use the Admin Panel toggle on the login page to access your specific tools." 
      };
    }

    if (lowercaseMsg.includes('admin') && lowercaseMsg.includes('access')) {
      return { 
        text: "As an Admin, make sure you log in via the 'Admin Panel' toggle on the Auth page. Your dashboard will allow you to create queues, broadcast messages, and advance the queue directly." 
      };
    }

    if (lowercaseMsg.includes('status') || lowercaseMsg.includes('queue') || lowercaseMsg.includes('time') || lowercaseMsg.includes('how many')) {
      if (role !== 'user') {
        return { text: "As an admin or guest, you cannot join virtual queues, so you don't have any active wait times!" };
      }

      setLoading(true);
      try {
        const { data } = await api.get('/api/queues/all-active');
        if (data.length === 0) {
          return { text: "You are not currently in any active queues. Go to your dashboard to join one!" };
        }

        const statsText = data.map(q => 
          `• **${q.queueName}** (${q.organization}): You are ticket #${q.ticketNumber} with ${q.usersAhead} people ahead. Your estimated wait is **${q.estimatedTimeMinutes} minutes**.`
        ).join('\n\n');

        return { 
          text: `You are currently in ${data.length} queue(s):\n\n${statsText}\n\nWould you like me to add your turn times to your calendar?`,
          action: { type: 'calendar', payload: data }
        };

      } catch (err) {
        return { text: "I couldn't fetch your queue data at the moment. Please ensure you are logged in." };
      } finally {
        setLoading(false);
      }
    }

    // Default Fallback
    return { text: "I'm still learning! Try asking me about 'how to access the website', 'admin access', or 'check my queue status'." };
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    setLoading(true);
    const response = await processMessage(userMsg);
    setLoading(false);

    setMessages(prev => [...prev, { sender: 'bot', text: response.text, action: response.action }]);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chatbox Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 md:w-96 bg-surface border border-glass-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bot size={24} />
                <h3 className="font-bold">MyTurn Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-br-sm shadow-md' 
                    : 'bg-surface border border-glass-border rounded-bl-sm shadow-sm'
                  }`}>
                    {/* Render message with basic line break support */}
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}

                    {/* Render Custom Actions (Calendar) */}
                    {msg.action && msg.action.type === 'calendar' && (
                      <div className="mt-4 flex flex-col gap-2">
                        {msg.action.payload.map(q => (
                          <button 
                            key={q.queueId}
                            onClick={() => generateICS(q)}
                            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <CalendarDays size={14} /> Add {q.queueName} to Calendar
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-glass-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-xs text-slate-400 font-medium">Assistant is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-surface border-t border-glass-border flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your queue..."
                className="flex-1 bg-background border border-glass-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
