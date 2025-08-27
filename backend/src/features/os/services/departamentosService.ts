import { Prisma } from "@prisma/client";
import { dptosRepository } from "../repositories/departamentosRepository";

export const dptosService = {
    create: async (data: Prisma.DepartamentoCreateInput) => {
        return await dptosRepository.create(data);
    },

    findAll: async () => {
        return await dptosRepository.findAll();
    },

    findById: async (id: string) => {
        return await dptosRepository.findById(id);
    },

    update: async (id: string, data: Prisma.DepartamentoUpdateInput) => {
        return await dptosRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await dptosRepository.delete(id);
    },
};