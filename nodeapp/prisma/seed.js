import pkg from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new pkg.PrismaClient()

const LEGACY_GATEWAY_IDS = ['Check Point Gateway', 'Check Point']
const WORKSHOP_ID = 'Workshop'
const OFFICE_DESK_ID = 'OfficeDesk'
const OFFICE_DESK_MAC = 'CE6299527263'
const LEGACY_GATEWAY_02_ID = 'Gateway 02'

/** Rename existing DB gateway (seed alone does not update old primary keys). */
async function migrateLegacyGatewayToWorkshop() {
  for (const oldId of LEGACY_GATEWAY_IDS) {
    const legacy = await prisma.gateway.findUnique({ where: { id: oldId } })
    if (!legacy) continue

    await prisma.gateway.upsert({
      where: { id: WORKSHOP_ID },
      update: {
        name: WORKSHOP_ID,
        mac_addr: legacy.mac_addr,
        check_point: legacy.check_point,
      },
      create: {
        id: WORKSHOP_ID,
        name: WORKSHOP_ID,
        mac_addr: legacy.mac_addr,
        check_point: legacy.check_point,
      },
    })

    await prisma.beacon.updateMany({
      where: { gateway_id: oldId },
      data: { gateway_id: WORKSHOP_ID },
    })

    await prisma.beacon_history.updateMany({
      where: { gateway_name: oldId },
      data: { gateway_name: WORKSHOP_ID },
    })

    if (oldId !== WORKSHOP_ID) {
      await prisma.gateway.delete({ where: { id: oldId } })
    }

    console.log(`Migrated gateway "${oldId}" → "${WORKSHOP_ID}"`)
  }
}

async function migrateGateway02ToOfficeDesk() {
  const legacy = await prisma.gateway.findUnique({ where: { id: LEGACY_GATEWAY_02_ID } })
  if (!legacy) return

  await prisma.gateway.upsert({
    where: { id: OFFICE_DESK_ID },
    update: {
      name: OFFICE_DESK_ID,
      mac_addr: OFFICE_DESK_MAC,
      check_point: legacy.check_point,
    },
    create: {
      id: OFFICE_DESK_ID,
      name: OFFICE_DESK_ID,
      mac_addr: OFFICE_DESK_MAC,
      check_point: legacy.check_point,
    },
  })

  await prisma.beacon.updateMany({
    where: { gateway_id: LEGACY_GATEWAY_02_ID },
    data: { gateway_id: OFFICE_DESK_ID },
  })

  await prisma.beacon_history.updateMany({
    where: { gateway_name: LEGACY_GATEWAY_02_ID },
    data: { gateway_name: OFFICE_DESK_ID },
  })

  await prisma.gateway.delete({ where: { id: LEGACY_GATEWAY_02_ID } })
  console.log(`Migrated gateway "${LEGACY_GATEWAY_02_ID}" → "${OFFICE_DESK_ID}"`)
}

/** CE6299527263 is OfficeDesk gateway MAC — not a beacon. */
async function fixMisassignedOfficeDeskBeacon() {
  const mistaken = await prisma.beacon.findUnique({ where: { mac_addr: OFFICE_DESK_MAC } })
  if (mistaken) {
    await prisma.beacon.delete({ where: { mac_addr: OFFICE_DESK_MAC } })
    console.log(`Removed mistaken beacon for gateway MAC ${OFFICE_DESK_MAC}`)
  }
}

async function main() {
  await migrateLegacyGatewayToWorkshop()
  await migrateGateway02ToOfficeDesk()
  await fixMisassignedOfficeDeskBeacon()

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, role: 'admin' },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    }
  })
  const gateway1 = await prisma.gateway.upsert({
    where: { id: WORKSHOP_ID },
    update: { name: WORKSHOP_ID },
    create: {
      id: WORKSHOP_ID,
      name: WORKSHOP_ID,
      mac_addr: "EB42F1F2B7B2",
      check_point: true
    },
  })
  const gateway2 = await prisma.gateway.upsert({
    where: { id: OFFICE_DESK_ID },
    update: {
      name: OFFICE_DESK_ID,
      mac_addr: OFFICE_DESK_MAC,
    },
    create: {
      id: OFFICE_DESK_ID,
      name: OFFICE_DESK_ID,
      mac_addr: OFFICE_DESK_MAC,
      check_point: false
    },
  })

  console.log({ gateway1, gateway2 })
  newBeacon()
  param()
}

async function newBeacon() {
  const b1 = await prisma.beacon.upsert({
    where: { id: 'B1' },
    update: {},
    create: {
      id: 'B1',
      name: "Beacon 1",
      nickname: "Beacon 1",
      mac_addr: "80ECCC0008B6",
      gateway_id: WORKSHOP_ID,
      temp: 242,
      battery: 0,
      rssi: 0,
      status: 'in'
    }
  })
  const b2 = await prisma.beacon.upsert({
    where: { id: 'B2' },
    update: {
      name: 'Beacon 2',
      nickname: 'Beacon 2',
      mac_addr: '80ECCB002111',
    },
    create: {
      id: 'B2',
      name: 'Beacon 2',
      nickname: 'Beacon 2',
      mac_addr: '80ECCB002111',
      gateway_id: WORKSHOP_ID,
      temp: 242,
      battery: 0,
      rssi: 0,
      status: 'in'
    }
  })
  console.log({b1, b2})
}

async function param() {
  await prisma.param.upsert({
    where: { key: 'BEACON_OUT_TIME' },
    update: {},
    create: {
      key: 'BEACON_OUT_TIME',
      value: '30',
      desc: 'Time to consider the beacon to be `OUT` or `ALERT`.  In seconds.'
    }
  })
  await prisma.param.upsert({
    where: { key: 'HISTORY_DELETE_EXPIRED_HOUR' },
    update: {},
    create: {
      key: 'HISTORY_DELETE_EXPIRED_HOUR',
      value: '36',
      desc: 'Time to delete the beacon history.  In hours.'
    }
  })
  await prisma.param.upsert({
    where: { key: 'NEW_BEACON_PREFIX' },
    update: {},
    create: {
      key: 'NEW_BEACON_PREFIX',
      value: '80ECCC,80ECCB,80ECCA',
      desc: 'New Beacon Mac Address Prefix to be automatically accepted by system. Comma separated (,).'
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })