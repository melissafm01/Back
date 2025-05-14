const Pruebas = require ('../models/pruebas');

const pruebasInstancia = new Pruebas();

exports.obtenerPruebas = async (req, res) =>{
    try {
        const resultado = await pruebas.obtenerPruebas();
        res.json(resultado);

    } catch(error){
        console.error("Error al listar pruebas", error);
        res.status(500).json({error: "error al obtener las pruebas" })
    }
};

exports.contarPruebas = async (req, res) =>{
    try {
        const total = await pruebasInstancia.contartotal();
        res.json(total);
    } catch (error) {
        console.error("Error al contar pruebas", error);
        res.status(500).json({error: "error al contar las pruebas" })
    }
}