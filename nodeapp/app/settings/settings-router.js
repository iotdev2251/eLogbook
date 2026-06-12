import express from 'express';
import { authMiddleware, adminMiddleware } from '../auth/auth-middleware.js';
import { GatewayService } from '../gateway/gateway-service.js';
import { getSystemStatus } from './system-status.js';

export function addSettingsRouter({
  paramRepository,
  mqttProcessor,
  beaconRepository,
  scheduleTask,
  mqttClient,
  startedAt,
}) {
  const router = express.Router();
  const gatewayService = new GatewayService(
    beaconRepository.getDataStore(),
    beaconRepository,
    mqttClient,
  );

  router.get('/config', authMiddleware, (req, res) => {
    res.json(paramRepository.getClientConfig());
  });

  router.get('/status', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      const status = await getSystemStatus({
        startedAt,
        mqttClient,
        beaconRepository,
      });
      res.json(status);
    } catch (err) {
      res.status(500).json({ msg: err.message || 'Failed to load system status' });
    }
  });

  router.get('/gateways', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      res.json(await gatewayService.list());
    } catch (err) {
      res.status(500).json({ msg: err.message || 'Failed to load gateways' });
    }
  });

  router.post('/gateways', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      const gateway = await gatewayService.create(req.body ?? {});
      res.status(201).json(gateway);
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message || 'Failed to create gateway' });
    }
  });

  router.patch('/gateways/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      const gateway = await gatewayService.update(req.params.id, req.body ?? {});
      res.json(gateway);
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message || 'Failed to update gateway' });
    }
  });

  router.delete('/gateways/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      const result = await gatewayService.remove(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message || 'Failed to delete gateway' });
    }
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
