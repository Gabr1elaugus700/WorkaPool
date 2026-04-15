import { Router } from "express";
import { osController } from "../controllers/osController";
import { validate } from "../../../middlewares/validate";
import { createOSSchema, updateOSSchema } from "../validations/osSchemas";

const multer = require("multer");
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req: any, file: any, cb: any) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

const router = Router();

router.post("/", upload.array("imagens"), validate(createOSSchema), osController.create);
router.get("/", osController.findAll);
router.get("/:id", osController.findById);
router.put("/:id", validate(updateOSSchema), osController.update);
router.delete("/:id", osController.delete);
export default router;
