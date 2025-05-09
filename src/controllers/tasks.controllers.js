import Task from "../models/task.model.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user : req.user.id }).populate("user");
    res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, date, place, responsible } = req.body;
    const newTask = new Task({
      title,
      description,
      date,
      place,
      responsible,
      user: req.user.id,
    });
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask)
      return res.status(404).json({ message: "Task not found" });

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, date , place, responsible} = req.body;
    const taskUpdated = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { title, description, date, place, responsible },
      { new: true }
    );
    return res.json(taskUpdated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Controlador para obtener actividades de otros usuarios
export const getOthersTasks = async (req, res) => {
  try {
    const activities = await Task.find({ 
      user: { $ne: req.user.id } // Filtra por usuarios diferentes al actual
    })
    .populate("user", "email _id") // Trae solo el email del usuario creador
    .select("-__v"); // Excluye campo __v

    res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("user", "email _id") // Muestra email del creador
      .select("-__v");

    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });
    
    // Agregar propiedad 'isOwner' para uso en frontend
    const response = task.toObject();
    response.isOwner = task.user._id.toString() === req.user.id;
    
    res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};