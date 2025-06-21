export const setupSocket = (io) => {
    io.on( "connection", (socket) => {console.log("Nuevo cliente conectado:", socket.id);
        socket.on("auth", (userId) => {
            socket.join(userId);
        });
        socket.on("disconnect", () => {
            console.log("Cliente desconectado:", socket.id);
        });
    })
}