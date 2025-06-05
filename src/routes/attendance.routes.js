import express from "express";
import {
  confirmAttendance,
  cancelAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
  checkAttendance
} from "../controllers/attendance.controller.js";
import { auth} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Rutas protegidas donde se requiere autenticación
router.post("/confirm",auth, confirmAttendance);
router.post("/cancel", auth, cancelAttendance); // puede ser sin login
router.get("/mis-asistencias", auth, getUserAttendances);
router.get("/:taskId", auth, getAttendance);
router.put("/:id", auth, updateAttendance);
router.delete("/:id", auth, deleteAttendance);
router.get("/export/:taskId", auth, exportAttendance);
router.get('/check/:taskId', checkAttendance);

export default router;
