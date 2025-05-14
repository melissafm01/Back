const express = require('express');
const pruebasController = require ('../controller/pruebasController');

const router = express.Router();


router.get('/', pruebasController.obtenerPruebasPorTester);



module.exports = router 