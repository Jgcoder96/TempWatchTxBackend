/*
  Warnings:

  - Changed the type of `event` on the `sensor_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "sensor_events" DROP COLUMN "event",
ADD COLUMN     "event" TEXT NOT NULL;

-- DropEnum
DROP TYPE "event_type";
