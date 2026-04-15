import { Prisma, PrismaClient } from "@prisma/client";
import { osRepository } from "../repositories/osRepository";

const prisma = new PrismaClient();

export const osService = {
    create: async (data: Prisma.OrdemServicoCreateInput) => {
        return await osRepository.create(data, { imagens: true });
    },

    findAll: async () => {
        return await osRepository.findAll();
    },

    findById: async (id: string) => {
        return await osRepository.findById(id);
    },

    update: async (id: string, data: Prisma.OrdemServicoUpdateInput) => {
        return await osRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await osRepository.delete(id);
    },
};