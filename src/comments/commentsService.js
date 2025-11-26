// src/services/commentsService.js
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COMMENTS_COLLECTION = 'directorComments';

// Función para obtener referencia al documento
const getCommentRef = (objectiveId) => {
  return doc(db, COMMENTS_COLLECTION, objectiveId);
};

// Guardar o actualizar un comentario
export const saveComment = async (objectiveId, comment) => {
  try {
    console.log('💾 Guardando comentario en Firebase:', objectiveId);
    
    const commentRef = getCommentRef(objectiveId);
    
    await setDoc(commentRef, {
      comment: comment.trim(),
      objectiveId: objectiveId,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Comentario guardado en Firebase exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error guardando comentario en Firebase:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido al guardar comentario'
    };
  }
};

// Eliminar un comentario
export const deleteComment = async (objectiveId) => {
  try {
    console.log('🗑️ Eliminando comentario de Firebase:', objectiveId);
    
    const commentRef = getCommentRef(objectiveId);
    await deleteDoc(commentRef);
    
    console.log('✅ Comentario eliminado de Firebase exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando comentario de Firebase:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido al eliminar comentario'
    };
  }
};

// Cargar un comentario específico
export const getComment = async (objectiveId) => {
  try {
    console.log('🔍 Cargando comentario desde Firebase:', objectiveId);
    
    const commentRef = getCommentRef(objectiveId);
    const docSnapshot = await getDoc(commentRef);
    
    if (docSnapshot.exists()) {
      const commentData = docSnapshot.data();
      console.log('✅ Comentario encontrado en Firebase');
      return commentData.comment || '';
    }
    
    console.log('ℹ️ No se encontró comentario en Firebase');
    return '';
  } catch (error) {
    console.error('❌ Error cargando comentario desde Firebase:', error);
    
    // Manejar específicamente errores de conexión
    if (error.code === 'unavailable' || 
        error.message.includes('offline') ||
        error.message.includes('network') ||
        !navigator.onLine) {
      console.warn('⚠️ Firebase offline - No se pudieron cargar comentarios');
      throw new Error('offline');
    }
    
    throw error;
  }
};