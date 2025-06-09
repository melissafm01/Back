import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.model.js";

export const auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);

    if (!token)
      return res.status(401).json({ message: "No token, authorization denied" });

    jwt.verify(token, TOKEN_SECRET, async (error, decoded) => {
      if (error) return res.status(401).json({ message: "Token is not valid" });

      // Buscar el usuario completo en la base de datos para obtener el rol actualizado
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      req.userId = user._id;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};