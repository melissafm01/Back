// models/proyecto.js
const conn = require("../database/database");

class Proyecto {
  // Obtener todos los proyectos
  async obtenerProyectos() {
    const [rows] = await conn.query(`
      SELECT id_proyecto, nombre, apellido
      FROM proyecto
    `);
    return rows;
  }

  // Obtener un proyecto específico por su ID
  async obtenerProyectoPorId(id) {
    const [rows] = await conn.query(`
      SELECT id_proyecto, nombre, apellido
      FROM proyecto
      WHERE id_proyecto = ?
    `, [id]);
    return rows[0]; // Devolver solo el primer registro (debería ser único)
  }

  // Añadir un nuevo proyecto
  async adicionarProyecto(proyecto) {
    const { nombre, apellido } = proyecto;
    const [result] = await conn.query(`
      INSERT INTO proyecto (nombre, apellido)
      VALUES (?, ?)
    `, [nombre, apellido]);

    return { id: result.insertId, ...proyecto };
  }

  // Actualizar un proyecto existente
  async actualizarProyecto(id, proyecto) {
    const { nombre, apellido } = proyecto;
    const [result] = await conn.query(`
      UPDATE proyecto 
      SET nombre = ?, apellido = ?
      WHERE id_proyecto = ?
    `, [nombre, apellido, id]);

    return { id_proyecto: id, ...proyecto };
  }

  // Eliminar un proyecto
  async eliminarProyecto(id) {
    const [result] = await conn.query(`
      DELETE FROM proyecto 
      WHERE id_proyecto = ?
    `, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new Proyecto();
