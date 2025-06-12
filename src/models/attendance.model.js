import mongoose from "mongoose";

/*const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // esto está bien, porque cada asistencia necesita saber quién es el usuario
    
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },

  confirmed: {
    type: Boolean,
    default: true // Por defecto no confirmado
  },
  date: {
    type: Date,
    default: Date.now,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Este índice permite que un usuario asista a muchas actividades,
// pero solo una vez por actividad
attendanceSchema.index({ user: 1, task: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);*/

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  //  AGREGAR ESTE CAMPO
  confirmed: {
    type: Boolean,
    default: true // Por defecto no confirmado
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Índices únicos compuestos
attendanceSchema.index(
  { user: 1, task: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);

attendanceSchema.index(
  { email: 1, task: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

export default mongoose.model("Attendance", attendanceSchema);
