const express = require('express');
const Tareacontroller = require("../controllers/TareaController");
const router = express.Router();

router.get("/tareas", Tareacontroller.obtenerTareas);

module.exports = router;