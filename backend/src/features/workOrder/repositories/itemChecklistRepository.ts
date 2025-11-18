import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const itemChecklistRepository = {
    create: async (data: Prisma.ChecklistItemCreateInput) => {
        return await prisma.checklistItem.create({ data });
    },

    findAll: async () => {
        return await prisma.checklistItem.findMany();
    },

    findById: async (id: string) => {
        return await prisma.checklistItem.findUnique({
            where: { id },
        });
    },

    update: async (id: string, data: Prisma.ChecklistItemUpdateInput) => {
        return await prisma.checklistItem.update({
            where: { id },
            data,
        });
    },

    delete: async (id: string) => {
        return await prisma.checklistItem.delete({
            where: { id },
        });
    },
};

