-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('critique', 'preventive', 'emergency');

-- CreateTable
CREATE TABLE "sensors" (
    "id_sensors" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id_sensors")
);

-- CreateTable
CREATE TABLE "sensor_samples" (
    "id_sample" SERIAL NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_sensors" TEXT NOT NULL,

    CONSTRAINT "sensor_samples_pkey" PRIMARY KEY ("id_sample")
);

-- CreateTable
CREATE TABLE "sensor_events" (
    "id_event" SERIAL NOT NULL,
    "event" "event_type" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_sensors" TEXT NOT NULL,
    "id_sample" INTEGER,

    CONSTRAINT "sensor_events_pkey" PRIMARY KEY ("id_event")
);

-- CreateIndex
CREATE UNIQUE INDEX "sensors_name_key" ON "sensors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_samples_id_sensors_date_key" ON "sensor_samples"("id_sensors", "date");

-- AddForeignKey
ALTER TABLE "sensor_samples" ADD CONSTRAINT "sensor_samples_id_sensors_fkey" FOREIGN KEY ("id_sensors") REFERENCES "sensors"("id_sensors") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_id_sensors_fkey" FOREIGN KEY ("id_sensors") REFERENCES "sensors"("id_sensors") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_id_sample_fkey" FOREIGN KEY ("id_sample") REFERENCES "sensor_samples"("id_sample") ON DELETE SET NULL ON UPDATE CASCADE;
