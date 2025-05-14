// routes/proyectoRoutes.js
const express = require("express");
const proyectoController = require("../controllers/proyectoController");

const router = express.Router();

// Ruta para obtener todos los proyectos
router.get("/", proyectoController.obtenerProyectos);

// Ruta para obtener un proyecto por su ID
router.get("/:id", proyectoController.obtenerProyectoPorId);

// Ruta para adicionar un nuevo proyecto
router.post("/", proyectoController.adicionarProyecto);

// Ruta para actualizar un proyecto existente
router.put("/:id", proyectoController.actualizarProyecto);

// Ruta para eliminar un proyecto
router.delete("/:id", proyectoController.eliminarProyecto);

module.exports = router;
