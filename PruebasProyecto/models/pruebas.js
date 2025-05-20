const conn = require('../database/database');

class Pruebas{
    async listarNombres(){
       const [rows] = await conn.query('SELECT id_pruebas, fecha_final FROM Pruebas');
       return rows[0]

    }
}

module.exports = new Pruebas;