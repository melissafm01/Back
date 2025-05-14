const express = require('express');
const app = express();
require('dotenv').config();
app.use(express.json()); 

const proyectoRoutes = require ('./routes/proyectoRoutes');
const pruebasRoutes = require('./routes/pruebasRoutes');
const testerRoutes = require('./routes/testerRoutes');



const port = process.env.PORT;

app.use(express.json());
app.use('/api/proyectos', proyectoRoutes);

app.use('/api/tester', testerRoutes);

app.use('/api/pruebas', pruebasRoutes);

app.listen(port, () => {
    console.log("El servidor esta corriendo" + port);
});

app.use (express.urlencoded({ extended: true }));