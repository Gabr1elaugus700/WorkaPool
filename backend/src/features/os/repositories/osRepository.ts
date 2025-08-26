import { PrismaClient, OrdemServico, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const osRepository = {
    create: async (data: Prisma.OrdemServicoCreateInput) => {
        return await prisma.ordemServico.create({ data });
    },

    findAll: async () => {
        return await prisma.ordemServico.findMany();
    },

    findById: async (id: string) => {
        return await prisma.ordemServico.findUnique({
            where: { id },
        });
    },

    update: async (id: string, data: Prisma.OrdemServicoUpdateInput) => {
        return await prisma.ordemServico.update({
            where: { id },
            data,
        });
    },

    delete: async (id: string) => {
        return await prisma.ordemServico.delete({
            where: { id },
        });
    },
};