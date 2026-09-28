-- CreateTable
CREATE TABLE "PendingChatResponse" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "reply" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "options" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "PendingChatResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingChatResponse_sessionId_userId_consumedAt_idx" ON "PendingChatResponse"("sessionId", "userId", "consumedAt");

-- AddForeignKey
ALTER TABLE "PendingChatResponse" ADD CONSTRAINT "PendingChatResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
