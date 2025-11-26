// src/hooks/useComments.jsx
import { useState, useCallback } from 'react';
import { deleteComment, getComment, saveComment } from '../comments/commentsService';


export const useComments = () => {
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState({});
  const [isOnline, setIsOnline] = useState(true);

  // Cargar múltiples comentarios - SIN LOOPS
  const loadMultipleComments = useCallback(async (objectiveIds) => {
    if (!objectiveIds || objectiveIds.length === 0) {
      return;
    }
    
    console.log('🚀 Cargando comentarios para:', objectiveIds.length, 'objetivos');
    
    // Marcar todos como cargando
    const loadingState = {};
    objectiveIds.forEach(id => {
      loadingState[id] = true;
    });
    setLoading(prev => ({ ...prev, ...loadingState }));
    
    try {
      // Verificar conexión
      if (!navigator.onLine) {
        console.warn('⚠️ Sin conexión a internet');
        setIsOnline(false);
        return;
      }
      
      setIsOnline(true);
      
      // Cargar TODOS los comentarios en paralelo
      const loadPromises = objectiveIds.map(async (objectiveId) => {
        try {
          const comment = await getComment(objectiveId);
          return { objectiveId, comment };
        } catch (error) {
          console.error(`Error cargando comentario ${objectiveId}:`, error);
          // Si hay error de conexión, devolver comentario vacío pero marcar como offline
          if (error.message === 'offline' || error.code === 'unavailable') {
            setIsOnline(false);
          }
          return { objectiveId, comment: '' };
        }
      });
      
      const results = await Promise.all(loadPromises);
      
      // Actualizar el estado una sola vez
      const newComments = {};
      results.forEach(({ objectiveId, comment }) => {
        newComments[objectiveId] = comment;
      });
      
      setComments(prev => ({
        ...prev,
        ...newComments
      }));
      
      console.log('✅ Comentarios cargados exitosamente');
      
    } catch (error) {
      console.error('❌ Error cargando comentarios:', error);
    } finally {
      // Quitar el estado de loading para todos
      setTimeout(() => {
        const finishedLoading = {};
        objectiveIds.forEach(id => {
          finishedLoading[id] = false;
        });
        setLoading(prev => ({ ...prev, ...finishedLoading }));
      }, 300);
    }
  }, []);

  // Limpiar comentarios
  const clearComments = useCallback(() => {
    console.log('🧹 Limpiando comentarios');
    setComments({});
    setLoading({});
  }, []);

  // Guardar un comentario
  const handleSaveComment = async (objectiveId, comment) => {
    if (!objectiveId) return { success: false, error: 'ID de objetivo no válido' };
    
    setLoading(prev => ({ ...prev, [objectiveId]: true }));
    
    try {
      if (!navigator.onLine) {
        throw new Error('No hay conexión a internet');
      }
      
      console.log(`💾 Guardando comentario: ${objectiveId}`);
      const result = await saveComment(objectiveId, comment);
      
      if (result.success) {
        setComments(prev => ({
          ...prev,
          [objectiveId]: comment
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error guardando comentario:`, error);
      
      // Manejar diferentes tipos de errores de conexión
      const isConnectionError = 
        error.message.includes('conexión') || 
        error.message.includes('internet') ||
        error.code === 'unavailable' ||
        error.message === 'offline';
      
      if (isConnectionError) {
        setIsOnline(false);
        return { 
          success: false, 
          error: 'Error de conexión. Verifica tu internet.' 
        };
      }
      
      return { success: false, error: error.message };
    } finally {
      setLoading(prev => ({ ...prev, [objectiveId]: false }));
    }
  };

  // Eliminar un comentario
  const handleDeleteComment = async (objectiveId) => {
    if (!objectiveId) return { success: false, error: 'ID de objetivo no válido' };
    
    setLoading(prev => ({ ...prev, [objectiveId]: true }));
    
    try {
      if (!navigator.onLine) {
        throw new Error('No hay conexión a internet');
      }
      
      const result = await deleteComment(objectiveId);
      if (result.success) {
        setComments(prev => {
          const newComments = { ...prev };
          delete newComments[objectiveId];
          return newComments;
        });
      }
      return result;
    } catch (error) {
      console.error(`Error eliminando comentario:`, error);
      
      // Manejar diferentes tipos de errores de conexión
      const isConnectionError = 
        error.message.includes('conexión') || 
        error.message.includes('internet') ||
        error.code === 'unavailable' ||
        error.message === 'offline';
      
      if (isConnectionError) {
        setIsOnline(false);
        return { 
          success: false, 
          error: 'Error de conexión. Verifica tu internet.' 
        };
      }
      
      return { success: false, error: error.message };
    } finally {
      setLoading(prev => ({ ...prev, [objectiveId]: false }));
    }
  };

  return {
    comments,
    loading,
    isOnline,
    loadMultipleComments,
    clearComments,
    saveComment: handleSaveComment,
    deleteComment: handleDeleteComment
  };
};