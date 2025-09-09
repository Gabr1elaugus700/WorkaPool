import { Prisma, PrismaClient } from "@prisma/client";
import { vistoriaRepository } from "../repositories/vistoriaRepository";

const prisma = new PrismaClient();

export const vistoriaService = {
    create: async (data: { departamento_id: string; data_vistoria: Date; responsavel_id: string; }) => {
        return await vistoriaRepository.create({
            departamento_id: data.departamento_id,
            data_vistoria: data.data_vistoria,
            responsavel_id: data.responsavel_id,
        });
    },

    findAll: async () => {
        return await vistoriaRepository.findAll();
    },

    findById: async (id: string) => {
        return await vistoriaRepository.findById(id);
    },

    findByDepartamentoId: async (departamento_id: string) => {
        return await vistoriaRepository.findByDepartamentoId(departamento_id);
    },

    update: async (id: string, data: Prisma.VistoriaUpdateInput) => {
        return await vistoriaRepository.update(id, data);
    },

    delete: async (id: string) => {
        return await vistoriaRepository.delete(id);
    },
};