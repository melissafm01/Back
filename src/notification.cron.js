import cron from 'node-cron';
import Notification from './models/notification.model.js';
import Task from './models/task.model.js';
import User from './models/user.model.js';
import dayjs from 'dayjs';
import { sendEmail } from './libs/sendEmail.js';
import { sendPushNotification } from './libs/sendPushNotification.js';
import Attendance from './models/attendance.model.js';


export const runNotificationCheck = async (io) => {
  console.log("🔔 ===============================================");
  console.log("🔔 INICIANDO VERIFICACIÓN DE NOTIFICACIONES");
  console.log("🔔 ===============================================");
  
  const now = dayjs();
  console.log(`⏰ Fecha y hora actual: ${now.format('YYYY-MM-DD HH:mm:ss')}`);

  try {
    // 1. Obtener todas las configuraciones de notificaciones
    console.log("📋 Buscando configuraciones de notificaciones...");
    const notifications = await Notification.find({})
      .populate("task")
      .populate("user");

    console.log(`📊 Total de configuraciones encontradas: ${notifications.length}`);

    if (notifications.length === 0) {
      console.log("⚠️ No se encontraron configuraciones de notificaciones");
      return;
    }

    // 2. Procesar cada configuración
    for (let i = 0; i < notifications.length; i++) {
      const config = notifications[i];
      console.log(`\n--- PROCESANDO CONFIGURACIÓN ${i + 1}/${notifications.length} ---`);
      console.log(`ID de configuración: ${config._id}`);

      const { task, user, daysBefore, type = "recordatorio" } = config;

      // 3. Validaciones básicas
      if (!task) {
        console.warn(`❌ Configuración ${config._id}: No tiene tarea asociada`);
        continue;
      }
      if (!user) {
        console.warn(`❌ Configuración ${config._id}: No tiene usuario asociado`);
        continue;
      }
      if (!task.date) {
        console.warn(`❌ Configuración ${config._id}: La tarea no tiene fecha`);
        continue;
      }

      console.log(`👤 Usuario: ${user.username} (${user.email})`);
      console.log(`📝 Tarea: "${task.title}"`);
      console.log(`📅 Fecha de la tarea: ${dayjs(task.date).format('YYYY-MM-DD HH:mm')}`);
      console.log(`⏳ Días de anticipación: ${daysBefore}`);
      console.log(`🏷️ Tipo: ${type}`);

      // 4. Verificar si el usuario aún está registrado como asistente
     console.log(`🔍 Verificando asistencia del usuario...`);
      const stillAttending = await Attendance.findOne({ 
        task: task._id, 
        $or:[
          {user: user._id},
          {email: user.email?.toLowerCase()}, 
        ]
      });
      
      if (!stillAttending) {
        console.log(`⚠️ Usuario ${user.username} ya no es asistente de "${task.title}"`);
        continue;
      }
      console.log(`✅ Usuario confirmado como asistente`);

      // 5. Calcular fechas
      const taskDate = dayjs(task.date);
      const notifyDate = taskDate.subtract(daysBefore, 'day').startOf('day');
      const today = now.startOf('day');

      console.log(`📊 CÁLCULO DE FECHAS:`);
      console.log(`   - Fecha de la tarea: ${taskDate.format('YYYY-MM-DD')}`);
      console.log(`   - Fecha de notificación: ${notifyDate.format('YYYY-MM-DD')}`);
      console.log(`   - Fecha actual: ${today.format('YYYY-MM-DD')}`);
      console.log(`   - ¿Es hoy el día de notificar?: ${notifyDate.isSame(today, 'day') ? '✅ SÍ' : '❌ NO'}`);

      // 6. Si es el día de notificar, enviar notificaciones
      if (notifyDate.isSame(today, 'day')) {
        console.log(`🚨 ¡ES HORA DE NOTIFICAR!`);

        let subject, text;
        if (type === "confirmación") {
          subject = `¿Confirmas tu participación en: ${task.title}?`;
          text = `Hola ${user.username}, por favor confirma si asistirás a "${task.title}" el ${taskDate.format('DD/MM/YYYY')}.`;
        } else {
          subject = `Recordatorio: ${task.title}`;
          text = `Hola ${user.username}, recuerda que tienes una actividad "${task.title}" el ${taskDate.format('DD/MM/YYYY')}.`;
        }

        console.log(`📧 ENVIANDO NOTIFICACIONES:`);
        console.log(`   - Asunto: ${subject}`);
        console.log(`   - Mensaje: ${text}`);

        // 7. Enviar correo electrónico
        console.log(`📬 Enviando correo electrónico...`);
        try {
          await sendEmail({
            to: user.email,
            subject,
            text
          });
          console.log(`✅ Correo enviado exitosamente a ${user.email}`);
        } catch (error) {
          console.error(`❌ Error al enviar correo a ${user.email}:`, error.message);
        }

        // 8. Enviar notificación push
        if (user.fcmToken) {
          console.log(`📱 Enviando notificación push...`);
          try {
            await sendPushNotification(user.fcmToken, {
              title: subject,
              body: text
            });
            console.log(`✅ Notificación push enviada a ${user.username}`);
          } catch (pushErr) {
            console.error(`❌ Error al enviar push a ${user.username}:`, pushErr.message);
          }
        } else {
          console.log(`⚠️ Usuario ${user.username} no tiene FCM token`);
        }

        // 9. Enviar notificación en tiempo real via socket
         if (io) {
          console.log(`🔌 Enviando notificación en tiempo real...`);
          try {
            const notification = {
              title: subject,
              message: text,
              taskId: task._id,
              type: type || "recordatorio",
              timestamp: new Date(),
              read: false,
              userId: user._id // Agregar userId para debug
            };

            // Debug: verificar salas antes de enviar
            console.log(`🔍 DEBUG ANTES DE ENVIAR:`);
            io.debugRooms();

            // Enviar usando la función helper
            const sent = io.sendNotificationToUser(user._id, notification);
            
            if (sent) {
              console.log(`✅ Notificación socket enviada exitosamente a ${user.username}`);
            } else {
              console.log(`❌ No se pudo enviar notificación socket a ${user.username} - Usuario no conectado`);
            }
            
          } catch (socketErr) {
            console.error(`❌ Error al enviar notificación socket:`, socketErr.message);
            console.error(`Stack:`, socketErr.stack);
          }
        } else {
          console.log(`⚠️ Socket.IO no está disponible`);
        }
      } else {
        console.log(`⏭️ No es el día de notificar, continuando...`);
      }
    }

    console.log(`\n🔔 ===============================================`);
    console.log(`🔔 VERIFICACIÓN COMPLETADA`);
    console.log(`🔔 ===============================================`);

  } catch (error) {
    console.error("❌ ERROR CRÍTICO en el cron de notificaciones:");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
  }
};

export const startNotificationCron = (io) => {
  console.log("🕐 Configurando cron de notificaciones...");
  
  // Para pruebas: ejecutar cada minuto
 
  const cronPattern = "* 7 * * *"; // Cada minuto para pruebas
  
  cron.schedule(cronPattern, () => {
    console.log(`\n⏰ CRON ACTIVADO: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    runNotificationCheck(io);
  });
  
  console.log(`✅ Cron configurado con patrón: ${cronPattern}`);
  console.log("📝 Nota: Configurado para ejecutarse cada minuto (para pruebas)");
};

// Función para ejecutar manualmente
export const runNotificationCheckManually = (io) => {
  console.log("🔧 ==========================================");
  console.log("🔧 EJECUCIÓN MANUAL DE VERIFICACIÓN");
  console.log("🔧 ==========================================");
  return runNotificationCheck(io);
};