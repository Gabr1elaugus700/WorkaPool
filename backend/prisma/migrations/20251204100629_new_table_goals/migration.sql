-- CreateTable
CREATE TABLE "Goals" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL DEFAULT '',
    "productGoal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codRep" INTEGER NOT NULL DEFAULT 0,
    "monthGoal" INTEGER NOT NULL DEFAULT 0,
    "yearGoal" INTEGER NOT NULL DEFAULT 0,
    "averagePrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cod_grp" TEXT DEFAULT '',

    CONSTRAINT "Goals_pkey" PRIMARY KEY ("id")
);
