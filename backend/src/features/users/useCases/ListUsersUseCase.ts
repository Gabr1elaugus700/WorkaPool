import { IUserRepository } from "../repositories/IUserRepository";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { ListUserRecord, ListUsersFilter } from "../types/User.types";

export class ListUsersUseCase {
  constructor(
    private readonly usersRepository: IUserRepository = new PrismaUserRepository(),
  ) {}

  async execute(filter?: ListUsersFilter): Promise<ListUserRecord[]> {
    return this.usersRepository.list(filter);
  }
}
