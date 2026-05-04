import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Search, Shield, Zap, MessageSquare, RefreshCw, 
  Settings, User, ChevronRight, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://127.0.0.1:8000";

const App = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchEmails = async () => {
    try {
      const endpoint = selectedCategory === "important" ? "/emails/important" : "/emails/";
      const res = await axios.get(`${API_BASE}${endpoint}`);
      setEmails(res.data);
    } catch (err) {
      console.error("Failed to fetch emails", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await axios.post(`${API_BASE}/sync/`);
      setTimeout(fetchEmails, 5000); // Wait for sync to progress
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setChatMessage("");
    
    try {
      const res = await axios.post(`${API_BASE}/chat/`, { message: msg });
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI." }]);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [selectedCategory]);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-[#121216] border-r border-white/5 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Zap size={20} fill="white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Email Agent</h1>
          </div>

          <nav className="space-y-2">
            <SidebarItem 
              icon={<Mail size={18} />} 
              label="All Inbox" 
              active={selectedCategory === "all"} 
              onClick={() => setSelectedCategory("all")}
            />
            <SidebarItem 
              icon={<Shield size={18} />} 
              label="Priority" 
              active={selectedCategory === "important"} 
              onClick={() => setSelectedCategory("important")}
            />
            <SidebarItem icon={<Clock size={18} />} label="Scheduled" />
            <SidebarItem icon={<Settings size={18} />} label="Settings" />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500" />
            <div>
              <p className="text-sm font-medium">Sanjay Baskar</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search your triage..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={triggerSync}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSyncing ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Email Feed */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Inbox Triage</h2>
              <span className="text-sm text-slate-500">{emails.length} items found</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {emails.map((email) => (
                    <EmailCard key={email.id} email={email} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* AI Chat Drawer */}
      <aside className="w-96 border-l border-white/5 bg-[#0a0a0c] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <MessageSquare size={20} className="text-indigo-500" />
          <h3 className="font-bold">AI Assistant</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {chatHistory.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm italic">Ask me about your emails.</p>
              <p className="text-xs mt-2">"Any exam updates?"</p>
            </div>
          )}
          {chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                chat.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'
              }`}>
                {chat.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="relative">
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-indigo-500/50"
            />
            <button 
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active 
      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
    }`}
  >
    {icon}
    {label}
  </button>
);

const EmailCard = ({ email }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={`glass-card p-6 group cursor-pointer transition-all hover:border-indigo-500/30 ${
      email.importance >= 8 ? 'priority-glow border-indigo-500/40' : ''
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${email.importance >= 8 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}>
          {email.importance >= 8 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        </div>
        <div>
          <h4 className="text-sm font-semibold truncate max-w-md">{email.subject}</h4>
          <p className="text-xs text-slate-500">{email.sender}</p>
        </div>
      </div>
      <div className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase tracking-widest font-bold text-slate-500">
        {email.category}
      </div>
    </div>
    
    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
      {email.summary || email.snippet}
    </p>

    <div className="flex items-center gap-4 text-[11px] text-slate-600 font-medium">
      <span className="flex items-center gap-1">
        <Clock size={12} /> {new Date(email.timestamp).toLocaleDateString()}
      </span>
      {email.importance >= 8 && (
        <span className="text-indigo-400 flex items-center gap-1">
          <Zap size={12} fill="currentColor" /> Priority {email.importance}/10
        </span>
      )}
    </div>
  </motion.div>
);

export default App;
