import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Search, Shield, Zap, MessageSquare, RefreshCw, 
  Settings, User, ChevronRight, AlertCircle, CheckCircle2, Clock, Briefcase
} from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://127.0.0.1:8000";

const getCategoryColor = (cat) => {
  switch (cat?.toLowerCase()) {
    case 'urgent': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    case 'career': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    case 'task': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  }
};

const App = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Connection States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imapEmail, setImapEmail] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState({ google_connected: false, imap_accounts: [] });
  const [activeAccount, setActiveAccount] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchEmails = async () => {
    try {
      let endpoint = "/emails/";
      if (selectedCategory === "important") endpoint = "/emails/important";
      if (selectedCategory === "career") endpoint = "/emails/career";
      
      const res = await axios.get(`${API_BASE}${endpoint}`);
      setEmails(res.data);
    } catch (err) {
      console.error("Failed to fetch emails", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/config/status`);
      setAccountStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch config", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await axios.post(`${API_BASE}/config/google-login`);
      fetchConfig();
    } catch (err) {
      alert("Failed to trigger Google login.");
    }
  };

  const saveConfig = async () => {
    try {
      await axios.post(`${API_BASE}/config/`, {
        email: imapEmail,
        password: imapPassword
      });
      setIsModalOpen(false);
      fetchConfig();
      triggerSync();
    } catch (err) {
      alert("Failed to save configuration. Please check your inputs.");
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
    fetchConfig();
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
            <SidebarItem 
              icon={<Briefcase size={18} />} 
              label="Career Tracker" 
              active={selectedCategory === "career"} 
              onClick={() => setSelectedCategory("career")}
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
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search triage..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <select 
              value={activeAccount}
              onChange={(e) => setActiveAccount(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Accounts</option>
              <option value="Personal Gmail">Personal Gmail</option>
              {accountStatus.imap_accounts?.map(acc => (
                <option key={acc.email} value={acc.email}>{acc.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${(accountStatus.imap_connected || accountStatus.google_connected) ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
            >
              <Shield size={16} />
              {(accountStatus.imap_connected && accountStatus.google_connected) ? '2 Accounts' : 
               accountStatus.imap_connected ? 'SRM Active' :
               accountStatus.google_connected ? 'Personal Active' : 'Connect'}
            </button>
            <button 
              onClick={triggerSync}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSyncing ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sync' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Email Feed */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Inbox Triage</h2>
              <div className="flex items-center gap-4">
                {selectedIds.size > 0 && (
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-indigo-400 font-bold hover:underline"
                  >
                    Clear Selection ({selectedIds.size})
                  </button>
                )}
                <span className="text-sm text-slate-500">{emails.length} items found</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
              </div>
            ) : (
              <div className="space-y-10">
                {/* Group by Date Logic */}
                {(() => {
                  const filtered = emails.filter(e => activeAccount === "all" || e.source_email === activeAccount);
                  const groups = filtered.reduce((acc, email) => {
                    const date = email.timestamp 
                      ? new Date(email.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                      : "Recent Items";
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(email);
                    return acc;
                  }, {});

                  return Object.entries(groups).map(([date, groupEmails]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 whitespace-nowrap">{date}</span>
                        <div className="h-px w-full bg-white/5" />
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {groupEmails.map((email) => (
                            <EmailCard 
                              key={email.id} 
                              email={email} 
                              isSelected={selectedIds.has(email.id)}
                              onSelect={() => {
                                const next = new Set(selectedIds);
                                if (next.has(email.id)) next.delete(email.id);
                                else next.add(email.id);
                                setSelectedIds(next);
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Floating Action Bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 px-6 py-4 rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center gap-8 z-40 border border-white/10"
              >
                <div className="text-sm font-bold text-white">
                  {selectedIds.size} selected
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-4">
                  <button className="text-xs font-bold hover:text-white/80 flex items-center gap-2">
                    <RefreshCw size={14} /> Mark as Read
                  </button>
                  <button className="text-xs font-bold hover:text-white/80 flex items-center gap-2 text-rose-300">
                    <RefreshCw size={14} className="rotate-45" /> Delete Forever
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Connect Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#121216] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-600 rounded-2xl">
                  <User size={24} fill="white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Manage Accounts</h3>
                  <p className="text-sm text-slate-500">Connect personal and college mailboxes</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Personal Section */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-indigo-400" />
                      <span className="text-sm font-bold">Personal Gmail (OAuth)</span>
                    </div>
                    {accountStatus.google_connected && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                    )}
                  </div>
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-all"
                  >
                    {accountStatus.google_connected ? 'Reconnect Personal Account' : 'Sign in with Google'}
                  </button>
                </div>

                {/* IMAP Accounts List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connected (IMAP)</span>
                    <span className="text-[10px] text-slate-600">{accountStatus.imap_accounts?.length || 0}/5 Accounts</span>
                  </div>
                  
                  {accountStatus.imap_accounts?.map((acc) => (
                    <div key={acc.email} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Shield size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{acc.label}</p>
                          <p className="text-[10px] text-slate-500">{acc.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          await axios.delete(`${API_BASE}/config/accounts/${acc.email}`);
                          fetchConfig();
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                      >
                        <RefreshCw size={12} className="rotate-45" />
                      </button>
                    </div>
                  ))}

                  {/* Add New Account Form */}
                  {(accountStatus.imap_accounts?.length || 0) < 5 && (
                    <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/2">
                      <p className="text-[10px] font-bold text-slate-500 mb-3">ADD NEW ACCOUNT</p>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Label (e.g. SRM, Work)"
                          className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500/50"
                          id="new-label"
                        />
                        <input 
                          type="email" 
                          placeholder="Email Address"
                          className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500/50"
                          id="new-email"
                        />
                        <input 
                          type="password" 
                          placeholder="App Password"
                          className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500/50"
                          id="new-password"
                        />
                        <button 
                          onClick={async () => {
                            const email = document.getElementById('new-email').value;
                            const password = document.getElementById('new-password').value;
                            const label = document.getElementById('new-label').value;
                            if (!email || !password) return alert("Email and Password required");
                            
                            await axios.post(`${API_BASE}/config/accounts`, { email, password, label: label || "Work" });
                            fetchConfig();
                            // Clear fields
                            document.getElementById('new-email').value = "";
                            document.getElementById('new-password').value = "";
                            document.getElementById('new-label').value = "";
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all mt-2"
                        >
                          Connect Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                  Close Account Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

const EmailCard = ({ email, isSelected, onSelect }) => {
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`glass-card p-3 group cursor-pointer transition-all border-l-4 ${
        isSelected ? 'bg-indigo-600/10 border-indigo-500' : 
        email.importance >= 8 ? 'border-rose-500/50 bg-rose-500/[0.02]' : 'border-transparent hover:border-white/10'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-all ${
          isSelected ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 group-hover:border-white/30'
        }`}>
          {isSelected && <RefreshCw size={10} className="text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate">
                {(email.sender || "Unknown").split('<')[0].trim()}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-bold uppercase truncate max-w-[100px]">
                {email.source_email || "General"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
              {formatTimestamp(email.timestamp)}
            </span>
          </div>
          
          <h4 className={`text-[13px] font-bold truncate leading-tight mb-1 ${isSelected ? 'text-indigo-300' : 'text-slate-100'}`}>
            {email.subject}
          </h4>
          
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500 line-clamp-1 flex-1 opacity-70">
              {email.summary || email.snippet}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${
                getCategoryColor(email.category)
              }`}>
                {email.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default App;
