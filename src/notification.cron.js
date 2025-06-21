import cron from 'node-cron';
import Notification from './models/notification.model.js';
import Task from './models/task.model.js';
import User from './models/user.model.js';
import dayjs from 'dayjs';
import { sendEmail } from './libs/sendEmail.js';
import { sendPushNotification } from './libs/sendPushNotification.js';
import Attendance from './models/attendance.model.js';

export const runNotificationCheck = async (io) => {
  const now = dayjs();
 
  try {
    const notifications = await Notification.find({})
      .populate("task")
      .populate("user");

     for (const config of notifications) {
  const { task, user, daysBefore, type } = config;

  // Validaciones básicas
  if (!task || !user || !task.date) {
    console.warn(`Notificación inválida: Falta tarea o usuario en ${config._id}`);
    continue;
  }

  // Verifica si el usuario aún está registrado como asistente
  const stillAttending = await Attendance.findOne({ task: task._id, user: user._id });
  if (!stillAttending) {
    console.log(`Usuario ${user._id} ya no es asistente de "${task.title}", omitiendo notificación`);
    continue;
  }

  const notifyDate = dayjs(task.date).subtract(daysBefore, 'day').startOf('day');

  if (notifyDate.isSame(now, 'day')) {
    let subject, text;

    if (type === "confirmación") {
      subject = `¿Confirmas tu participación en: ${task.title}?`;
      text = `Hola ${user.username}, por favor confirma si asistirás a "${task.title}" el ${dayjs(task.date).format('DD/MM/YYYY')}.`;
    } else {
      subject = `Recordatorio: ${task.title}`;
      text = `Hola ${user.username}, recuerda que tienes una actividad "${task.title}" el ${dayjs(task.date).format('DD/MM/YYYY')}.`;
    }

    try {
      await sendEmail({ to: user.email, subject, text });
      console.log(`Correo de tipo "${type}" enviado a ${user.email}`);
    } catch (error) {
      console.error(`Error al enviar correo a ${user.email}:`, error.message);
    }

    if (user.fcmToken) {
      try {
        await sendPushNotification(user.fcmToken, { title: subject, body: text });
        console.log(`Notificación push enviada a ${user.username}`);
      } catch (pushErr) {
        console.error(`Error al enviar push a ${user.username}:`, pushErr.message);
      }
    }
    if (io && type === "recordatorio") {
      io.to(user._id.toString()).emit("notification", {
        title: subject,
        message: text,
        taskId: task._id,
        type: "recordatorio", // Tipo de notificación
      });
      console.log(`Notificación enviada en tiempo real a ${user.username}`);
    }
  }
}

  } catch (error) {
    console.error("Error al ejecutar el cron de notificaciones:", error.message);
  }
};

export const startNotificationCron = (io) => {
  cron.schedule("0 1 * * *", () => runNotificationCheck(io)); // Cada día a la 1am
  console.log("Cron de notificaciones iniciado");

};
