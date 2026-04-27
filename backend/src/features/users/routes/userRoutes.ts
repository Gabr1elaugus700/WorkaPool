import express from "express";
import { userController } from "../controllers/userController";
import { validate } from "../../../middlewares/validate";
import { usersContracts } from "../contracts/user.contracts";

const router = express.Router();
const [findAllContract, getDepartmentsContract, findByIdContract, updateContract, deleteContract] =
  usersContracts;

router.get("/", validate(findAllContract.validationSchema!), userController.findAll);
router.get(
  "/:id/departamentos",
  validate(getDepartmentsContract.validationSchema!),
  userController.getUserDepartments
);
router.get("/:id", validate(findByIdContract.validationSchema!), userController.findById);
router.put("/:id/update", validate(updateContract.validationSchema!), userController.update);
router.post("/:id/delete", validate(deleteContract.validationSchema!), userController.delete);

export default router;
