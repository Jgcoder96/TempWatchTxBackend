/*
  Warnings:

  - You are about to drop the column `id_sensors` on the `sensor_events` table. All the data in the column will be lost.
  - You are about to drop the column `id_sensors` on the `sensor_samples` table. All the data in the column will be lost.
  - The primary key for the `sensors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_sensors` on the `sensors` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_sensor,date]` on the table `sensor_samples` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_sensor` to the `sensor_samples` table without a default value. This is not possible if the table is not empty.
  - The required column `id_sensor` was added to the `sensors` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "sensor_events" DROP CONSTRAINT "sensor_events_id_sensors_fkey";

-- DropForeignKey
ALTER TABLE "sensor_samples" DROP CONSTRAINT "sensor_samples_id_sensors_fkey";

-- DropIndex
DROP INDEX "sensor_samples_id_sensors_date_key";

-- AlterTable
ALTER TABLE "sensor_events" DROP COLUMN "id_sensors";

-- AlterTable
ALTER TABLE "sensor_samples" DROP COLUMN "id_sensors",
ADD COLUMN     "id_sensor" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sensors" DROP CONSTRAINT "sensors_pkey",
DROP COLUMN "id_sensors",
ADD COLUMN     "id_sensor" TEXT NOT NULL,
ADD CONSTRAINT "sensors_pkey" PRIMARY KEY ("id_sensor");

-- CreateTable
CREATE TABLE "motor_events" (
    "id_event" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "id_sample" INTEGER,

    CONSTRAINT "motor_events_pkey" PRIMARY KEY ("id_event")
);

-- CreateIndex
CREATE UNIQUE INDEX "sensor_samples_id_sensor_date_key" ON "sensor_samples"("id_sensor", "date");

-- AddForeignKey
ALTER TABLE "sensor_samples" ADD CONSTRAINT "sensor_samples_id_sensor_fkey" FOREIGN KEY ("id_sensor") REFERENCES "sensors"("id_sensor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motor_events" ADD CONSTRAINT "motor_events_id_sample_fkey" FOREIGN KEY ("id_sample") REFERENCES "sensor_samples"("id_sample") ON DELETE SET NULL ON UPDATE CASCADE;
