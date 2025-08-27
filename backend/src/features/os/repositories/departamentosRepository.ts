import { PrismaClient, Departamento, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const dptosRepository = {
    create: async (data: Prisma.DepartamentoCreateInput) => {
        return await prisma.departamento.create({ data });
    },

    findAll: async () => {
        return await prisma.departamento.findMany();
    },

    findById: async (id: string) => {
        return await prisma.departamento.findUnique({
            where: { id },
        });
    },

    update: async (id: string, data: Prisma.DepartamentoUpdateInput) => {
        return await prisma.departamento.update({
            where: { id },
            data,
        });
    },

    delete: async (id: string) => {
        return await prisma.departamento.delete({
            where: { id },
        });
    },
};