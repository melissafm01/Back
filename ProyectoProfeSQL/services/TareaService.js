let Tarea = require('../models/TareaModel');
class TareaService { 
    async obtener() {
        try {
            let tarea = await Tarea.findAll();
            return tarea;
        } catch (e) {
            console.log("error");
        }
    }
}

module.exports = TareaService;