import { Router } from "express";
import { 
  getAllActivities, 
  approveActivity, 
  rejectActivity, 
  toggleActivityPromotion,
  getActivityStats
} from "../controllers/adminTasks.controller.js";

import { 
  getAllUsers,
  getUserDetails,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats
} from "../controllers/adminUsers.controller.js";

import { 
  getAllAttendances,
  getAttendanceStats,
  deleteAttendance
} from "../controllers/adminAttendances.controller.js";

import { auth } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Middleware para todas las rutas
router.use(auth);
router.use(authorizeRoles('admin', 'superadmin'));

// Rutas para gestión de actividades
router.get("/activities", getAllActivities);
router.patch("/activities/:id/approve", approveActivity);
router.patch("/activities/:id/reject", rejectActivity);
router.patch("/activities/:id/promote", toggleActivityPromotion);
router.get("/activities/stats", getActivityStats);

// Rutas para gestión de usuarios
router.get("/users/stats", getUserStats);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id", updateUser);
router.patch("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// Rutas para gestión de asistencias
router.get("/attendances", getAllAttendances);
router.get("/attendances/stats", getAttendanceStats);
router.delete("/attendances/:id", deleteAttendance);

export default router;