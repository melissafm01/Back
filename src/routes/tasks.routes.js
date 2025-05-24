import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  searchTask,
  promoteTask
} from "../controllers/tasks.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createTaskSchema } from "../schemas/task.schema.js";
import  upload  from "../middlewares/multer.middleware.js";


const router = Router();

router.get("/tasks", auth, getTasks);

router.post("/tasks", auth, upload,validateSchema(createTaskSchema), createTask);

router.get("/tasks/search", auth, searchTask);

router.put ("/tasks/:id/promote", promoteTask);

router.get("/tasks/:id", auth, getTask);

router.put("/tasks/:id", auth, updateTask);

router.delete("/tasks/:id", auth, deleteTask);

export default router;
