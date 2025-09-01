import { Prisma, PrismaClient } from "@prisma/client";
import { itemChecklistRepository } from "../repositories/itemChecklistRepository";

const prisma = new PrismaClient();

export const itemChecklistService = {
    create: async (data: Prisma.ChecklistItemCreateInput) => {
        return await itemChecklistRepository.create(data);
    },

    findAll: async () => {
        return await itemChecklistRepository.findAll();
    },

    findById: async (id: string) => {
        return await itemChecklistRepository.findById(id);
    },

    update: async (id: string, data: Prisma.OrdemServicoUpdateInput) => {
        return await itemChecklistRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await itemChecklistRepository.delete(id);
    },
};