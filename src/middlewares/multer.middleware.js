import multer from "multer";


const storage = multer.memoryStorage(); // no guarda el archivo en disco
const upload = multer ({ storage }).single("image"); // el nombre del campo en el formulario

export default upload; 