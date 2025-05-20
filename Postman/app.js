const express = require ('express')
const app = express();
require ('dotenv').config();

const port = process.env.PORT || 3500;

app.use(express.json());


let Registro= [
    { nombre: "CesarRingo",  direccion: "calle 45 n° 12",  telefono:"456-213"},
    { nombre: "Paula Chapeño", direccion: "calle 15 n° 65", telefono:"567-893"  },
    { nombre: "Juan Rengifo",  direccion:"calle 56 n°78",    telefono: "345-444" }
]


function busquedaN (nombre,Callback){
    let user = Registro.find(u => u.nombre == nombre)
    if (!user) {
        Callback( "usuario no encontrado", null);
    
    } else {
       Callback(null, user)
    }
}

function crear (datos, Callback){
  let{nombre, direccion, telefono} = datos;
  let nuevaPersona = { nombre, direccion,telefono}
  Registro.push(nuevaPersona)
  Callback(null, nuevaPersona)
}


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


    app.get('/Registro', (req, res) => {
       res.json(Registro);
})




app.post('/Registro', (req, res) => {
    let{nombre,direccion,telefono}= req.body;
   
    try{
        if (nombre || direccion){
            crear ({nombre,direccion,telefono}, (resultado) => {
                res.json(resultado)}
        )}
        res.send(resultado);
    }catch (e){
        res.json({error: "Todos los campos son necesarios"})
    }
})



app.put('/Registro', (req, res) => {
    try{
        res.send("Aqui estoy put");
    }
catch(e){
    res.json({error: "error en la ruta put"})
}
})






//manejar errorres no encontrados
app.use((err,req,res,next) =>{
    res.json({error:"error no encontrado 404"})
})
//manejar errrores captutrados 500
app.use((resq,res,next) => {
    res.json({error: "error en datos "})
})

app.listen( port, () => {
    console.log("servidor corriendo" , port)
})