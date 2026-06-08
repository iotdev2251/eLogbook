-- CreateTable
CREATE TABLE "gateway" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "mac_addr" VARCHAR(255) NOT NULL,
    "check_point" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beacon" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mac_addr" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "nickname" VARCHAR(255),
    "report_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gateway_id" TEXT NOT NULL,
    "temp" INTEGER NOT NULL,
    "battery" INTEGER NOT NULL,
    "rssi" INTEGER NOT NULL,
    "status" VARCHAR(5) NOT NULL,

    CONSTRAINT "beacon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beacon_history" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "beacon_mac_addr" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "nickname" VARCHAR(255),
    "report_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gateway_mac_addr" TEXT NOT NULL,
    "gateway_name" TEXT NOT NULL,
    "temp" INTEGER NOT NULL,
    "battery" INTEGER NOT NULL,
    "rssi" INTEGER NOT NULL,
    "status" VARCHAR(5) NOT NULL,

    CONSTRAINT "beacon_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "param" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" VARCHAR(5000) NOT NULL,
    "desc" VARCHAR(5000) NOT NULL,

    CONSTRAINT "param_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'viewer',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beacon_mac_addr_key" ON "beacon"("mac_addr");

-- CreateIndex
CREATE INDEX "beacon_history_beacon_mac_addr_idx" ON "beacon_history"("beacon_mac_addr");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- AddForeignKey
ALTER TABLE "beacon" ADD CONSTRAINT "beacon_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
