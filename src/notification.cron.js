import cron from 'node-cron';
import Notification from './models/notification.model.js';
import Task from './models/task.model.js';
import User from './models/user.model.js';
import dayjs from 'dayjs';
import { sendEmail } from './libs/sendEmail.js';
import { sendPushNotification } from './libs/sendPushNotification.js';

const runNotificationCheck = async () => {
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

      if (!user.email) {
        console.warn(`Usuario ${user._id} no tiene correo electrónico. Notificación omitida.`);
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

        //  para enviar notificación push cuando se desee
        // if (user.fcmToken) {
        //   await sendPushNotification(user.fcmToken, { title: subject, body: text });
        // }
      }
    }
  } catch (error) {
    console.error("Error al ejecutar el cron de notificaciones:", error.message);
  }
};

export const startNotificationCron = () => {
  cron.schedule("* * * * *", runNotificationCheck); // Cada minuto por ahora (puedes cambiar a '0 8 * * *' para 8am diaria)
  console.log("Cron de notificaciones iniciado");
};
