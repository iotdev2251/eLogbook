import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { LayoutDashboard, History, Settings as SettingsIcon, Bell, LogOut } from 'lucide-react';

axios.defaults.withCredentials = true;

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/login') {
    return user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />;
  }

  const activeTab = location.pathname.substring(1) || 'dashboard';
  const tabTitleMap = {
    dashboard: 'Real Time Status',
    history: 'History',
    alerts: 'Alerts',
    settings: 'Settings',
  };
  const activeTitle = tabTitleMap[activeTab] || activeTab;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <nav className="w-64 border-r border-border flex flex-col p-6 gap-8 bg-card">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center">
            <RadioIcon />
          </div>
          <h1 className="text-xl font-bold font-display text-gradient">
            TempTrack
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Real Time Status"
            active={activeTab === 'dashboard'}
            onClick={() => navigate('/')}
          />
          <NavItem
            icon={<History size={20} />}
            label="History"
            active={activeTab === 'history'}
            onClick={() => navigate('/history')}
          />
          <NavItem
            icon={<Bell size={20} />}
            label="Alerts"
            active={activeTab === 'alerts'}
            onClick={() => navigate('/alerts')}
          />
          <div className="mt-4 pt-4 border-t border-border">
            <NavItem
              icon={<SettingsIcon size={20} />}
              label="Settings"
              active={activeTab === 'settings'}
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
          <div className="p-4 glass-panel flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} alt={user.username} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.username}</p>
              <p className="text-[10px] text-muted uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-background">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card">
          <h2 className="text-sm text-muted font-medium uppercase tracking-widest">
            {activeTitle} View
          </h2>
          <div className="text-xs text-muted">
            System Time: {new Date().toLocaleTimeString()}
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings currentUser={user} />} />
          <Route path="/history" element={<PlaceholderView name="History" />} />
          <Route path="/alerts" element={<PlaceholderView name="Alerts" />} />
        </Routes>
      </main>
    </div>
  );
}

const PlaceholderView = ({ name }) => (
  <div className="p-12 text-center text-muted">
    <h2 className="text-2xl font-bold mb-4 text-foreground">{name} View is coming soon</h2>
    <p>We are currently implementing this feature.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300 dark:bg-accent-cyan/10 dark:text-accent-cyan dark:ring-accent-cyan/20'
        : 'text-muted hover:text-foreground hover:bg-[var(--color-panel-hover)]'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const RadioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
  </svg>
);

export default App;
