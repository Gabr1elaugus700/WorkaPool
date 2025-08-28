import { PrismaClient, FuncaoDepartamento } from "@prisma/client";
import { departmentRepository } from "../repositories/departmentRepository";

const prisma = new PrismaClient();

export const departmentService = {
  // CRUD básico
  create: async (data: { name: string; recebe_os?: boolean }) => {
    const exists = await prisma.departamento.findUnique({ where: { name: data.name } });
    
    if (exists) {
      throw new Error("Departamento já existe");
    }

    return await departmentRepository.create(data);
  },

  findAll: async () => {
    return await departmentRepository.findAll();
  },

  findById: async (id: string) => {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new Error("Departamento não encontrado");
    }
    return department;
  },

  update: async (id: string, data: any) => {
    const exists = await departmentRepository.findById(id);
    if (!exists) {
      throw new Error("Departamento não encontrado");
    }

    // Se estão tentando alterar o nome, verificar se já existe
    if (data.name && data.name !== exists.name) {
      const nameExists = await prisma.departamento.findUnique({ where: { name: data.name } });
      if (nameExists) {
        throw new Error("Já existe um departamento com este nome");
      }
    }

    return await departmentRepository.update(id, data);
  },

  delete: async (id: string) => {
    const exists = await departmentRepository.findById(id);
    if (!exists) {
      throw new Error("Departamento não encontrado");
    }

    // Verificar se há usuários vinculados
    const usersCount = await prisma.usuarioDepartamento.count({
      where: { departamento_id: id, ativo: true }
    });

    if (usersCount > 0) {
      throw new Error("Não é possível excluir departamento com usuários vinculados");
    }

    return await departmentRepository.delete(id);
  },

  // Gestão de usuários
  addUser: async (userId: string, departamentoId: string, funcao: FuncaoDepartamento = "FUNCIONARIO") => {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o departamento existe
    const department = await prisma.departamento.findUnique({ where: { id: departamentoId } });
    if (!department) {
      throw new Error("Departamento não encontrado");
    }

    try {
      return await departmentRepository.addUser(userId, departamentoId, funcao);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error("Usuário já está vinculado a este departamento");
      }
      throw error;
    }
  },

  removeUser: async (userId: string, departamentoId: string) => {
    try {
      return await departmentRepository.removeUser(userId, departamentoId);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error("Usuário não está vinculado a este departamento");
      }
      throw error;
    }
  },

  getUsers: async (departamentoId: string) => {
    const exists = await departmentRepository.findById(departamentoId);
    if (!exists) {
      throw new Error("Departamento não encontrado");
    }

    return await departmentRepository.getUsers(departamentoId);
  },

  updateUserFunction: async (userId: string, departamentoId: string, novaFuncao: FuncaoDepartamento) => {
    try {
      return await departmentRepository.updateUserFunction(userId, departamentoId, novaFuncao);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error("Usuário não está vinculado a este departamento");
      }
      throw error;
    }
  },

  getManagers: async (departamentoId: string) => {
    const exists = await departmentRepository.findById(departamentoId);
    if (!exists) {
      throw new Error("Departamento não encontrado");
    }

    return await departmentRepository.getManagers(departamentoId);
  },

  // Buscar por critério
  findByRecebeOS: async (recebeOS: boolean) => {
    return await departmentRepository.findByRecebeOS(recebeOS);
  },

  // Validar se departamento pode receber OS (usado no osService)
  canReceiveOS: async (departamentoId: string) => {
    const department = await departmentRepository.findById(departamentoId);
    
    if (!department) {
      throw new Error("Departamento não encontrado");
    }

    if (!department.recebe_os) {
      throw new Error(`O departamento "${department.name}" não aceita ordens de serviço`);
    }

    return true;
  }
};
