export const setupSocket = (io) => {
  // Mapa para rastrear usuarios conectados
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 Nuevo cliente conectado:", socket.id);

    // Evento para autenticar al usuario y unirlo a su sala
    socket.on("auth", (userId) => {
      if (userId) {
        // Guardar el userId en el socket
        socket.userId = userId;
        
        // Unir a la sala personal del usuario
        socket.join(userId.toString());
        
        // Agregar al mapa de usuarios conectados
        connectedUsers.set(userId.toString(), socket.id);
        
        console.log(`👤 Usuario ${userId} autenticado y unido a sala`);
        console.log(`📊 Salas del socket:`, Array.from(socket.rooms));
        
        // Verificar que la sala se creó correctamente
        const room = io.sockets.adapter.rooms.get(userId.toString());
        console.log(`🏠 Usuarios en sala ${userId}:`, room ? room.size : 0);
        
        // Confirmar autenticación exitosa
        socket.emit("auth-success", { 
          message: "Conectado correctamente", 
          userId: userId,
          socketId: socket.id,
          rooms: Array.from(socket.rooms)
        });
      } else {
        console.warn("⚠️ Intento de autenticación sin userId");
        socket.emit("auth-error", { message: "UserId requerido" });
      }
    });

    // Evento para desconexión
    socket.on("disconnect", () => {
      console.log("🔌 Cliente desconectado:", socket.id);
      
      // Remover del mapa si tenía userId
      if (socket.userId) {
        connectedUsers.delete(socket.userId.toString());
        console.log(`👤 Usuario ${socket.userId} removido del mapa`);
      }
    });

    // Evento para debug - información detallada
    socket.on("get-rooms", () => {
      const roomInfo = {
        socketId: socket.id,
        userId: socket.userId,
        rooms: Array.from(socket.rooms),
        connectedUsers: Array.from(connectedUsers.keys())
      };
      
      console.log("🔍 Información de debug:", roomInfo);
      socket.emit("rooms-info", roomInfo);
    });

    // Evento para pruebas de notificaciones
    socket.on("test-notification", (data) => {
      console.log("🧪 Prueba de notificación recibida:", data);
      
      // Enviar notificación de vuelta al mismo usuario
      const testNotification = {
        title: "🧪 Notificación de Prueba",
        message: "Esta es una prueba desde el servidor - ¡Socket funcionando!",
        type: "test",
        timestamp: new Date(),
        testData: data
      };
      
      socket.emit("notification", testNotification);
      console.log("✅ Notificación de prueba enviada de vuelta");
    });

    // Evento para verificar estado de conexión
    socket.on("ping", () => {
      socket.emit("pong", {
        socketId: socket.id,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  });

  // Función helper mejorada para enviar notificación a un usuario específico
  io.sendNotificationToUser = (userId, notification) => {
    const userRoom = userId.toString();
    
    console.log(`📤 Intentando enviar notificación a usuario ${userId}`);
    console.log(`🏠 Enviando a sala: ${userRoom}`);
    console.log(`📝 Contenido:`, notification);
    
    // Verificar si la sala existe y tiene clientes
    const room = io.sockets.adapter.rooms.get(userRoom);
    const clientCount = room ? room.size : 0;
    
    console.log(`👥 Clientes en sala ${userRoom}: ${clientCount}`);
    
    if (clientCount > 0) {
      io.to(userRoom).emit("notification", {
        ...notification,
        timestamp: new Date(),
        read: false
      });
      console.log(`✅ Notificación enviada a ${clientCount} cliente(s) en sala ${userRoom}`);
      return true;
    } else {
      console.log(`❌ No hay clientes conectados en sala ${userRoom}`);
      return false;
    }
  };

  // Función para obtener usuarios conectados
  io.getConnectedUsers = () => {
    const users = [];
    io.sockets.sockets.forEach((socket) => {
      if (socket.userId) {
        users.push({
          userId: socket.userId,
          socketId: socket.id,
          rooms: Array.from(socket.rooms)
        });
      }
    });
    return users;
  };

  // Función para debug
  io.debugRooms = () => {
    console.log("🔍 === DEBUG DE SALAS ===");
    console.log("Todas las salas:", Array.from(io.sockets.adapter.rooms.keys()));
    
    io.sockets.adapter.rooms.forEach((sockets, room) => {
      console.log(`Sala ${room}: ${sockets.size} sockets`);
    });
    
    console.log("Usuarios conectados:", io.getConnectedUsers());
    console.log("=========================");
  };

  console.log("🔌 Socket.IO configurado correctamente con debug mejorado");
};
