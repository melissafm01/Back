import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../libs/jwt.js";
import { admin } from "../config/firebase.js";
import { sendEmail } from "../libs/sendEmail.js"
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userFound = await User.findOne({ email });

    if (userFound)
      return res.status(400).json({ message: ["El correo electrónico ya está en uso"] });

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      username,
      email,
      password: passwordHash,
      isVerified: false,
      verificationToken,
    });

    const userSaved = await newUser.save();

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verifica tu cuenta",
      text: `Hola ${username},

      Gracias por unirte a PanasCOOP 🎉
      Confirma tu cuenta haciendo clic en el siguiente enlace y ya seras parte nuestra Gran comunidad:
      ${verificationLink}

      Si no creaste esta cuenta, ignora este correo.
      
      Un abrazo solidario de parte de PanasCOOP`,
    });

    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para verificar la cuenta.",
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFound = await User.findOne({ email });

    if (!userFound)
      return res.status(400).json({
        message: ["El correo electrónico no existe"],
      });

    if (!userFound.isActive) {
      return res.status(403).json({
        message: ["Su cuenta ha sido desactivada. Por favor, contacte con el servicio de asistencia."],
      });
    }

    if (userFound.role === 'user' && !userFound.isVerified) {
     return res.status(403).json({
    message: ["Debes verificar tu cuenta antes de iniciar sesión. Revisa tu correo electrónico."],
    });
   }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(400).json({
        message: ["La contraseña es incorrecta"],
      });
    }

    const token = await createAccessToken({
      id: userFound._id,
      username: userFound.username,
    });

    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyToken = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.send(false);

  jwt.verify(token, TOKEN_SECRET, async (error, user) => {
    if (error) return res.sendStatus(401);

    const userFound = await User.findById(user.id);
    if (!userFound || !userFound.isActive) return res.sendStatus(401);

    // CORRECCIÓN: Los superadmins y admins no necesitan verificación de email
    if (userFound.role === 'user' && !userFound.isVerified) {
      return res.sendStatus(401);
    }

    return res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
    });
  });
};

export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    
    console.log('Token recibido para verificación:', token);
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: "Token de verificación es requerido" 
      });
    }
    
    const user = await User.findOne({ 
      verificationToken: token,
      isVerified: false
    });

    if (!user) {
      console.log('Token no encontrado o usuario ya verificado');
      return res.status(400).json({ 
        success: false,
        message: "Token de verificación inválido, expirado o cuenta ya verificada" 
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    console.log(`Usuario ${user.email} verificado exitosamente`);

    const token_jwt = await createAccessToken({
      id: user._id,
      username: user.username,
    });

    res.cookie("token", token_jwt, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    res.json({
      success: true,
      message: `¡Bienvenido a PanasCOOP, ${user.username}! Tu cuenta ha sido verificada exitosamente.`,
      user: {
        id: user._id,
        username: user.username,
        name: user.username,
        email: user.email,
        role: user.role || 'user',
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Error en verificación de email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al verificar la cuenta' 
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isVerified: false });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Usuario no encontrado o ya verificado" 
      });
    }

    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(32).toString("hex");
      await user.save();
    }

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verifica tu cuenta - PanasCOOP",
      text: `Hola ${user.username},

      Aquí tienes nuevamente el enlace para verificar tu cuenta en PanasCOOP 🎉
      
      Haz clic en el siguiente enlace para confirmar tu cuenta:
      ${verificationLink}

      Si no creaste esta cuenta, ignora este correo.
      
      Un abrazo solidario de parte de PanasCOOP`,
    });

    res.json({
      success: true,
      message: "Email de verificación reenviado. Revisa tu correo."
    });

  } catch (error) {
    console.error("Error al reenviar email:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al reenviar el email" 
    });
  }
};

export const createInitialSuperAdmin = async (req, res) => {
  try {
    const { username, email, password, secretKey } = req.body;

    const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || "mi-clave-super-secreta-2024";
    
    if (secretKey !== SUPER_ADMIN_SECRET) {
      return res.status(403).json({ 
        message: ["Clave secreta no válida"] 
      });
    }

    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        message: ["El superadministrador ya existe"] 
      });
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({ 
        message: ["El correo electrónico ya está en uso"] 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newSuperAdmin = new User({
      username,
      email,
      password: passwordHash,
      role: "superadmin",
      isVerified: true,
      isActive: true, // CORRECCIÓN: Asegurar que esté activo
    });

    const superAdminSaved = await newSuperAdmin.save();

    const token = await createAccessToken({
      id: superAdminSaved._id,
      username: superAdminSaved.username,
    });

    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    res.status(201).json({
      message: "Superadministrador creado exitosamente",
      user: {
        id: superAdminSaved._id,
        username: superAdminSaved.username,
        email: superAdminSaved.email,
        role: superAdminSaved.role,
      }
    });

  } catch (error) {
    console.error("Error al crear superadministrador:", error);
    res.status(500).json({ message: error.message });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userFound = await User.findOne({ email });
    if (userFound)
      return res.status(400).json({ message: ["El correo electrónico ya está en uso"] });

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      email,
      password: passwordHash,
      role: "admin",
      isVerified: true,
      isActive: true, // CORRECCIÓN: Asegurar que esté activo
    });

    const adminSaved = await newAdmin.save();

    res.status(201).json({
      message: "Admin creado con éxito",
      user: {
        id: adminSaved._id,
        username: adminSaved.username,
        email: adminSaved.email,
        role: adminSaved.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
  });
  return res.sendStatus(200);
};

/*
export const loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { id, name, email } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ name, email, googleId: id });
    }

    // Ahora genera tu propio JWT
    const token = generateJWT(user); // <-- tu función JWT

    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ message: "Token inválido de Google" });
  }
};

// si el usuario olvida la contraseña, puede solicitar un enlace de restablecimiento por medio de su corrreo y gracias a firebase se le enviara un enlace para que pueda restablecer su contraseña
export const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const link = await getAuth().generatePasswordResetLink(email);
    // Aquí podrías enviar este link por correo usando nodemailer (opcional)
    res.json({ message: "Enlace de recuperación generado", resetLink: link });
  } catch (error) {
    console.error("Error al generar el enlace de recuperación:", error);
    res.status(400).json({ message: "Error al enviar enlace de recuperación" });
  }
};
  */
