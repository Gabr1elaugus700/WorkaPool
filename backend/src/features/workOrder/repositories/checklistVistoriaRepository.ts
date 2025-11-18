import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const checklistVistoriaRepository = {
    create: async (data: { vistoria_id: string; checklistModeloId: string; ordemServicoId?: string | null; itens: { checklistItemId: string; checked: boolean; observacao?: string | null }[] }) => {
        // Cria vários registros ChecklistVistoria de uma vez
        const created = await prisma.checklistVistoria.createMany({
            data: data.itens.map(item => ({
                vistoria_id: data.vistoria_id,
                checklistModeloId: data.checklistModeloId,
                checklistItemId: item.checklistItemId,
                checked: item.checked,
                observacao: item.observacao ?? null,
                ordemServicoId: data.ordemServicoId ?? null,
            })),
        });
        return created;
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

