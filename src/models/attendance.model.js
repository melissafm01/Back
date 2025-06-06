import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // ✅ esto está bien, porque cada asistencia necesita saber quién es el usuario
    // ❌ no pongas unique aquí
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
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

export default mongoose.model("Attendance", attendanceSchema);
