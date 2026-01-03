-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "deletedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RoomMember" ALTER COLUMN "deletedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "deletedAt" DROP DEFAULT;
