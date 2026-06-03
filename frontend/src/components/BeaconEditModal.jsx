import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

export const BeaconEditModal = ({ beacon, open, onClose, onSaved }) => {
  const [nickname, setNickname] = useState('');
  const [gatewayName, setGatewayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!beacon) return;
    setNickname(beacon.nickname || '');
    setGatewayName(beacon.gateway_name || '');
    setError('');
  }, [beacon, open]);

  if (!open || !beacon) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await axios.patch(`/beacons/${encodeURIComponent(beacon.mac_addr)}/labels`, {
        nickname: nickname.trim(),
        gatewayName: gatewayName.trim(),
      });
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save labels');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass-panel w-full max-w-md p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="beacon-edit-title"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 id="beacon-edit-title" className="text-lg font-bold">
            Edit labels
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-muted font-mono mb-4 break-all">{beacon.mac_addr}</p>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">
              Beacon display name
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="input-field"
              placeholder="e.g. Cold room A-01"
              maxLength={255}
            />
            <p className="text-[10px] text-muted mt-1">
              Saved as nickname; BLE broadcast name is not changed.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">
              Gateway display name
            </label>
            <input
              type="text"
              value={gatewayName}
              onChange={e => setGatewayName(e.target.value)}
              className="input-field"
              placeholder="e.g. Floor 1 checkpoint"
              maxLength={255}
              required
            />
            {beacon.gateway_mac_addr && (
              <p className="text-[10px] text-muted font-mono mt-1 break-all">
                Gateway MAC: {beacon.gateway_mac_addr}
              </p>
            )}
            <p className="text-[10px] text-muted mt-1">
              Applies to all beacons on this gateway.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
