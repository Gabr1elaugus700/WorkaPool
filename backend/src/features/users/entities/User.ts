import { Role } from "@prisma/client";
import { v4 as uuid } from "uuid";
import { AppError } from "../../../utils/AppError";
import bcrypt from "bcrypt";

export interface UserProps {
    id?: string;
    name: string;
    user: string;
    password: string;
    role: Role;
    codRep: number;
    mustChangePassword: boolean;
}

export type RegisterUserInput = {
    user: string;
    password: string;
    role?: Role;
    name?: string;
    codRep?: number;
    mustChangePassword?: boolean;
};

export type LoginUserInput = {
    user: string;
    password: string;
};

export class User {
    public readonly id: string;
    public name: string;
    public user: string;
    private _password: string;
    public role: Role;
    public codRep: number;
    public mustChangePassword: boolean;

    constructor({ id, name, user, password, role, codRep, mustChangePassword }: UserProps) {
        this.id = id || uuid();
        this.name = name;
        this.user = user;
        this._password = password;
        this.role = role ?? "USER";
        this.codRep = codRep ?? 999;
        this.mustChangePassword = mustChangePassword ?? true;

        if (!this.name) {
            throw new AppError({ message: "Nome é obrigatório", statusCode: 400, code: "NAME_REQUIRED", details: "Nome é obrigatório" });
        }
        if (!this.user) {
            throw new AppError({ message: "Usuário é obrigatório", statusCode: 400, code: "USER_REQUIRED", details: "Usuário é obrigatório" });
        }
        if (!this._password) {
            throw new AppError({ message: "Senha é obrigatória", statusCode: 400, code: "PASSWORD_REQUIRED", details: "Senha é obrigatória" });
        }
        if (!this.role) {
            throw new AppError({ message: "Role é obrigatória", statusCode: 400, code: "ROLE_REQUIRED", details: "Role é obrigatória" });
        }
        if (this.codRep == null) {
            throw new AppError({ message: "Código de representante é obrigatório", statusCode: 400, code: "COD_REP_REQUIRED", details: "Código de representante é obrigatório" });
        }
    }

    public static async create(userProps: RegisterUserInput): Promise<User> {
        if (!userProps.password) {
            throw new AppError({ message: "Senha é obrigatória", statusCode: 400, code: "PASSWORD_REQUIRED", details: "Senha é obrigatória" });
        }

        const hashedPassword = await bcrypt.hash(userProps.password, 10);

        return new User({
            name: userProps.name ?? "",
            user: userProps.user,
            password: hashedPassword,
            role: userProps.role ?? "USER",
            codRep: userProps.codRep ?? 999,
            mustChangePassword: userProps.mustChangePassword ?? true,
        });
    }

    public toPersistence(): UserProps {
        return {
            id: this.id,
            name: this.name,
            user: this.user,
            password: this._password,
            role: this.role,
            codRep: this.codRep,
            mustChangePassword: this.mustChangePassword,
        };
    }
}