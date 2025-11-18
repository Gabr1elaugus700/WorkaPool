import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();


export const vistoriaRepository = {
    create: async (data: { departamento_id: string; data_vistoria: string; responsavel_id: string; }) => {
        return await prisma.vistoria.create({
            data: {
                departamento_id: data.departamento_id,
                responsavel_id: data.responsavel_id,
                data_vistoria: data.data_vistoria, 
            }
        });
    },

    findAll: async () => {
        return await prisma.vistoria.findMany({
            include: {
                vistoria_dpto: true,
                responsavel: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                checklistVistoria: true
            }
        });
    },

    findById: async (id: string) => {
        return await prisma.vistoria.findUnique({
            where: { id },
            include: {
                vistoria_dpto: true,
                responsavel: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                checklistVistoria: { 
                    include: {
                        checklistItem: {
                            select: {
                                id: true,
                                descricao: true,
                            }                            
                        },
                        
                    }
                }
            }
        });
    },

    findByDepartamentoId: async (departamento_id: string) => {
        return await prisma.vistoria.findMany({
            where: { departamento_id },
            include: {
                vistoria_dpto: true,
                responsavel: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                checklistVistoria: true
            }
        });
    },

    update: async (id: string, data: Prisma.VistoriaUpdateInput) => {
        return await prisma.vistoria.update({
            where: { id },
            data,
        });
    },


    delete: async (id: string) => {
        return await prisma.vistoria.delete({
            where: { id },
        });
    },
};

