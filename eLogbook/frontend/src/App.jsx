import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Layout, LayoutDashboard, History, Settings, Bell } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <nav className="w-64 border-r border-border flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center">
            <RadioIcon />
          </div>
          <h1 className="text-xl font-bold font-display bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            eLogbook
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem 
            icon={<History size={20} />} 
            label="History" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          />
          <NavItem 
            icon={<Bell size={20} />} 
            label="Alerts" 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')}
          />
          <div className="mt-4 pt-4 border-t border-border">
            <NavItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </div>

        <div className="mt-auto p-4 glass-panel flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
             <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
          </div>
          <div>
            <p className="text-sm font-bold">Admin User</p>
            <p className="text-[10px] text-gray-500">System Administrator</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-border flex items-center justify-between px-8">
          <h2 className="text-sm text-gray-400 font-medium uppercase tracking-widest">
            {activeTab} View
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              System Time: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? <Dashboard /> : (
          <div className="p-12 text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-4">{activeTab} View is coming soon</h2>
            <p>We are currently implementing this feature.</p>
          </div>
        )}
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
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
