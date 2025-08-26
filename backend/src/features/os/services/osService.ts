import { Prisma } from "@prisma/client";
import { osRepository } from "../repositories/osRepository";

export const osService = {
    create: async (data: Prisma.OrdemServicoCreateInput) => {
        return await osRepository.create(data);
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