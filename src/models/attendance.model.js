import mongoose from "mongoose";

/*const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Asegura que un usuario no pueda registrarse varias veces para la misma tarea
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
  statics: {
    async registerAttendance(data) {
      const existing = await this.findOne({
        user: data.user,
        task: data.task
      });
      if (existing) {
        throw new Error("Ya confirmaste asistencia a esta tarea");
      }
      return this.create(data);
    }
  }
});

export default mongoose.model("Attendance", attendanceSchema);*/
// models/attendance.model.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Un usuario solo puede asistir una vez a una actividad
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;

