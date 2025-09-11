import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const checklistVistoriaRepository = {
    create: async (data: { checklistModeloId: string; vistoria_id: string; checklistItemId: string; checked: boolean; observacao?: string }) => {
        return await prisma.checklistVistoria.create({
            data: {
                checklistModeloId: data.checklistModeloId,
                vistoria_id: data.vistoria_id,
                checklistItemId: data.checklistItemId,
                checked: data.checked,
                observacao: data.observacao,
            }
        });
    },

    findAll: async () => {
        return await prisma.checklistVistoria.findMany({
            include: {
                checklistModelo: true,
                checklistItem: {
                    select: {
                        id: true,
                        descricao: true,
                    }
                },
                OrdemServico: true
            }
        });
    },

    findById: async (id: string) => {
        return await prisma.checklistVistoria.findUnique({
            where: { id },
            include: {
                checklistModelo: true,
                checklistItem: {
                    select: {
                        id: true,
                        descricao: true,
                    }
                },
                OrdemServico: true
            }
        });
    },

    update: async (id: string, data: Prisma.ChecklistVistoriaUpdateInput) => {
        return await prisma.checklistVistoria.update({
            where: { id },
            data,
        });
    },


    delete: async (id: string) => {
        return await prisma.checklistVistoria.delete({
            where: { id },
        });
    },
};

