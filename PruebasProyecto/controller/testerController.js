const Tester = require('../models/tester');


exports.obtenerPruebasPorTester = async (req, res) =>{
    try{
        const  resultado  = await Tester.obtenerPruebasPorTester();
        res.json(resultado); 
    } catch(error){
        console.error("Error al obtener pruebas por tester:", error);
        res.status(500).json({ error: "Error al obtener pruebas por tester" });
    }
};
