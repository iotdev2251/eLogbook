import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios, { configureAxios } from './api/axiosSetup';
import { Dashboard } from './components/Dashboard';
import { RealTimeStatus } from './components/RealTimeStatus';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { Alerts } from './components/Alerts';
import { UserAvatar } from './components/UserAvatar';
import { BeaconProvider } from './context/BeaconContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { countTempAlerts } from './utils/tempAlerts';
import { useBeacons } from './hooks/useBeacons';
import { LayoutDashboard, History, Settings as SettingsIcon, Bell, LogOut, Radio } from 'lucide-react';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    configureAxios({
      onUnauthorized: () => {
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      },
    });
  }, [location.pathname, navigate]);

  useEffect(() => {
    axios.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
      setUser(null);
      navigate('/login');
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

  const path = location.pathname.replace(/^\//, '');
  const activeTab = path === '' ? 'dashboard' : path.split('/')[0];
  const tabTitleMap = {
    dashboard: 'Dashboard',
    'real-time': 'Real Time Status',
    history: 'History',
    alerts: 'Alerts',
    settings: 'Settings',
  };
  const activeTitle = tabTitleMap[activeTab] || 'Page Not Found';

  return (
    <SettingsProvider>
    <BeaconProvider>
    <div className="min-h-screen flex bg-background text-foreground">
      <NavWithAlerts
        activeTab={activeTab}
        navigate={navigate}
        onLogout={handleLogout}
        user={user}
      />

      <main className="flex-1 overflow-y-auto bg-background">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card">
          <h2 className="text-sm text-muted font-medium uppercase tracking-widest">
            {activeTitle} View
          </h2>
          <div className="text-xs text-muted" aria-live="polite">
            System Time: {now.toLocaleTimeString()}
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/real-time" element={<RealTimeStatus currentUser={user} />} />
          <Route path="/settings" element={<Settings currentUser={user} />} />
          <Route path="/history" element={<PlaceholderView name="History" />} />
          <Route path="/alerts" element={<Alerts currentUser={user} />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </main>
    </div>
    </BeaconProvider>
    </SettingsProvider>
  );
}

function NavWithAlerts({ activeTab, navigate, onLogout, user }) {
  const { beaconList } = useBeacons();
  const { config } = useSettings();
  const tempAlertCount = countTempAlerts(beaconList, config);

  return (
      <nav className="w-64 border-r border-border flex flex-col p-6 gap-8 bg-card" aria-label="Main navigation">
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
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => navigate('/')}
          />
          <NavItem
            icon={<Radio size={20} />}
            label="Real Time Status"
            active={activeTab === 'real-time'}
            onClick={() => navigate('/real-time')}
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
            badge={tempAlertCount > 0 ? tempAlertCount : null}
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
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
          <div className="p-4 glass-panel flex items-center gap-3">
            <UserAvatar username={user.username} />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.username}</p>
              <p className="text-[10px] text-muted uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
        </div>
      </nav>
  );
}

const PlaceholderView = ({ name }) => (
  <div className="p-12 text-center text-muted">
    <h2 className="text-2xl font-bold mb-4 text-foreground">{name} View is coming soon</h2>
    <p>We are currently implementing this feature.</p>
  </div>
);

const NotFoundView = () => (
  <div className="p-12 text-center text-muted">
    <h2 className="text-2xl font-bold mb-4 text-foreground">Page not found</h2>
    <p>The page you requested does not exist.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full ${
      active
        ? 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300 dark:bg-accent-cyan/10 dark:text-accent-cyan dark:ring-accent-cyan/20'
        : 'text-muted hover:text-foreground hover:bg-[var(--color-panel-hover)]'
    }`}
  >
    {icon}
    <span className="font-medium flex-1 text-left">{label}</span>
    {badge != null && (
      <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const RadioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" aria-hidden="true">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
  </svg>
);

export default App;
