/*
  Warnings:

  - The primary key for the `motor_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `event` on the `motor_events` table. All the data in the column will be lost.
  - You are about to drop the column `id_event` on the `motor_events` table. All the data in the column will be lost.
  - Added the required column `speed` to the `motor_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "motor_events" DROP CONSTRAINT "motor_events_pkey",
DROP COLUMN "event",
DROP COLUMN "id_event",
ADD COLUMN     "id_motor_event" SERIAL NOT NULL,
ADD COLUMN     "speed" TEXT NOT NULL,
ADD CONSTRAINT "motor_events_pkey" PRIMARY KEY ("id_motor_event");
