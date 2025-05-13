import Task from "../models/task.model.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user : req.user.id }).populate("user", "email _id");
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
    const { title, description, date , place, responsible, promocionada} = req.body;
    const updateData ={
      title,
      description,
      date,
      place,
      responsible,
      promocionada: !!promocionada, // Convierte a booleano
      estado: promocionada ? "promocionada" : "todas", // Cambiar el estado según la promoción
    };
    const taskUpdated = await Task.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
     { new: true} // Devuelve el documento actualizado}
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

//Buscar y filtrar 


export const promoteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.estado = "promocionada"; // Cambia el estado a "promocionada"
    await task.save(); // Guarda los cambios en la base de datos

    res.json({ message: "tarea promocionada encontrada", task })
}catch (error){
  console.error("Error al promocionar tarea:", error.message);
  res.status(500).json({ message: "Error interno del servidor" });
}
};


export const searchTask = async (req, res) => {
  try {
    const { q, date, place, estado } = req.query;
    const filters = {};
    
    //busqueda por texto en titulo o descripcion
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
     //busqueda por fecha exacta
    if (date) {
      const now = new Date();
      if (date === "pasadas"){
        filters.date = { $lt: now };
      }else if (date === "proximas"){
        filters.date = { $gt: now };
      }
    }
    
    //busqueda por lugar
    if (place){
       filters.place = { $regex: place.trim(), $options: "i" };
    }
    //busqueda por estado
    if (estado === "promocionadas"){
     filters.estado = "promocionada";
   }

    console.log("Filtros construidos:", JSON.stringify(filters, null, 2));

    const tasks = await Task.find(filters)
      .populate("user", "username email")
      .populate("asistentes", "username");

    console.log("Resultados encontrados:", tasks.length);
   // console.log("Títulos:", tasks.map(t => t.title));

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


// promociónar

// Activar/desactivar promoción
export const togglePromotion = async (req, res) => {
  try {
    const { isPromoted, promotion } = req.body;

    // Verificar que el usuario sea dueño de la actividad
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: "Actividad no encontrada" });
    if (task.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta actividad" });
    // Actualizar el estado de promoción
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

// Obtener actividades promocionadas
export const getPromotedTasks = async (req, res) => {
  try {
    const promotedTasks = await Task.find({
      isPromoted: true,
    })
      .populate("user", "email _id")
      .select("-__v");

    res.json(promotedTasks);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al obtener actividades promocionadas" });
  }
};



