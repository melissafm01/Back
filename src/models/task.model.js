import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  date: {
    type: Date,
    required: true
  },
  place: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  responsible: {
    type: [String],
    required: false,
    validate: {
      validator: function(arr) {
        return arr.every(item => typeof item === 'string' && item.length <= 70);
      },
      message: props => `${props.value} contains invalid responsible names`
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectionReason: String,
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotion: {
    startDate: Date,
    endDate: Date,
    featured: Boolean
  },
  capacity: {
    type: Number,
    min: 1,
    default: 50
  },
  categories: {
    type: [String],
    default: []
  },
  requirements: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Índices para búsquedas rápidas
taskSchema.index({ title: 'text', description: 'text', place: 'text' });
taskSchema.index({ status: 1, isPromoted: 1 });
taskSchema.index({ date: 1 });
taskSchema.index({ user: 1 });

// Virtual para contar asistentes
taskSchema.virtual('attendeesCount', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'task',
  count: true
});

export default mongoose.model("Task", taskSchema);