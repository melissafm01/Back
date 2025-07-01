export const otpMap = new Map();

export const  generateOTP = (email) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Genera un código OTP de 6 dígitos
    const expires = Date.now() + 15 * 60 * 1000; // Establece la expiración del OTP a 15 minutos desde ahora
    otpMap.set(email, { code, expires }); // Guarda el OTP y su fecha de expiración
    return code; // Retorna el código OTP generado
}

export const verifyOTP = (email, code) => {
    const otpData = otpMap.get(email);
    if (!otpData) return { success: false, message: "codigo OTP no encontrado" };
        
    if (Date.now() > otpData.expires) {
        otpMap.delete(email); // Elimina OTP expirado
        return { success: false, message: "codigo OTP expirado" };
    }
    if (otpData.code !== code) {
        return { success: false, message: "codigo OTP incorrecto" };
    }
    otpMap.delete(email); // Elimina OTP después de verificarlo
    return { success: true, message: "codigo OTP verificado correctamente" };
    
};
