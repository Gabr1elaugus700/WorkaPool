import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const checklistModeloRepository = {
    create: async (data: { nome: string; departamento_id: string; itens: string[] }) => {
        return await prisma.checklistModelo.create({
            data: {
                nome: data.nome,
                departamento: { connect: { id: data.departamento_id } },
                itens: {
                    create: data.itens.map(itemId => ({
                        checklistItem: { connect: { id: itemId } }
                    }))
                }
            }
        });
    },

    findAll: async () => {
        return await prisma.checklistModelo.findMany({
            include: {
                departamento: true,
                itens: {
                    include: {
                        checklistItem: true
                    }
                }
            }
        });
    },

    findById: async (id: string) => {
        return await prisma.checklistModelo.findUnique({
            where: { id },
            include: {
                departamento: true,
                itens: {
                    include: {
                        checklistItem: true
                    }
                }
            }
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

