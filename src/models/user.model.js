import mongoose from "mongoose";

const userSchema = new mongoose.Schema(   
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

     email: {
      type: String,       
      unique: true,
    },
    
    phone: {
     type: String,       
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false,     
    },
    lastVerificationEmail: {
      type: Date,
      
    },
    verificationToken: {
      type: String,
    },
    // NUEVOS CAMPOS para reset de contraseña
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    // Para Google OAuth (opcional para futuro uso)
    googleId: {
      type: String,
    },
    lastInteraction: {
      type: Date,
      default: Date.now
    },
    lastLogin: Date,

  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret.password;
        delete ret.passwordResetToken; // No exponer el token de reset
        return ret;
      }
    }
  }
);

// Índices para búsquedas rápidas
userSchema.index({ username: 'text', email: 'text' });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ passwordResetToken: 1 }); // Índice para búsquedas de reset

export default mongoose.model("User", userSchema);