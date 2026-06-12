import { normalizeMac } from '../beacon/mac-utils.js';

function normalizeGatewayId(id) {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  if (trimmed.length < 2 || trimmed.length > 50) {
    throw Object.assign(new Error('Gateway ID must be 2–50 characters'), { statusCode: 400 });
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(trimmed)) {
    throw Object.assign(new Error('Gateway ID may only contain letters, numbers, spaces, hyphens, and underscores'), { statusCode: 400 });
  }
  return trimmed;
}

function validateMac(mac) {
  const normalized = normalizeMac(mac);
  if (normalized.length < 6 || normalized.length > 12) {
    throw Object.assign(new Error('MAC address must be 6–12 hexadecimal characters'), { statusCode: 400 });
  }
  return normalized;
}

function toClientGateway(gateway, beaconCount = 0) {
  return {
    id: gateway.id,
    name: gateway.name,
    mac_addr: gateway.mac_addr,
    check_point: gateway.check_point,
    beacon_count: beaconCount,
    created_at: gateway.created_at,
    updated_at: gateway.updated_at,
  };
}

class GatewayService {
  constructor(beaconDataStore, beaconRepository, mqttClient) {
    this._beaconDataStore = beaconDataStore;
    this._beaconRepository = beaconRepository;
    this._mqttClient = mqttClient;
  }

  async list() {
    const gateways = await this._beaconDataStore.getAllGateways();
    const result = [];

    for (const gateway of gateways) {
      const beaconCount = await this._beaconDataStore.countBeaconsForGateway(gateway.id);
      result.push(toClientGateway(gateway, beaconCount));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(payload) {
    const id = normalizeGatewayId(payload.id);
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const mac_addr = validateMac(payload.mac_addr);
    const check_point = Boolean(payload.check_point);

    if (name.length < 2) {
      throw Object.assign(new Error('Gateway name must be at least 2 characters'), { statusCode: 400 });
    }

    const existingId = await this._beaconDataStore.getGatewayById(id);
    if (existingId) {
      throw Object.assign(new Error('Gateway ID already exists'), { statusCode: 400 });
    }

    const existingMac = await this._beaconDataStore.getGatewayByMac(mac_addr);
    if (existingMac) {
      throw Object.assign(new Error('Gateway MAC address already exists'), { statusCode: 400 });
    }

    const gateway = await this._beaconDataStore.createGateway({
      id,
      name,
      mac_addr,
      check_point,
    });

    this._beaconRepository.upsertGatewayInMemory(gateway);
    this._mqttClient?.subscribeGateway(mac_addr);

    return toClientGateway(gateway, 0);
  }

  async update(id, payload) {
    const gateway = await this._beaconDataStore.getGatewayById(id);
    if (!gateway) {
      throw Object.assign(new Error('Gateway not found'), { statusCode: 404 });
    }

    const previousMac = gateway.mac_addr;
    const data = {};

    if (payload.name !== undefined) {
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';
      if (name.length < 2) {
        throw Object.assign(new Error('Gateway name must be at least 2 characters'), { statusCode: 400 });
      }
      data.name = name;
    }

    if (payload.mac_addr !== undefined) {
      const mac_addr = validateMac(payload.mac_addr);
      if (mac_addr !== gateway.mac_addr) {
        const existingMac = await this._beaconDataStore.getGatewayByMac(mac_addr);
        if (existingMac && existingMac.id !== id) {
          throw Object.assign(new Error('Gateway MAC address already exists'), { statusCode: 400 });
        }
        data.mac_addr = mac_addr;
      }
    }

    if (payload.check_point !== undefined) {
      data.check_point = Boolean(payload.check_point);
    }

    if (Object.keys(data).length === 0) {
      const beaconCount = await this._beaconDataStore.countBeaconsForGateway(id);
      return toClientGateway(gateway, beaconCount);
    }

    const updated = await this._beaconDataStore.updateGateway(id, data);
    this._beaconRepository.upsertGatewayInMemory(updated);
    this._beaconRepository.syncBeaconGatewayMetadata(updated);

    if (data.mac_addr && data.mac_addr !== previousMac) {
      this._beaconRepository.removeGatewayFromMemory(previousMac);
      this._mqttClient?.unsubscribeGateway(previousMac);
      this._mqttClient?.subscribeGateway(updated.mac_addr);
    }

    const beaconCount = await this._beaconDataStore.countBeaconsForGateway(id);
    return toClientGateway(updated, beaconCount);
  }

  async remove(id) {
    const gateway = await this._beaconDataStore.getGatewayById(id);
    if (!gateway) {
      throw Object.assign(new Error('Gateway not found'), { statusCode: 404 });
    }

    const beaconCount = await this._beaconDataStore.countBeaconsForGateway(id);
    if (beaconCount > 0) {
      throw Object.assign(
        new Error(`Cannot delete gateway with ${beaconCount} assigned beacon(s)`),
        { statusCode: 400 },
      );
    }

    await this._beaconDataStore.deleteGateway(id);
    this._beaconRepository.removeGatewayFromMemory(gateway.mac_addr);
    this._mqttClient?.unsubscribeGateway(gateway.mac_addr);

    return { msg: 'Gateway removed' };
  }
}

export { GatewayService };
