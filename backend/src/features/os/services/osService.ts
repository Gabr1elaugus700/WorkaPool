import { Prisma, PrismaClient } from "@prisma/client";
import { osRepository } from "../repositories/osRepository";

const prisma = new PrismaClient();

export const osService = {
    create: async (data: Prisma.OrdemServicoCreateInput) => {
        if (data.departamento_os?.connect?.id) {
            const departamento = await prisma.departamento.findUnique({
                where: { id: data.departamento_os.connect.id },
                select: { id: true, recebe_os: true, name: true },
            });
            if (!departamento) {
                throw new Error("Departamento não encontrado");
            }
            if (!departamento.recebe_os) {
                throw new Error(`O departamento ${departamento.name} não recebe ordens de serviço`);
            }
        }
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