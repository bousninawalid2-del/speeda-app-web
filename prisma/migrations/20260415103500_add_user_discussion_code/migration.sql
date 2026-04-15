-- CreateTable
CREATE TABLE "UserDiscussionCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDiscussionCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscussionCode_userId_key" ON "UserDiscussionCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscussionCode_code_key" ON "UserDiscussionCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscussionCode_key_key" ON "UserDiscussionCode"("key");

-- AddForeignKey
ALTER TABLE "UserDiscussionCode" ADD CONSTRAINT "UserDiscussionCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
