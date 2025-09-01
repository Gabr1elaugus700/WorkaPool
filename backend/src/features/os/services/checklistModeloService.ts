import { Prisma, PrismaClient } from "@prisma/client";
import { checklistModeloRepository } from "../repositories/checklistModeloRepository";

const prisma = new PrismaClient();

export const checklistModeloService = {
    create: async (data: Prisma.ChecklistModeloCreateInput) => {
        return await checklistModeloRepository.create(data);
    },

    findAll: async () => {
        return await checklistModeloRepository.findAll();
    },

    findById: async (id: string) => {
        return await checklistModeloRepository.findById(id);
    },

    update: async (id: string, data: Prisma.ChecklistModeloUpdateInput) => {
        return await checklistModeloRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await checklistModeloRepository.delete(id);
    },
};