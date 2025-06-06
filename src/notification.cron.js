import cron from 'node-cron';
import Notification from './models/notification.model.js';
import Task from './models/task.model.js';
import User from './models/user.model.js';
import dayjs from 'dayjs';

const runNotificationCheck = async () => {
    const now = dayjs();

    const notifications = await Notification.find({}).populate("task").populate("user");

    for (const config of notifications) {
        const { task, user, daysBefore } = config;

        // Verifica que task y user existan
        if (!task || !user || !task.date) {
            console.warn(` Notificación inválida: Falta tarea o usuario en ${config._id}`);
            continue; // Saltamos esta notificación rota
        }

        const notifyDate = dayjs(task.date).subtract(daysBefore, 'day').startOf('day');

        if (notifyDate.isSame(now, 'day')) {
            console.log(` Notificando a ${user.email || user._id} sobre la actividad ${task.title}`);
        }
    }
};


export const startNotificationCron = () => {
    cron.schedule("0 8 * * *", runNotificationCheck);
    console.log("Cron de notificaciones iniciado");
};