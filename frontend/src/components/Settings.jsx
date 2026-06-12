import React, { useState, useEffect } from 'react';
import axios from '../api/axiosSetup';
import { useSettings } from '../context/SettingsContext';
import {
  UserPlus,
  Trash2,
  Shield,
  User,
  KeyRound,
  Thermometer,
  SlidersHorizontal,
} from 'lucide-react';

const PARAM_FIELDS = [
  { key: 'BEACON_OUT_TIME', label: 'Beacon offline timeout (seconds)', type: 'number', min: 5, max: 3600 },
  { key: 'HISTORY_DELETE_EXPIRED_HOUR', label: 'History retention (hours)', type: 'number', min: 1, max: 8760 },
  { key: 'NEW_BEACON_PREFIX', label: 'Auto-import MAC prefixes', type: 'text', hint: 'Comma-separated, e.g. 80ECCC0,80ECCB0' },
  { key: 'TEMP_WARN_C', label: 'Temperature warning (°C)', type: 'number', step: '0.1' },
  { key: 'TEMP_CRITICAL_C', label: 'Temperature critical (°C)', type: 'number', step: '0.1' },
];

export const Settings = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  const { refreshConfig } = useSettings();

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold font-display">Settings</h2>
        <p className="text-sm text-muted mt-1">Account security and system configuration.</p>
      </div>

      <ChangePasswordSection />

      {isAdmin && (
        <>
          <SystemParamsSection onSaved={refreshConfig} />
          <UserManagementSection currentUser={currentUser} />
        </>
      )}
    </div>
  );
};

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-panel p-6">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
        <KeyRound className="text-accent-cyan" size={20} />
        Change Password
      </h3>
      <p className="text-sm text-muted mb-6">Update your login password.</p>

      {message && (
        <div className="mb-4 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-3 rounded-xl border border-green-300 dark:border-green-500/20">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-300 dark:border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <Field label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} required />
        <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} required />
        <Field label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} required />
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-slate-100 dark:bg-white/10 hover:bg-cyan-100 dark:hover:bg-accent-cyan/20 hover:text-cyan-800 dark:hover:text-accent-cyan text-foreground font-medium py-2 px-6 rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </form>
    </section>
  );
}

function SystemParamsSection({ onSaved }) {
  const [params, setParams] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchParams = async () => {
    try {
      const res = await axios.get('/settings/params');
      const next = {};
      res.data.forEach((row) => {
        next[row.key] = row.value;
      });
      setParams(next);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load system parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const handleChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await axios.patch('/settings/params', { params });
      await fetchParams();
      await onSaved?.();
      setMessage('System settings saved. Most changes take effect immediately.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-panel p-6">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
        <SlidersHorizontal className="text-accent-purple" size={20} />
        System Parameters
      </h3>
      <p className="text-sm text-muted mb-6 flex items-center gap-2">
        <Thermometer size={16} />
        Alert thresholds, beacon timeout, history retention, and MAC import rules.
      </p>

      {message && (
        <div className="mb-4 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-3 rounded-xl border border-green-300 dark:border-green-500/20">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-300 dark:border-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading parameters…</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PARAM_FIELDS.map((field) => (
            <div key={field.key} className={field.key === 'NEW_BEACON_PREFIX' ? 'md:col-span-2' : ''}>
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">{field.label}</label>
              <input
                type={field.type}
                min={field.min}
                max={field.max}
                step={field.step}
                value={params[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="input-field"
                required
              />
              {field.hint && <p className="text-xs text-muted mt-1">{field.hint}</p>}
            </div>
          ))}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-slate-100 dark:bg-white/10 hover:bg-cyan-100 dark:hover:bg-accent-cyan/20 hover:text-cyan-800 dark:hover:text-accent-cyan text-foreground font-medium py-2 px-6 rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save System Settings'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function UserManagementSection({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/users', { username: newUsername, password: newPassword, role: newRole });
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/auth/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.msg || 'Failed to delete user');
      }
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <User className="text-accent-purple" size={20} />
          User Management
        </h3>
        <p className="text-sm text-muted mt-1">Add or remove system users.</p>
      </div>

      {error && (
        <div className="mb-4 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-300 dark:border-red-500/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 h-fit">
          <h4 className="text-base font-bold mb-6 flex items-center gap-2">
            <UserPlus className="text-accent-cyan" size={20} />
            Create User
          </h4>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <Field label="Username" value={newUsername} onChange={setNewUsername} required />
            <Field label="Password" type="password" value={newPassword} onChange={setNewPassword} required />
            <div>
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="input-field appearance-none"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 bg-slate-100 dark:bg-white/10 hover:bg-cyan-100 dark:hover:bg-accent-cyan/20 hover:text-cyan-800 dark:hover:text-accent-cyan text-foreground font-medium py-2 rounded-lg transition-all"
            >
              Add User
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel p-6">
          <h4 className="text-base font-bold mb-6">Active Users</h4>
          {loading ? (
            <p className="text-muted">Loading users…</p>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((u) => (
                <div key={u.id} className="bg-slate-50 dark:bg-black/20 border border-border p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center">
                      {u.role === 'admin' ? (
                        <Shield size={18} className="text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <User size={18} className="text-muted" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{u.username}</p>
                      <p className="text-xs text-muted uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  {u.id !== currentUser.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-wider block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        required={required}
      />
    </div>
  );
}
