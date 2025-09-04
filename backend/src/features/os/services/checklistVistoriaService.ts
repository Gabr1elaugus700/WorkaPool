import { Prisma, PrismaClient } from "@prisma/client";
import { vistoriaRepository } from "../repositories/vistoriaRepository";
const prisma = new PrismaClient();

export const checklistVistoriaService = {
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
        return await vistoriaRepository.findAll();
    },

    findById: async (id: string) => {
        return await vistoriaRepository.findById(id);
    },

    update: async (id: string, data: Prisma.ChecklistModeloUpdateInput) => {
        return await vistoriaRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await vistoriaRepository.delete(id);
    },
};