import 'dotenv/config';
import app from "./app.js";
import { PORT, FRONTEND_URL } from "./config.js";
import { connectDB } from "./db.js";  
import { startNotificationCron, runNotificationCheckManually } from './notification.cron.js'; // Agregado runNotificationCheckManually
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './libs/socket.js';

async function main() {
  try {
    await connectDB();
    console.log("✅ Base de datos conectada");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      },
    });

    // Configurar socket
    setupSocket(io);
    console.log("✅ Socket.IO configurado");

    // Guardar io en app para uso en rutas
    app.set('socketio', io);

    // Iniciar cron de notificaciones
    startNotificationCron(io);
    console.log("✅ Cron de notificaciones iniciado");

    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📡 Entorno: ${process.env.NODE_ENV}`);
      
      // PARA PRUEBAS: Ejecutar verificación manual después de 10 segundos
      setTimeout(() => {
        console.log("🧪 === EJECUTANDO PRUEBA MANUAL DE NOTIFICACIONES ===");
        runNotificationCheckManually(io);
      }, 10000);
    });

  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error);
  }
}

main();