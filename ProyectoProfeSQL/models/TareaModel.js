let  DataTypes  = require('sequelize');
let sequelize = require('../config/db');


let Tarea = sequelize.define('Tarea', {
    titulo: {
        type:DataTypes.STRING,
        allowNull:false
    },
    descripcion: {
        type:DataTypes.STRING,
        allowNull:false
    },
},{
    timestamps: true,
    tableName: 'tareas'
});


module.exports = Tarea;