import { Router } from "express";
import { departmentController } from "../controllers/departmentController";
import { validate } from "../../../middlewares/validate";
import { 
  createDepartmentSchema, 
  updateDepartmentSchema,
  getDepartmentByIdSchema,
  deleteDepartmentSchema,
  addUserToDepartmentSchema,
  removeUserFromDepartmentSchema,
  getDepartmentUsersSchema,
  updateUserFunctionSchema,
  getDepartmentManagersSchema
} from "../schemas/departmentSchemas";

const router = Router();

// CRUD básico de departamentos
router.post("/", validate(createDepartmentSchema), departmentController.create);
router.get("/", departmentController.findAll);
router.get("/:id", validate(getDepartmentByIdSchema), departmentController.findById);
router.put("/:id", validate(updateDepartmentSchema), departmentController.update);
router.delete("/:id", validate(deleteDepartmentSchema), departmentController.delete);

// Rotas especiais
router.get("/filter/aceita-os", departmentController.getDepartmentsThatAcceptOS);

// Gestão de usuários no departamento
router.post("/users/add", validate(addUserToDepartmentSchema), departmentController.addUser);
router.delete("/users/remove", validate(removeUserFromDepartmentSchema), departmentController.removeUser);
router.get("/:departamentoId/users", validate(getDepartmentUsersSchema), departmentController.getUsers);
router.put("/users/function", validate(updateUserFunctionSchema), departmentController.updateUserFunction);
router.get("/:departamentoId/managers", validate(getDepartmentManagersSchema), departmentController.getManagers);

export default router;