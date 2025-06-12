import { Router } from "express";
import { saveNotificationConfig, getUserNotifications, deleteNotification} from "../controllers/notification.controller.js";
import {auth} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/notifications", auth, saveNotificationConfig);
router.get("/notifications", auth, getUserNotifications);
router.delete("/notifications/:id", auth, deleteNotification);
export default router;