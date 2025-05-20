const express = require("express");
const testerController = require("../controller/testerController");

const router = express.Router();

router.get("/pruebas", testerController)
module.exports = new Tester;