/*import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const auth = (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);

    if (!token)
      return res.status(401).json({ message: "No token, authorization denied" });

    jwt.verify(token, TOKEN_SECRET, (error, user) => {
      if (error) return res.status(401).json({ message: "Token is not valid" });

      req.user = user; // <- el payload del token
      req.userId = user.id || user._id
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const getUserFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Obtener usuario COMPLETO de la base de datos
  const user = await user.findById(decoded.id).select('email name');
  
  if (!user) throw new Error('Usuario no encontrado');
  
  return {
    id: user._id,
    email: user.email, // ← Asegurar que el email está incluido
    name: user.name
  };
};*/


import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.model.js"; // Importa tu modelo User
import mongoose from "mongoose";

export const auth = async (req, res, next) => {
  try {
    // 1. Obtención del token
    const token =
      req.cookies.token ||
      (req.headers.authorization?.startsWith("Bearer ") && 
       req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // 2. Verificación del token
    const decoded = jwt.verify(token, TOKEN_SECRET);
    
    // 3. Obtención del usuario COMPLETO desde la BD
    const user = await User.findById(decoded.id).select('email name').lean();
    
    if (!user) {
      return res.status(401).json({ message: "Usuario no existe" });
    }

    // 4. Asignación de datos completos
    req.user = {
      id: user._id.toString(),
      _id: user._id, // Para compatibilidad
      email: user.email, // <- Esto soluciona tu problema principal
      name: user.name,
      ...decoded // Mantiene cualquier otro dato del token
    };

    req.userId = user._id; // Para compatibilidad

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({ 
      message: "Error de autenticación",
      error: error.message 
    });
  }
};