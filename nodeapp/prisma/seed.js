import pkg from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new pkg.PrismaClient()

async function main() {
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
    where: { id: 'Workshop' },
    update: { name: 'Workshop' },
    create: {
      id: 'Workshop',
      name: 'Workshop',
      mac_addr: "EB42F1F2B7B2",
      check_point: true
    },
  })
  const gateway2 = await prisma.gateway.upsert({
    where: { id: 'Gateway 02' },
    update: {},
    create: {
      id: 'Gateway 02',
      name: "Gateway 02",
      mac_addr: "EF0F38A6BF03",
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
      gateway_id: 'Workshop',
      temp: 242,
      battery: 0,
      rssi: 0,
      status: 'in'
    }
  })
  const b2 = await prisma.beacon.upsert({
    where: { id: 'B2' },
    update: {},
    create: {
      id: 'B2',
      name: "Beacon 2",
      nickname: "Beacon 2",
      mac_addr: "80ECCB002111",
      gateway_id: 'Workshop',
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