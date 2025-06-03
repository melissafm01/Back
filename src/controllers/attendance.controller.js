import Attendance from '../models/attendance.model.js';
import Task from '../models/task.model.js';
import mongoose from 'mongoose';

// Confirmar asistencia a una actividad (solo usuarios autenticados)
export const confirmAttendance = async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) return res.status(400).json({ message: "taskId es requerido" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    const userId = req.user.id;

    // Evitar que el creador confirme asistencia
    if (task.user.toString() === userId)
      return res.status(403).json({ message: "No puedes confirmar asistencia a tu propia actividad" });

    // Verificar si ya está registrado
    const yaRegistrado = await Attendance.findOne({ task: taskId, user: userId });
    if (yaRegistrado)
      return res.status(400).json({ message: "Ya estás registrado para esta actividad" });

    // Registrar la asistencia
    const attendanceData = {
      task: taskId,
      user: userId,
      confirmed: true
    };

    const newAttendance = await Attendance.create(attendanceData);

    // Opcional: guardar referencia en el array asistentes de la tarea
    task.asistentes.push({ user: userId });
    await task.save();

    return res.status(201).json({ message: "Asistencia confirmada", attendance: newAttendance });
  } catch (error) {
    console.error("Error al confirmar asistencia:", error);
    res.status(500).json({ message: "Error al confirmar asistencia" });
  }
};

// Cancelar asistencia (solo usuarios autenticados)
export const cancelAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "ID inválido" });

    const deleted = await Attendance.findOneAndDelete({ task: taskId, user: req.user.id });

    if (!deleted)
      return res.status(404).json({ message: "Asistencia no encontrada" });

    res.json({ message: "Asistencia cancelada" });
  } catch (error) {
    console.error("Error al cancelar asistencia:", error);
    res.status(500).json({ message: "Error al cancelar asistencia" });
  }
};

// Obtener todos los asistentes (solo el creador puede ver)
export const getAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    const attendees = await Attendance.find({ task: taskId }).populate("user", "name email").select("-__v");
    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener asistentes" });
  }
};

// Exportar lista de asistencia
export const exportAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    const attendees = await Attendance.find({ task: taskId })
      .populate("user", "name email")
      .select("user createdAt");

    const csv = attendees
      .map(a => `${a.user.name},${a.user.email},${a.createdAt.toISOString()}`)
      .join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`asistentes_${taskId}.csv`);
    return res.send(`Nombre,Correo,RegistradoEn\n${csv}`);
  } catch (error) {
    res.status(500).json({ message: "Error al exportar lista de asistencia" });
  }
};
