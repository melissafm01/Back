import Attendance from '../models/attendance.model.js';
import mongoose from 'mongoose';


// confirmar asistencia a una actividad

export const confirmAttendance = async (req, res) => {
    try {
        const { taskId } = req.body;

        // Verificar que se envíe taskId
        if (!taskId) {
            return res.status(400).json({ message: "taskId es requerido" });
        }

        // Si está autenticado, tomamos los datos del usuario
        let attendanceData = {
            task: taskId,
            confirmed: true,
        };

        if (req.user) {
            attendanceData.user = req.user.id;
            attendanceData.name = req.user.name;
            attendanceData.email = req.user.email;

            // Verifica que no haya duplicados
            const existing = await Attendance.findOne({
                user: req.user.id,
                task: taskId,
            });
            if (existing) {
                return res
                    .status(400)
                    .json({ message: "Ya confirmaste asistencia a esta tarea" });
            }
        } else {
            // Si no hay sesión, se espera name y email en el body
            const { name, email } = req.body;
            if (!name || !email) {
                return res.status(400).json({
                    message: "Nombre y correo son requeridos para invitados",
                });
            }

            attendanceData.name = name;
            attendanceData.email = email;

            // Verifica duplicados por email + tarea
            const existing = await Attendance.findOne({
                email,
                task: taskId,
                user: { $exists: false },    
            });
            if (existing) {
                return res
                    .status(400)
                    .json({ message: "Este correo ya confirmó asistencia a esta tarea" });
            }
        }

        // Crear la asistencia
        const attendance = await Attendance.create(attendanceData);
        return res
            .status(201)
            .json({ message: "Asistencia confirmada correctamente", attendance });
    } catch (error) {
        return res.status(500).json({
            message: "Error al registrar asistencia",
            error: error.message,
        });
    }
};

//cancelar asistencia a una actividad


export const cancelAttendance = async (req, res) => {
  const { taskId, email } = req.body;
  const userId = req.user?.id;

  // Validar el ID
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "ID de actividad inválido" });
  }

  try {
    let result = null;

    if (email) {
      result = await Attendance.findOneAndDelete({ email, task: taskId });
    } else if (userId) {
      result = await Attendance.findOneAndDelete({ user: userId, task: taskId });
    } else {
      return res.status(400).json({ message: "Faltan datos para cancelar asistencia" });
    }

    if (!result) {
      return res.status(404).json({ message: "No se encontró la asistencia" });
    }

    res.json({ message: "Asistencia cancelada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al cancelar asistencia", error: error.message });
  }
};


//obtener asistencia a una actividad (creador o admin)
export const getAttendance = async (req, res) => {
    const { taskId } = req.params;

    try {
        const antendees = await Attendance.find({ task: taskId });
        res.json(antendees);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener asistencia", error: error.message });
    }
};

//editar asistente (nombre, email)

export const updateAttendance = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    try {
        const updated = await Attendance.findByIdAndUpdate(id, { name, email }, { new: true });
        if (!updated) return res.status(404).json({ message: "No se encontró la asistencia" });

        res.json({ message: "Asistencia actualizada correctamente", updated });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar asistencia", error: error.message });
    }
}

//Elimanr asistente 
export const deleteAttendance = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Attendance.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Asistente no encontrado" });

        res.json({ message: "Asistente eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar asistente", error: error.message });
    }
};//