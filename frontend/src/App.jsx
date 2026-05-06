import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Search, Shield, Zap, MessageSquare, RefreshCw, 
  Settings, User, ChevronRight, AlertCircle, CheckCircle2, Clock, Briefcase,
  Sun, Moon, Plus, X
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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [viewingEmail, setViewingEmail] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilterTag, setActiveFilterTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchEmails = async () => {
    try {
      const res = await axios.get(`${API_BASE}/emails/`);
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

  const togglePin = async (emailId) => {
    try {
      const res = await axios.post(`${API_BASE}/emails/${emailId}/toggle-pin`);
      if (res.data.status === 'success') {
        setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_pinned: res.data.is_pinned } : e));
        if (viewingEmail && viewingEmail.id === emailId) {
          setViewingEmail(prev => ({ ...prev, is_pinned: res.data.is_pinned }));
        }
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
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
  }, []); // Only fetch on mount or manual sync

  return (
    <div className="flex h-screen bg-main text-primary">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-border-subtle flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Zap size={20} fill="white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Mail-san</h1>
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

        <div className="mt-auto p-6 space-y-4 border-t border-border-subtle">
          {/* Theme Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-input-bg border border-border-subtle hover:bg-indigo-500/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-secondary' : 'bg-amber-500/20 text-amber-500'}`}>
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <span className="text-xs font-medium text-muted group-hover:text-primary">
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${darkMode ? 'bg-slate-700' : 'bg-amber-500'}`}>
              <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${darkMode ? 'left-1' : 'left-5'}`} />
            </div>
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500" />
            <div>
              <p className="text-sm font-medium text-primary">Sanjay Baskar</p>
              <p className="text-xs text-muted">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border-subtle px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search triage..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-input-bg border border-border-base rounded-full py-2 pl-9 pr-4 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${(accountStatus.google_connected || accountStatus.imap_accounts?.length > 0) ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-border-base bg-input-bg hover:bg-indigo-500/5 text-primary'}`}
            >
              <Shield size={16} />
              {((accountStatus.google_accounts?.length || 0) + (accountStatus.imap_accounts?.length || 0)) > 0 
                ? `${(accountStatus.google_accounts?.length || 0) + (accountStatus.imap_accounts?.length || 0)} Accounts` 
                : 'Connect'}
            </button>
            <button 
              onClick={triggerSync}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSyncing ? 'bg-indigo-500/20 text-indigo-400' : 'bg-input-bg hover:bg-indigo-500/5 text-primary border border-border-base'}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sync' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Horizontal Filter Bar */}
        <div className="px-8 py-4 bg-sidebar/50 border-b border-border-subtle flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveAccount('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeAccount === 'all' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-input-bg text-muted hover:text-primary border border-border-base'
              }`}
            >
              All Accounts
            </button>
            {accountStatus.google_accounts?.map(email => (
              <button 
                key={email}
                onClick={() => setActiveAccount(email)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeAccount === email 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-input-bg text-muted hover:text-primary border border-border-base'
                }`}
              >
                {email.split('@')[0]} (Google)
              </button>
            ))}
            {accountStatus.imap_accounts?.map(acc => (
              <button 
                key={acc.email}
                onClick={() => setActiveAccount(acc.email)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeAccount === acc.email 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-input-bg text-muted hover:text-primary border border-border-base'
                }`}
              >
                {acc.label || acc.email.split('@')[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['All', 'Placement', 'Urgent/Academic', 'General', 'Promotion', 'Newsletters'].map(cat => (
              <button 
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveFilterTag(null);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat && !activeFilterTag
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-white/5 text-muted border border-transparent hover:bg-white/10'
                }`}
              >
                {cat === 'Placement' ? 'Career' : cat}
              </button>
            ))}
            <div className="w-px h-4 bg-border-subtle mx-1 shrink-0" />
            <button 
              onClick={() => {
                setActiveFilterTag('haveloc');
                setActiveCategory('All');
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeFilterTag === 'haveloc'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
              }`}
            >
              Haveloc
            </button>
          </div>
        </div>

        {/* Email Feed */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-primary">Inbox Triage</h2>
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
                  const filtered = emails.filter(e => {
                    // 1. Sidebar Category Filter
                    const matchSidebar = selectedCategory === 'all' || 
                      (selectedCategory === 'important' && e.importance >= 8) ||
                      (selectedCategory === 'career' && e.category.toLowerCase().includes('placement')) ||
                      (selectedCategory === 'general' && e.category.toLowerCase().includes('general'));

                    // 2. Account Filter
                    const matchAccount = activeAccount === 'all' || e.source_email === activeAccount;
                    
                    // 3. Category Chip Filter
                    const matchCategory = activeCategory === 'All' || 
                      (activeCategory === 'Placement' && e.category === 'Placement') ||
                      (activeCategory === 'Urgent/Academic' && e.category === 'Urgent/Academic') ||
                      (activeCategory === 'General' && e.category === 'General') ||
                      (activeCategory === 'Promotion' && e.category === 'Promotion') ||
                      (activeCategory === 'Newsletters' && (e.category === 'Promotion' || e.sender.toLowerCase().includes('news')));
                    
                    // 4. Custom Tag Filter
                    const matchTag = !activeFilterTag || 
                      (activeFilterTag === 'haveloc' && e.sender.toLowerCase().includes('haveloc'));

                    // 5. Search Filter
                    const matchSearch = !searchQuery || 
                      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (e.summary && e.summary.toLowerCase().includes(searchQuery.toLowerCase()));

                    return matchSidebar && matchAccount && matchCategory && matchTag && matchSearch;
                  });
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted whitespace-nowrap">{date}</span>
                        <div className="h-px w-full bg-border-subtle" />
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {groupEmails.map((email) => (
                            <EmailCard 
                              key={email.id} 
                              email={email} 
                              isSelected={selectedIds.has(email.id)}
                              onSelect={(e) => {
                                e.stopPropagation();
                                const next = new Set(selectedIds);
                                if (next.has(email.id)) next.delete(email.id);
                                else next.add(email.id);
                                setSelectedIds(next);
                              }}
                              onView={() => setViewingEmail(email)}
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
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 px-6 py-4 rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center gap-8 z-40 border border-white/20"
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
      <aside className="w-96 border-l border-border-subtle bg-chat flex flex-col">
        <div className="p-6 border-b border-border-subtle flex items-center gap-3">
          <MessageSquare size={20} className="text-indigo-500" />
          <h3 className="font-bold text-primary">AI Assistant</h3>
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
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20' 
                : 'bg-input-bg text-primary rounded-tl-none border border-border-subtle'
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
              className="w-full bg-input-bg border border-border-base rounded-xl py-3 pl-4 pr-12 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-indigo-500/50"
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
              className="relative w-full max-w-md bg-sidebar border border-border-base rounded-3xl p-8 shadow-2xl"
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
                {/* Google Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Google Accounts</span>
                    <span className="text-[10px] text-muted">{accountStatus.google_accounts?.length || 0} Connected</span>
                  </div>
                  
                  {accountStatus.google_accounts?.map((email) => (
                    <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-input-bg border border-border-subtle group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Zap size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Gmail Account</p>
                          <p className="text-[10px] text-muted">{email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (confirm(`Remove ${email}?`)) {
                            await axios.delete(`${API_BASE}/config/google-accounts/${email}`);
                            fetchConfig();
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}

                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-dashed border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Sign in with Google
                  </button>
                </div>

                {/* IMAP Accounts List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connected (IMAP)</span>
                    <span className="text-[10px] text-slate-600">{accountStatus.imap_accounts?.length || 0}/5 Accounts</span>
                  </div>
                  
                  {accountStatus.imap_accounts?.map((acc) => (
                    <div key={acc.email} className="flex items-center justify-between p-3 rounded-xl bg-input-bg border border-border-subtle group">
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
                          if (confirm(`Disconnect ${acc.email}?`)) {
                            await axios.delete(`${API_BASE}/config/accounts/${acc.email}`);
                            fetchConfig();
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}

                  {/* Add New Account Form */}
                  {(accountStatus.imap_accounts?.length || 0) < 5 && (
                    <div className="p-4 rounded-2xl border border-dashed border-border-base bg-main/50">
                      <p className="text-[10px] font-bold text-slate-500 mb-3">ADD NEW ACCOUNT</p>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          id="new-label"
                          placeholder="Label (e.g. SRM, Personal)"
                          className="w-full bg-main border border-border-base rounded-lg py-2 px-3 text-xs text-primary focus:outline-none focus:border-indigo-500/50"
                        />
                        <input 
                          type="email" 
                          id="new-email"
                          placeholder="Email Address"
                          className="w-full bg-main border border-border-base rounded-lg py-2 px-3 text-xs text-primary focus:outline-none focus:border-indigo-500/50"
                        />
                        <input 
                          type="password" 
                          id="new-password"
                          placeholder="App Password (16-chars)"
                          className="w-full bg-main border border-border-base rounded-lg py-2 px-3 text-xs text-primary focus:outline-none focus:border-indigo-500/50"
                        />
                        <button 
                          onClick={async () => {
                            const email = document.getElementById('new-email').value;
                            const password = document.getElementById('new-password').value;
                            const label = document.getElementById('new-label').value;
                            
                            if (!email || !password) return alert("Email and Password required");
                            
                            await axios.post(`${API_BASE}/config/accounts`, { 
                              email: email.trim(), 
                              password: password.trim(), 
                              label: label.trim() || "Work" 
                            });
                            
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
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  Close Account Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Detail Modal */}
      <AnimatePresence>
        {viewingEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingEmail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-sidebar border border-border-base rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-border-subtle bg-main/30">
                <div className="flex items-center justify-between mb-6">
                  <div className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${getCategoryColor(viewingEmail.category)}`}>
                    {viewingEmail.category}
                  </div>
                  <button 
                    onClick={() => setViewingEmail(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-muted hover:text-primary transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold text-primary mb-4 leading-tight">
                  {viewingEmail.subject}
                </h2>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                    {viewingEmail.sender?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{viewingEmail.sender}</p>
                    <p className="text-xs text-muted">{new Date(viewingEmail.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/10">
                {viewingEmail.summary && (
                  <div className="mb-8 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Zap size={12} /> AI Summary
                    </p>
                    <p className="text-sm text-secondary leading-relaxed italic">
                      "{viewingEmail.summary}"
                    </p>
                  </div>
                )}
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                    {viewingEmail.body || viewingEmail.snippet}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-border-subtle flex items-center justify-between bg-main/30">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted uppercase">Received via</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                    {viewingEmail.source_email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => togglePin(viewingEmail.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-xs ${
                      viewingEmail.is_pinned 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-input-bg border-border-base text-muted hover:text-primary'
                    }`}
                  >
                    <Shield size={14} className={viewingEmail.is_pinned ? 'fill-amber-500' : ''} />
                    {viewingEmail.is_pinned ? 'Staying' : 'Stay'}
                  </button>
                  <button className="px-6 py-2 rounded-xl bg-input-bg border border-border-base text-xs font-bold hover:bg-white/5 transition-all">
                    Archive
                  </button>
                  <button className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
                    Reply
                  </button>
                </div>
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
      : 'text-muted hover:text-primary hover:bg-input-bg'
    }`}
  >
    {icon}
    {label}
  </button>
);

const EmailCard = ({ email, isSelected, onSelect, onView }) => {
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    // Handle SQLite format by adding T and Z for UTC if missing
    let dateStr = ts;
    if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('+')) {
      dateStr = ts.replace(' ', 'T') + 'Z';
    }
    const date = new Date(dateStr);
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
        isSelected ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10' : 
        email.importance >= 8 ? 'border-rose-500/50 bg-rose-500/[0.02]' : 'border-transparent hover:border-border-base'
      }`}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox Area */}
        <div 
          onClick={onSelect}
          className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
            isSelected ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 group-hover:border-white/30'
          }`}
        >
          {isSelected && <RefreshCw size={10} className="text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {email.is_pinned === 1 && (
                <Shield size={10} className="text-amber-500 fill-amber-500 shrink-0" title="Pinned to Stay" />
              )}
              <span className="text-[10px] font-black text-muted uppercase tracking-tight truncate">
                {(email.sender || "Unknown").split('<')[0].trim()}
              </span>
              {email.source_email ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase truncate max-w-[100px]">
                  {email.source_email.split('@')[0]}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted font-bold uppercase truncate max-w-[100px]">
                  Legacy
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-muted whitespace-nowrap">
              {formatTimestamp(email.timestamp)}
            </span>
          </div>
          
          <h4 className={`text-[13px] font-bold truncate leading-tight mb-1 ${isSelected ? 'text-indigo-500' : 'text-primary'}`}>
            {email.subject}
          </h4>
          
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] text-muted line-clamp-1 flex-1 opacity-70">
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
