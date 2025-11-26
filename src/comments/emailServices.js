import emailjs from '@emailjs/browser';

// Inicializar EmailJS con tu public key (obtenla de tu cuenta EmailJS)
const PUBLIC_KEY = 'TU_PUBLIC_KEY_DE_EMAILJS';

// Inicializar EmailJS
export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};

// Enviar notificación de comentario
export const sendCommentNotification = async (objectiveData, comment, commentAuthor = "Dirección General") => {
  try {
    console.log('📧 Preparando envío de correo a:', objectiveData.email);
    
    // Verificar que tenemos todos los datos necesarios
    if (!objectiveData.email) {
      throw new Error('No hay dirección de correo para el propietario del objetivo');
    }

    // Parámetros para la plantilla de EmailJS
    const templateParams = {
      to_name: objectiveData.owner,
      to_email: objectiveData.email,
      department: objectiveData.department,
      objective: objectiveData.objective,
      progress: objectiveData.progress,
      comment: comment,
      comment_author: commentAuthor,
      current_date: new Date().toLocaleDateString('es-MX')
    };

    // Enviar el correo usando EmailJS
    const result = await emailjs.send(
      'TU_SERVICE_ID_DE_EMAILJS', // Reemplaza con tu Service ID
      'TU_TEMPLATE_ID_DE_EMAILJS', // Reemplaza con tu Template ID
      templateParams
    );

    console.log('✅ Correo enviado exitosamente:', result);
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return { 
      success: false, 
      error: error.message || 'Error al enviar el correo' 
    };
  }
};