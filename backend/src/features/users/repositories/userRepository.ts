import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient();

export const userRepository = {
    create: async (data: Prisma.UserCreateInput) => {
        return await prisma.user.create({ data });
        },

        findAll: async () => {
        return await prisma.user.findMany({
            select: {
            id: true,
            name: true,
            user: true,
            role: true,
            createdAt: true,
            departamentos: {
                include: {
                departamento: { select: { id: true, name: true } }
                }
            },
            },
            
        });
        },

        findById: async (id: string) => {
        return await prisma.user.findUnique({
            where: { id },
        });
    },

    update: async (id: string, data: Prisma.UserUpdateInput) => {
        return await prisma.user.update({
            where: { id },
            data,
        });
    },

    delete: async (id: string) => {
        return await prisma.user.delete({
            where: { id },
        });
    },

    // Método para vincular usuário a departamento
    addToDepartamento: async (userId: string, departamentoId: string, funcao: "GERENTE" | "FUNCIONARIO" = "FUNCIONARIO") => {
        return await prisma.usuarioDepartamento.create({
            data: {
                user_id: userId,
                departamento_id: departamentoId,
                funcao: funcao
            },
            include: {
                usuario: { select: { id: true, name: true, user: true } },
                departamento: { select: { id: true, name: true } }
            }
        });
    },

    // Remover usuário do departamento
    removeFromDepartamento: async (userId: string, departamentoId: string) => {
        return await prisma.usuarioDepartamento.delete({
            where: {
                user_id_departamento_id: {
                    user_id: userId,
                    departamento_id: departamentoId
                }
            }
        });
    },

    // Buscar usuários de um departamento
    findByDepartamento: async (departamentoId: string) => {
        return await prisma.usuarioDepartamento.findMany({
            where: {
                departamento_id: departamentoId,
                ativo: true
            },
            include: {
                usuario: { select: { id: true, name: true, user: true, role: true } }
            }
        });
    },

    // Buscar departamentos de um usuário
    findUserDepartamentos: async (userId: string) => {
        return await prisma.usuarioDepartamento.findMany({
            where: {
                user_id: userId,
                ativo: true
            },
            include: {
                departamento: { select: { id: true, name: true } }
            }
        });
    },

    // Atualizar função no departamento
    updateFuncaoNoDepartamento: async (userId: string, departamentoId: string, novaFuncao: "GERENTE" | "FUNCIONARIO") => {
        return await prisma.usuarioDepartamento.update({
            where: {
                user_id_departamento_id: {
                    user_id: userId,
                    departamento_id: departamentoId
                }
            },
            data: {
                funcao: novaFuncao
            }
        });
    }
};