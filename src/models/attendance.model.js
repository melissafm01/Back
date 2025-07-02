import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
  }
}, { timestamps: true });

// Índices únicos compuestos
attendanceSchema.index(
  { user: 1, task: 1 },
  { unique: true }
);



export default mongoose.model("Attendance", attendanceSchema);