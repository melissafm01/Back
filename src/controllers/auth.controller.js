import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../libs/jwt.js";
import { admin } from "../config/firebase.js";

import { getAuth } from "firebase/auth";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body; 

    const userFound = await User.findOne({ email });   

    if (userFound)
      return res.status(400).json({
        message: ["The email is already in use"],   //Antes de crear un usuario nuevo, hay que revisar si ya hay alguien registrado con ese mismo email (para que no haya duplicados). Si sí existe, devolvemos un 400 con un mensaje de error, y ya no seguimos ejecutando el resto del código.


      });

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10); 


    // creating the user
    const newUser = new User({
      username,
      email,
      password: passwordHash,
    });

    // guardar the user in the database
    const userSaved = await newUser.save();
  

    // create access token
    const token = await createAccessToken({
      id: userSaved._id,
    });


    // guardar el token en la cookie
    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });


    res.json({
      id: userSaved._id,
      username: userSaved.username,
      email: userSaved.email,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFound = await User.findOne({ email });

    if (!userFound)
      return res.status(400).json({
        message: ["The email does not exist"],      //en caso de q el email.no exista//
      });

    const isMatch = await bcrypt.compare(password, userFound.password);          //comparamos la contraseña normal con la haseada si coinciden es correscta o si no el uysuario se equivoco//
    if (!isMatch) {
      return res.status(400).json({
        message: ["The password is incorrect"],
      });
    }

    const token = await createAccessToken({                  // Crear el token de acceso (JWT)//
      id: userFound._id,
      username: userFound.username,
    });


    //Guardar el token en una cookie//
    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",      
      secure: true,       // HTTPS.//
      sameSite: "none",      
    });

    res.json({
      id: userFound._id,
      username: userFound.username,   //Finalmente, mandamos de vuelta la info del usuario (pero nunca la contraseña).//
      email: userFound.email,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export const verifyToken = async (req, res) => {

  const { token } = req.cookies;                        //Aquí lee la cookie que se guardó en el navegador.//
  if (!token) return res.send(false);


  jwt.verify(token, TOKEN_SECRET, async (error, user) => {   //Si el token es válido y no ha expirado, te devuelve el payload //
    if (error) return res.sendStatus(401);



    //Buscar al usuario en la base de datos

    const userFound = await User.findById(user.id);  

    if (!userFound) 
    return res.sendStatus(401);  


    //si todo va bien  //
    return res.json({
      id: userFound._id,
      username: userFound.username,  //Si todo bien, devolvemos info del usuario
      email: userFound.email,
    });
  });
};

export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,    //servidor//
    secure: true,    //https//
    expires: new Date(0),  
  });
  return res.sendStatus(200);
};
  //Autenticación con google, el usuario podra loguearse por su cuenta google


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