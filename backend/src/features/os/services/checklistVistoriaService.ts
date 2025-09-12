import { Prisma, PrismaClient } from "@prisma/client";
import { checklistVistoriaRepository } from "../repositories/checklistVistoriaRepository";
const prisma = new PrismaClient();

export const checklistVistoriaService = {
    create: async (data: { vistoria_id: string; checklistModeloId: string; ordemServicoId?: string | null; itens: { checklistItemId: string; checked: boolean; observacao?: string | null }[] }) => {
        return await checklistVistoriaRepository.create(data);
    },

    findAll: async () => {
        return await checklistVistoriaRepository.findAll();
    },

    findById: async (id: string) => {
        return await checklistVistoriaRepository.findById(id);
    },

    update: async (id: string, data: Prisma.ChecklistVistoriaUpdateInput) => {
        return await checklistVistoriaRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await checklistVistoriaRepository.delete(id);
    },
};