import { loggerFactory } from '../../config/logger.js';
import pkg from '@prisma/client';
import {
  DEFAULT_BEACON_OUT_TIME,
  DEFAULT_HISTORY_EXPIRED_HOUR,
  DEFAULT_NEW_BEACON_PREFIX,
  DEFAULT_TEMP_CRITICAL_C,
  DEFAULT_TEMP_WARN_C,
  EDITABLE_PARAM_KEYS,
  KEY_BEACON_OUT_TIME,
  KEY_HISTORY_EXPIRED,
  KEY_NEW_BEACON_PREFIX,
  KEY_TEMP_CRITICAL_C,
  KEY_TEMP_WARN_C,
} from './param-keys.js';

const prisma = new pkg.PrismaClient();
const logger = loggerFactory('param');

const PARAM_META = {
  [KEY_BEACON_OUT_TIME]: {
    label: 'Beacon offline timeout',
    desc: 'Seconds without a signal before a beacon is marked OUT or ALERT.',
  },
  [KEY_HISTORY_EXPIRED]: {
    label: 'History retention',
    desc: 'Hours to keep beacon history before automatic deletion.',
  },
  [KEY_NEW_BEACON_PREFIX]: {
    label: 'Auto-import MAC prefixes',
    desc: 'Comma-separated MAC address prefixes for beacons accepted automatically.',
  },
  [KEY_TEMP_WARN_C]: {
    label: 'Temperature warning threshold',
    desc: 'Beacons above this temperature (°C) show a warning alert.',
  },
  [KEY_TEMP_CRITICAL_C]: {
    label: 'Temperature critical threshold',
    desc: 'Beacons above this temperature (°C) show a critical alert.',
  },
};

class ParamRepository {
  async init() {
    await this._readAll();
  }

  async reload() {
    await this._readAll();
  }

  async _readAll() {
    try {
      const result = await prisma.param.findMany();
      this._params = result;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  _getValue(key, fallback) {
    const row = this._params.find((it) => it.key === key);
    return row?.value || fallback;
  }

  getBeaconOutTime() {
    return this._getValue(KEY_BEACON_OUT_TIME, DEFAULT_BEACON_OUT_TIME);
  }

  getHistoryExpiredTime() {
    return this._getValue(KEY_HISTORY_EXPIRED, DEFAULT_HISTORY_EXPIRED_HOUR);
  }

  getNewBeaconPrefix() {
    return this._getValue(KEY_NEW_BEACON_PREFIX, DEFAULT_NEW_BEACON_PREFIX);
  }

  getTempWarnC() {
    return this._getValue(KEY_TEMP_WARN_C, DEFAULT_TEMP_WARN_C);
  }

  getTempCriticalC() {
    return this._getValue(KEY_TEMP_CRITICAL_C, DEFAULT_TEMP_CRITICAL_C);
  }

  getClientConfig() {
    return {
      tempWarnC: Number(this.getTempWarnC()),
      tempCriticalC: Number(this.getTempCriticalC()),
    };
  }

  getEditableParams() {
    return EDITABLE_PARAM_KEYS.map((key) => ({
      key,
      value: this._getValue(key, this._defaultForKey(key)),
      label: PARAM_META[key].label,
      desc: PARAM_META[key].desc,
    }));
  }

  _defaultForKey(key) {
    switch (key) {
      case KEY_BEACON_OUT_TIME:
        return DEFAULT_BEACON_OUT_TIME;
      case KEY_HISTORY_EXPIRED:
        return DEFAULT_HISTORY_EXPIRED_HOUR;
      case KEY_NEW_BEACON_PREFIX:
        return DEFAULT_NEW_BEACON_PREFIX;
      case KEY_TEMP_WARN_C:
        return DEFAULT_TEMP_WARN_C;
      case KEY_TEMP_CRITICAL_C:
        return DEFAULT_TEMP_CRITICAL_C;
      default:
        return '';
    }
  }

  _validateUpdates(updates) {
    const normalized = {};
    const errors = [];

    for (const [key, rawValue] of Object.entries(updates)) {
      if (!EDITABLE_PARAM_KEYS.includes(key)) {
        errors.push(`Unknown parameter: ${key}`);
        continue;
      }

      const value = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim();
      if (!value) {
        errors.push(`${key} cannot be empty`);
        continue;
      }

      if (key === KEY_BEACON_OUT_TIME) {
        const n = parseInt(value, 10);
        if (!Number.isFinite(n) || n < 5 || n > 3600) {
          errors.push('Beacon offline timeout must be between 5 and 3600 seconds');
          continue;
        }
        normalized[key] = String(n);
        continue;
      }

      if (key === KEY_HISTORY_EXPIRED) {
        const n = parseInt(value, 10);
        if (!Number.isFinite(n) || n < 1 || n > 8760) {
          errors.push('History retention must be between 1 and 8760 hours');
          continue;
        }
        normalized[key] = String(n);
        continue;
      }

      if (key === KEY_NEW_BEACON_PREFIX) {
        const parts = value.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);
        if (parts.length === 0) {
          errors.push('At least one MAC prefix is required');
          continue;
        }
        const invalid = parts.find((p) => !/^[0-9A-F]+$/.test(p));
        if (invalid) {
          errors.push(`Invalid MAC prefix: ${invalid}`);
          continue;
        }
        normalized[key] = parts.join(',');
        continue;
      }

      if (key === KEY_TEMP_WARN_C || key === KEY_TEMP_CRITICAL_C) {
        const n = parseFloat(value);
        if (!Number.isFinite(n) || n < -50 || n > 150) {
          errors.push(`${PARAM_META[key].label} must be between -50 and 150 °C`);
          continue;
        }
        normalized[key] = String(n);
      }
    }

    const warnC = parseFloat(
      normalized[KEY_TEMP_WARN_C] ?? this.getTempWarnC(),
    );
    const criticalC = parseFloat(
      normalized[KEY_TEMP_CRITICAL_C] ?? this.getTempCriticalC(),
    );

    if (!Number.isFinite(warnC) || !Number.isFinite(criticalC)) {
      errors.push('Temperature thresholds must be valid numbers');
    } else if (criticalC <= warnC) {
      errors.push('Critical temperature must be higher than warning temperature');
    }

    return { normalized, errors };
  }

  async updateParams(updates) {
    const { normalized, errors } = this._validateUpdates(updates);
    if (errors.length > 0) {
      const err = new Error(errors.join('; '));
      err.statusCode = 400;
      throw err;
    }

    for (const [key, value] of Object.entries(normalized)) {
      const meta = PARAM_META[key];
      await prisma.param.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          desc: meta?.desc || '',
        },
      });
    }

    await this.reload();
    return this.getEditableParams();
  }
}

export { ParamRepository };
