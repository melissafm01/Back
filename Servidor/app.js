const express = require('express');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3500;

app.use(express.json());

let Registro = [
    { nombre: "CesarRingo", direccion: "calle 45 n° 12", telefono: "456-213" },
    { nombre: "Paula Chapeño", direccion: "calle 15 n° 65", telefono: "567-893" },
    { nombre: "Juan Rengifo", direccion: "calle 56 n°78", telefono: "345-444" }
];

// Función para buscar usuario por nombre
function busquedaN(nombre, callback) {
    let user = Registro.find(u => u.nombre === nombre);
    if (!user) {
        callback("usuario no encontrado", null);
    } else {
        callback(null, user);
    }
}

// Función para crear un nuevo registro
function crear(datos, callback) {
    let { nombre, direccion, telefono } = datos;
    let nuevaPersona = { nombre, direccion, telefono };
    Registro.push(nuevaPersona);
    callback(null, nuevaPersona);
}

// Función para actualizar datos
function actualizarDatos(name, datos, callback) {
    let registro = Registro.find(emp => emp.nombre === name);
    if (registro) {
        registro.nombre = datos.nombre;
        registro.direccion = datos.direccion;
        callback(null, registro);
    } else {
        callback("Registro no encontrado", null);
    }
}

// Ruta para obtener un usuario por nombre
app.get('/Registro/Nombre', (req, res) => {
    let nombre = req.query.nombre;
    busquedaN(nombre, (error, user) => {
        if (error) {
            return res.status(404).json({ error });
        } else {
            res.json(user);
        }
    });
});

// Ruta para obtener todos los registros
app.get('/Registro', (req, res) => {
    res.json(Registro);
});

// Ruta para agregar un nuevo registro
app.post('/Registro', (req, res) => {
    let { nombre, direccion, telefono } = req.body;

    if (!nombre || !direccion || !telefono) {
        return res.status(400).json({ error: "Todos los campos son necesarios" });
    }

    crear({ nombre, direccion, telefono }, (error, nuevoRegistro) => {
        if (error) {
            res.status(500).json({ error });
        } else {
            res.json(nuevoRegistro);
        }
    });
});

// Ruta para actualizar un registro por nombre
app.put('/Registro/:nombre', (req, res) => {
    let name = req.params.nombre;
    let { nombre, direccion } = req.body;
    try {
        if (nombre || direccion) {
            actualizarDatos(name, { nombre, direccion }, (resultado) => {
                res.json(resultado);
            });
            
        } else {
            throw new Error ("error en nombre y direccion");
        }
    
} catch (e) {
    res.json({error: e.message});
}
});

function eliminarDatos(n, callback){
    /*for (let i = 0; i < Registro.legth; i++){
        if (Registro[i] == n)
            Registro.splice(i, 1);
        break;
    }*/
    let registroEncontrado=Registro.find(emp=>emp.nombre === n); //objeto 

    if(registroEncontrado){
    Registro.splice(registroEncontrado, 1);
}
    callback(registroEncontrado)
    

}
app.delete ('/Registro/:name', (req, res) => {
    let {name} = req.params;
    eliminarDatos(name, (resultado) => {
        res.json(resultado);

    })
})






// Manejo de errores 404 (ruta no encontrada)
app.use((req, res, next) => {
    res.status(404).json({ error: "Ruta no encontrada 404" });
});

// Manejo de errores 500 (error en el servidor)
app.use((err, req, res, next) => {
    res.status(500).json({ error: "Error interno en el servidor 500" });
});

// Inicio del servidor
app.listen(port, () => {
    console.log("Servidor corriendo en el puerto", port);
});
