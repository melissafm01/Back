import 'dotenv/config'; // Carga las variables de entorno 
import app from "./app.js";
import { PORT, FRONTEND_URL } from "./config.js";
import { connectDB } from "./db.js";  
import { startNotificationCron } from './notification.cron.js';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './libs/socket.js';

async function main() {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: FRONTEND_URL,
        credentials: true,
      },
    });

    setupSocket(io); // Configura eventos de conexión
    startNotificationCron(io); // Ojo: pásale io si quieres emitir desde el cron

    server.listen(PORT, () => {
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
      console.log(` Entorno: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    console.error(" Error al iniciar servidor:", error);
  }
}

main();
