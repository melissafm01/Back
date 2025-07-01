

//models/comunidad.js


const mongoose = require('mongoose');

const ComunidadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  miembros: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rol: { type: String, enum: ['admin', 'moderador', 'miembro'], default: 'miembro' }
    }
  ]
});

module.exports = mongoose.model('Comunidad', ComunidadSchema);

