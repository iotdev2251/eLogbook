import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';

export const Settings = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New user form state
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
    if (currentUser?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

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

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-12 text-center text-muted">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Access Denied</h2>
        <p>You must be an administrator to view system settings.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            User Management
          </h2>
          <p className="text-sm text-muted mt-1">Add or remove system users.</p>
        </div>
      </div>

      {error && <div className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-300 dark:border-red-500/20">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="glass-panel p-6 h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UserPlus className="text-accent-cyan" size={20} />
            Create User
          </h3>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">Username</label>
              <input 
                type="text" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider block mb-2">Role</label>
              <select 
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
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

        {/* User List */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <User className="text-accent-purple" size={20} />
            Active Users
          </h3>
          {loading ? (
            <p className="text-muted">Loading users...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map(u => (
                <div key={u.id} className="bg-slate-50 dark:bg-black/20 border border-border p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center">
                      {u.role === 'admin' ? <Shield size={18} className="text-yellow-600 dark:text-yellow-400" /> : <User size={18} className="text-muted" />}
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
    </div>
  );
};
