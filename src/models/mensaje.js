const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  comunidad: { type: mongoose.Schema.Types.ObjectId, ref: 'Comunidad' },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  texto: String,
  audioUrl: String,
  timestamp: { type: Date, default: Date.now },
  tipo: { type: String, enum: ['texto', 'audio'], default: 'texto' }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);