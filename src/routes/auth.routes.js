import { Router } from "express";  // {router}  crea un enrrutador //


import {
  login,
  loginWithGoogle,
  logout,
  register,
  verifyToken,
 
} from "../controllers/auth.controller.js";

import { validateSchema } from "../middlewares/validator.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { sendPasswordResetEmail } from "firebase/auth";

const router = Router();

router.post("/register", validateSchema(registerSchema), register);
router.post("/login", validateSchema(loginSchema), login);
router.get("/verify", verifyToken);
router.post("/logout",  logout);
router.post("/google",loginWithGoogle);
router.post("/forgot-password", sendPasswordResetEmail);

export default router;
