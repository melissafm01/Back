import Attendance from '../models/attendance.model.js';
import Task from '../models/task.model.js';
import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';
// Confirmar asistencia a una actividad
export const confirmAttendance = async (req, res) => {
  try {
    const { taskId, name, email } = req.body;
    if (!taskId) return res.status(400).json({ message: "taskId es requerido" });
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });
    const isAuthenticated = !!req.user;
    const isCreator = isAuthenticated && task.user.toString() === req.user.id;
    const isManual = nombreInvitado && correoInvitado;

    let attendanceData = { task: taskId };

    //  FLUJO: Usuario autenticado invitando a otro
    if (isAuthenticated && isManual) {
      attendanceData.name = nombreInvitado;
      attendanceData.email = correoInvitado.toLowerCase();
      // Verifica si ya hay un asistente con ese correo en la DB
      const already = await Attendance.findOne({ task: taskId, email: attendanceData.email });
      if (already) return res.status(400).json({ message: "Este invitado ya está registrado" });

      // Agregar también al arreglo de la tarea (si quieres mantenerlo sincronizado)
      task.asistentes.push({ name: nombreInvitado, email: correoInvitado });
      await task.save();

    //  FLUJO: Usuario autenticado no es el creador
    } else if (isAuthenticated && !isCreator) {
      const userId = req.user.id;

      const yaRegistrado = await Attendance.findOne({ task: taskId, user: userId });
      if (yaRegistrado) return res.status(400).json({ message: "Ya estás registrado para esta actividad" });

      attendanceData.user = userId;
      attendanceData.name = req.user.name || name;
      attendanceData.email = req.user.email || email;

      // También agregamos a `asistentes` del task
      task.asistentes.push({ user: userId });
      await task.save();

    //  FLUJO: Invitado no autenticado
    } else if (!isAuthenticated) {
      if (!name || !email) return res.status(400).json({ message: "Nombre y correo requeridos para invitados" });
      const correo = email.toLowerCase();

      const yaInvitado = await Attendance.findOne({ task: taskId, email: correo });
      if (yaInvitado) return res.status(400).json({ message: "Ya estás registrado para esta actividad" });

      attendanceData.name = name;
      attendanceData.email = correo;

      task.asistentes.push({ name, email: correo });
      await task.save();

    //  Creador no puede registrarse a su propia actividad
    } else {
      return res.status(403).json({ message: "No puedes confirmar asistencia a tu propia actividad" });
    }

    // Verificamos si ya existe una asistencia similar
const existing = await Attendance.findOne({
  task: taskId,
  $or: [
    // Si es usuario autenticado, verificar por user.id
    ...(attendanceData.user ? [{ user: attendanceData.user }] : []),
    // Si es invitado o registro manual, verificar por email exacto
    ...(attendanceData.email ? [{ email: attendanceData.email.toLowerCase() }] : [])
  ]
});

    if (existing) return res.status(400).json({ message: "Ya estás registrado para esta actividad" });

    const newAttendance = await Attendance.create(attendanceData);
    if(req.user)
    await Notification.create({
    user: req.user.id,
    task: taskId,
    daysBefore: 0,
    type: 'confirmación' // Por ejemplo, notificar un día antes
  })
    return res.status(201).json({ message: "Asistencia confirmada", attendance: newAttendance });
    
  } catch (error) {
    console.error("Error al confirmar asistencia:", error);
    res.status(500).json({ message: "Error al confirmar asistencia" });
  }
  
};


// Cancelar asistencia
export const cancelAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "ID inválido" });

    const criteria = req.user?.id
      ? { task: taskId, user: req.user.id }
      : { task: taskId, email: req.body.email?.toLowerCase() };

    const deleted = await Attendance.findOneAndDelete(criteria);
    if (!deleted) return res.status(404).json({ message: "Asistencia no encontrada" });

    // Eliminar notificación asociada si existe
    if (req.user?.id) {
      await Notification.deleteOne({ user: req.user.id, task: taskId });
      console.log("Notificación eliminada automáticamente al cancelar asistencia");
    }

    res.json({ message: "Asistencia cancelada" });

  } catch (error) {
    console.error("Error al cancelar asistencia:", error);
    res.status(500).json({ message: "Error al cancelar asistencia" });
  }
};


// Obtener todos los asistentes de una actividad
export const getAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log("taskId:", taskId);
    console.log("user in token:",req.user)

    const task = await Task.findById(taskId);
    if (!task){
      console.log("Actividad no encontrada")
       return res.status(404).json({ message: "Actividad no encontrada" });
    }
   console.log("Actividad encontrada:", task)
    if (!task.user || task.user.toString() !== req.user.id){
      console.log("Usuario no autorizado: task.user:", task.user.toString(), "req.user.id:", req.user.id);
      return res.status(403).json({ message: "No autorizado" });
    }
    const attendees = await Attendance.find({ task: taskId }).select("-__v");
    res.json(attendees);
  } catch (error) {
    console.error("Error al obtener asistentes:", error);
    res.status(500).json({ message: "Error al obtener asistentes" });
  }
};

// Actualizar asistente manual
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) return res.status(404).json({ message: "Asistente no encontrado" });

    const task = await Task.findById(attendance.task);
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    attendance.name = name || attendance.name;
    attendance.email = email?.toLowerCase() || attendance.email;

    await attendance.save();
    res.json({ message: "Asistente actualizado", attendance });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar asistente" });
  }
};

// Eliminar asistente manual
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) return res.status(404).json({ message: "Asistente no encontrado" });

    const task = await Task.findById(attendance.task);
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    await attendance.deleteOne();
    res.json({ message: "Asistente eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar asistente" });
  }
};

// Exportar lista de asistencia (JSON o CSV básico)
export const exportAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    const attendees = await Attendance.find({ task: taskId }).select("name email createdAt");

    const csv = attendees
      .map(a => `${a.name},${a.email},${a.createdAt.toISOString()}`)
      .join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`asistentes_${taskId}.csv`);
    return res.send(`Nombre,Correo,RegistradoEn\n${csv}`);
  } catch (error) {
    res.status(500).json({ message: "Error al exportar lista de asistencia" });
  }

};


// Verificar si un usuario ya está registrado para una actividad específica
export const checkAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { email } = req.query; // Recibir email como query parameter

    if (!taskId) {
      return res.status(400).json({ message: "taskId es requerido" });
    }

    // Construir criterio de búsqueda
    let criteria = { task: taskId };
    
    if (req.user?.id) {
      // Usuario autenticado: buscar por user ID o email
      criteria = {
        task: taskId,
        $or: [
          { user: req.user.id },
          { email: req.user.email?.toLowerCase() }
        ]
      };
    } else if (email) {
      // Usuario no autenticado: buscar solo por email
      criteria.email = email.toLowerCase();
    } else {
      return res.status(400).json({ 
        message: "Email requerido para usuarios no autenticados" 
      });
    }

    const attendance = await Attendance.findOne(criteria);
    
    res.json({ 
      isAttending: !!attendance,
      attendance: attendance || null
    });
  } catch (error) {
    console.error("Error al verificar asistencia:", error);
    res.status(500).json({ message: "Error al verificar asistencia" });
  }
};



export const getUserAttendances = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const criteria = {
      $or: [
        { user: userId },
        { email: req.user.email?.toLowerCase() }
      ]
    };

    console.log('[DEBUG] Criterio de búsqueda:', JSON.stringify(criteria));

    // 4. Búsqueda con validación de referencias
    const attendances = await Attendance.find(criteria)
      .populate({
        path: 'task',
        select: 'title date',
        match: { _id: { $exists: true } } // Filtra tareas existentes
      })
      .lean();

    // 5. Filtrado de resultados inconsistentes
    const validAttendances = attendances.filter(att => 
      att.task !== null && 
      (att.user?.toString() === req.user.id || att.email === req.user.email?.toLowerCase())
    );

    res.json(validAttendances);
  } catch (error) {
    res.status(500).json({ 
      message: "Error al obtener asistencias",
      error: error.message
    });
  }
};