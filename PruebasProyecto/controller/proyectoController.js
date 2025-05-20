// controllers/proyectoController.js
const Proyecto = require("../models/proyecto");

exports.obtenerProyectos = async (req, res) => {
  try {
    const proyectos = await Proyecto.obtenerProyectos();
    res.json(proyectos);
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({ error: "Error al obtener proyectos" });
  }
};

exports.obtenerProyectoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const proyecto = await Proyecto.obtenerProyectoPorId(id);
    if (!proyecto) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json(proyecto);
  } catch (error) {
    console.error("Error al obtener proyecto por id:", error);
    res.status(500).json({ error: "Error al obtener proyecto" });
  }
};

exports.adicionarProyecto = async (req, res) => {
  try {
    const proyecto = req.body;
    const nuevoProyecto = await Proyecto.adicionarProyecto(proyecto);
    res.status(201).json(nuevoProyecto);
  } catch (error) {
    console.error("Error al añadir proyecto:", error);
    res.status(500).json({ error: "Error al añadir proyecto" });
  }
};

exports.actualizarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const proyecto = req.body;
    const proyectoActualizado = await Proyecto.actualizarProyecto(id, proyecto);
    res.json(proyectoActualizado);
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    res.status(500).json({ error: "Error al actualizar proyecto" });
  }
};

exports.eliminarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const proyectoEliminado = await Proyecto.eliminarProyecto(id);
    if (!proyectoEliminado) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    res.status(500).json({ error: "Error al eliminar proyecto" });
  }
};
