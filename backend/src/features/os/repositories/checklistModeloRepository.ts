import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const checklistModeloRepository = {
    create: async (data: Prisma.ChecklistModeloCreateInput) => {
        return await prisma.checklistModelo.create({ data });
    },

    findAll: async () => {
        return await prisma.checklistModelo.findMany();
    },

    findById: async (id: string) => {
        return await prisma.checklistModelo.findUnique({
            where: { id },
        });
    },

    update: async (id: string, data: Prisma.ChecklistModeloUpdateInput) => {
        return await prisma.checklistModelo.update({
            where: { id },
            data,
        });
    },

    delete: async (id: string) => {
        return await prisma.checklistModelo.delete({
            where: { id },
        });
    },
};

