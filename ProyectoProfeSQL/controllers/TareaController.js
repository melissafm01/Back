let TareaService = require("../services/TareaService");
class TareaController{
 async   obtenerTareas(req, res) {
        try {
            let tareaService = new TareaService();
            let tareas=await tareaService.obtenerTareas();
            res.json(tareas);
        } catch (e) {
            res.json({e: "errrorrrrr"})
        }
    }
}

module.exports = new TareaController;