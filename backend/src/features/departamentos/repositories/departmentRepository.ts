import { PrismaClient, Prisma, FuncaoDepartamento } from "@prisma/client";

const prisma = new PrismaClient();

export const departmentRepository = {
  // CRUD básico
  create: async (data: Prisma.DepartamentoCreateInput) => {
    return await prisma.departamento.create({ data });
  },

  findAll: async () => {
    return await prisma.departamento.findMany({
      orderBy: { name: 'asc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.departamento.findUnique({
      where: { id },
      include: {
        usuarios: {
          include: {
            usuario: { select: { id: true, name: true, user: true, role: true } }
          }
        }
      }
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

  // Gestão de usuários
  addUser: async (userId: string, departamentoId: string, funcao: FuncaoDepartamento = "FUNCIONARIO") => {
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

  removeUser: async (userId: string, departamentoId: string) => {
    return await prisma.usuarioDepartamento.delete({
      where: {
        user_id_departamento_id: {
          user_id: userId,
          departamento_id: departamentoId
        }
      }
    });
  },

  getUsers: async (departamentoId: string) => {
    return await prisma.usuarioDepartamento.findMany({
      where: {
        departamento_id: departamentoId,
        ativo: true
      },
      include: {
        usuario: { select: { id: true, name: true, user: true, role: true } }
      },
      orderBy: [
        { funcao: 'asc' }, // FUNCIONARIO primeiro, depois GERENTE
        { usuario: { name: 'asc' } }
      ]
    });
  },

  updateUserFunction: async (userId: string, departamentoId: string, novaFuncao: FuncaoDepartamento) => {
    return await prisma.usuarioDepartamento.update({
      where: {
        user_id_departamento_id: {
          user_id: userId,
          departamento_id: departamentoId
        }
      },
      data: {
        funcao: novaFuncao
      },
      include: {
        usuario: { select: { id: true, name: true, user: true } },
        departamento: { select: { id: true, name: true } }
      }
    });
  },

  getManagers: async (departamentoId: string) => {
    return await prisma.usuarioDepartamento.findMany({
      where: {
        departamento_id: departamentoId,
        funcao: "GERENTE",
        ativo: true
      },
      include: {
        usuario: { select: { id: true, name: true, user: true, role: true } }
      },
      orderBy: { usuario: { name: 'asc' } }
    });
  },

  // Buscar por critério
  findByRecebeOS: async (recebeOS: boolean) => {
    return await prisma.departamento.findMany({
      where: { recebe_os: recebeOS },
      orderBy: { name: 'asc' }
    });
  },

  // Buscar departamentos com contagem de usuários
  findAllWithUserCount: async () => {
    return await prisma.departamento.findMany({
      include: {
        _count: {
          select: { usuarios: { where: { ativo: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
};
