import express from 'express';
import { authMiddleware, adminMiddleware } from '../auth/auth-middleware.js';

export function addSettingsRouter(paramRepository, mqttProcessor, beaconRepository, scheduleTask) {
  const router = express.Router();

  router.get('/config', authMiddleware, (req, res) => {
    res.json(paramRepository.getClientConfig());
  });

  router.get('/params', [authMiddleware, adminMiddleware], (req, res) => {
    res.json(paramRepository.getEditableParams());
  });

  router.patch('/params', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      const updates = req.body?.params ?? req.body;
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ msg: 'Invalid parameters payload' });
      }

      const params = await paramRepository.updateParams(updates);

      if (updates.BEACON_OUT_TIME != null) {
        mqttProcessor.setExpiredSeconds(Number(paramRepository.getBeaconOutTime()));
      }
      if (updates.NEW_BEACON_PREFIX != null) {
        beaconRepository.setBeaconPrefixes(paramRepository.getNewBeaconPrefix());
      }
      if (updates.HISTORY_DELETE_EXPIRED_HOUR != null && scheduleTask) {
        scheduleTask.setHistoryExpiredHours(Number(paramRepository.getHistoryExpiredTime()));
      }

      res.json({
        params,
        config: paramRepository.getClientConfig(),
      });
    } catch (err) {
      const status = err.statusCode || 500;
      res.status(status).json({ msg: err.message || 'Failed to update settings' });
    }
  });

  return router;
}
