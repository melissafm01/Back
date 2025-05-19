import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Para usuarios logueados
  },
  name: {
    type: String,
    required: false, 
  },
  email: {
    type: String,
    required: false, 
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  confirmed: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);
