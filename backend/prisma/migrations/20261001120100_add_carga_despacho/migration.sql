-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateTable
CREATE TABLE "CargaDespacho" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "caminhaoId" TEXT NOT NULL,
    "fechadoPorId" TEXT NOT NULL,
    "fechadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CargaDespacho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CargaDespacho_cargaId_key" ON "CargaDespacho"("cargaId");

-- AddForeignKey
ALTER TABLE "CargaDespacho" ADD CONSTRAINT "CargaDespacho_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaDespacho" ADD CONSTRAINT "CargaDespacho_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaDespacho" ADD CONSTRAINT "CargaDespacho_caminhaoId_fkey" FOREIGN KEY ("caminhaoId") REFERENCES "Trucks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaDespacho" ADD CONSTRAINT "CargaDespacho_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
