-- CreateTable
CREATE TABLE "overview_customer_observation" (
    "id" TEXT NOT NULL,
    "customerCode" INTEGER NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "overview_customer_observation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "overview_customer_observation_customerCode_createdAt_id_idx" ON "overview_customer_observation"("customerCode", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "overview_customer_observation" ADD CONSTRAINT "overview_customer_observation_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
