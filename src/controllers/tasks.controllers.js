import mongoose from "mongoose";
import Task from "../models/task.model.js";
import {bucket}from "../config/firebase.js";
import { v4 as uuidv4} from "uuid";
import Notification from "../models/notification.model.js";
import Attendance from "../models/attendance.model.js";

// Obtener todas las tareas del usuario actual
export const getTasks = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "No autorizado" });

    const tasks = await Task.find({ user: req.user.id }).populate("user", "email _id");
    res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Crear una nueva tarea
export const createTask = async (req, res) => {
 
  try {
    const { title, description, place, date, responsible } = req.body;

    let imageUrl = null;

    // Verificamos si hay archivo (imagen)
    if (req.file) {
      const blob = bucket.file(`task-images/${Date.now()}_${req.file.originalname}`);

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Promesa para esperar que la imagen se suba
      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);

        blobStream.on('finish', async () => {
          await blob.makePublic(); // Si deseas que sea accesible públicamente
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve();
        });

        blobStream.end(req.file.buffer); // Envía el archivo a Firebase
      });
    }

    // Guarda la actividad en la base de datos (ejemplo con mongoose)

    const newTask = await Task.create({
      title,
      description,
      place,
      date,
      responsible,
      image: imageUrl, // Guarda la URL pública
      user: req.user.Id,
    });
    const populatedTask = await newTask.populate("user", "username email");
    res.status(201).json({ task: populatedTask });
  } catch (error) {
    console.error('Error al crear la actividad:', error);
    res.status(500).json({ message: 'Error al crear la actividad' });
  }
};

// Eliminar una tarea por ID
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "ID inválido" });

    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask)
      return res.status(404).json({ message: "Task not found" });

    //  Elimina las notificaciones asociadas
    await Notification.deleteMany({ task: id });
    console.log(`Notificaciones eliminadas para la actividad ${id}`);

    // Eliminar asistencias asociadas
    await Attendance.deleteMany({ task: id });
    console.log(`Asistencias eliminadas para la actividad ${id}`);

    return res.sendStatus(204); 
  } catch (error) {
    console.error("Error al eliminar la actividad:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar una tarea por ID
export const updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const { title, description, date, place, responsible, promocionada } = req.body;

    const updateData = {
      title,
      description,
      date,
      place,
      responsible,
      promocionada: !!promocionada,
      estado: promocionada ? "promocionada" : "todas",
    };

    const taskUpdated = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
    return res.json(taskUpdated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener actividades de otros usuarios
export const getOthersTasks = async (req, res) => {
  try {
    const activities = await Task.find({ user: { $ne: req.user.id } })
      .populate("user", "email _id")
      .select("-__v");

    res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
};

// Obtener una tarea por ID
export const getTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "ID inválido" });

    const task = await Task.findById(taskId)
      .populate("user", "email _id")
      .select("-__v");

    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    // Verificar si el usuario actual está registrado como asistente
    const existingAttendance = await Attendance.findOne({
      taskId: taskId,
      $or: [
        { userId: req.user.id },           // Usuario logueado
        { email: req.user.email }         
      ]
    });

    const response = task.toObject();
    response.isOwner = task.user._id.toString() === req.user.id;
    response.isUserAttending = !!existingAttendance;

    res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Promocionar una tarea
export const promoteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.estado = "promocionada";
    await task.save();

    res.json({ message: "Tarea promocionada", task });
  } catch (error) {
    console.error("Error al promocionar tarea:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Buscar tareas con filtros
export const searchTask = async (req, res) => {
  try {
    const { q, date, place, estado } = req.query;
    const filters = {};

    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (date) {
      const now = new Date();
      if (date === "pasadas") filters.date = { $lt: now };
      if (date === "proximas") filters.date = { $gt: now };
    }

    if (place) {
      filters.place = { $regex: place.trim(), $options: "i" };
    }

    if (estado === "promocionadas") {
      filters.$or = [
        { estado: "promocionada" },
        { promocionada: true },
        { isPromoted: true },
      ];
    }

    const tasks = await Task.find(filters)
      .populate("user", "username email")
      .populate("asistentes", "username");

    const formattedTasks = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      date: task.date,
      place: task.place,
      estado: task.estado,
      totalAsistentes: task.asistentes?.length || 0,
      user: {
        username: task.user?.username,
        email: task.user?.email,
      },
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error("Error al buscar tarea:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Activar o desactivar promoción
export const togglePromotion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const { isPromoted, promotion } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No tienes permiso para modificar esta actividad" });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        isPromoted,
        ...(promotion && { promotion }),
      },
      { new: true }
    );

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener tareas promocionadas
export const getPromotedTasks = async (req, res) => {
  try {
    const promotedTasks = await Task.find({ isPromoted: true })
      .populate("user", "email _id")
      .select("-__v");

    res.json(promotedTasks);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades promocionadas" });
  }
};

export const getPublicTasks = async (req, res) => {
  try {
    const publicTasks = await Task.findById(req.params.id)
      .populate("user","username")
      .select("title description place date estado image");
      if (!publicTasks) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }
      res.json({
        title: publicTasks.title,
        description: publicTasks.description,
        place: publicTasks.place,
        date: publicTasks.date,
        estado: publicTasks.estado,
        image: publicTasks.image || null,
        responsible: publicTasks.user?.username || "Desconocido",
      })
  }catch (error) {
    console.error("Error al obtener actividades públicas:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

