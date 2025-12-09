import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useComments } from '../hooks/useComments';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const DetailsSection = ({ selectedOwner, selectedBoss, objectivesData }) => {
  const [editingComment, setEditingComment] = useState(null);
  const [tempComment, setTempComment] = useState('');
  
  const { comments, loading, loadMultipleComments, clearComments, isOnline, saveComment, deleteComment } = useComments();

  // Trackear selección anterior
  const prevSelectionRef = useRef({ 
    owner: null, 
    boss: null,
    objectivesCount: 0 
  });

  // Función para generar ID único del objetivo
  const getObjectiveId = useCallback((objective) => {
    const id = `${objective.boss}_${objective.department}_${objective.owner}_${objective.objective}`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 150);
    return id;
  }, []);

  // Obtener los objetivos basados en la selección actual
  const getCurrentObjectives = useCallback(() => {
    if (selectedOwner) {
      return objectivesData.filter(
        item => item.owner === selectedOwner.owner && 
                item.boss === selectedOwner.boss
      );
    } else if (selectedBoss) {
      return objectivesData.filter(item => item.boss === selectedBoss);
    }
    return [];
  }, [selectedOwner, selectedBoss, objectivesData]);

  const objectives = getCurrentObjectives();

  useEffect(() => {
    if (objectives.length === 0) {
      if (prevSelectionRef.current.objectivesCount > 0) {
        console.log('🧹 Limpiando comentarios - no hay objetivos');
        clearComments();
        prevSelectionRef.current = { owner: null, boss: null, objectivesCount: 0 };
      }
      return;
    }

    const currentSelectionKey = selectedOwner 
      ? `owner:${selectedOwner.owner}-${selectedOwner.boss}`
      : `boss:${selectedBoss}`;

    const prevSelectionKey = prevSelectionRef.current.owner 
      ? `owner:${prevSelectionRef.current.owner}-${prevSelectionRef.current.boss}`
      : `boss:${prevSelectionRef.current.boss}`;

    const selectionChanged = currentSelectionKey !== prevSelectionKey;
    const objectivesCountChanged = objectives.length !== prevSelectionRef.current.objectivesCount;

    if (selectionChanged || objectivesCountChanged) {
      const objectiveIds = objectives.map(obj => getObjectiveId(obj));
      console.log('🎯 Cargando comentarios para:', objectiveIds.length, 'objetivos');
      
      loadMultipleComments(objectiveIds);

      prevSelectionRef.current = {
        owner: selectedOwner?.owner || null,
        boss: selectedOwner?.boss || selectedBoss || null,
        objectivesCount: objectives.length
      };
    }
  }, [
    selectedOwner?.owner, 
    selectedOwner?.boss, 
    selectedBoss,
    objectives.length,
    getObjectiveId, 
    loadMultipleComments, 
    clearComments
  ]);

  useEffect(() => {
    if (!selectedOwner && !selectedBoss) {
      console.log('No hay selección activa');
      clearComments();
      setEditingComment(null);
      setTempComment('');
      prevSelectionRef.current = { owner: null, boss: null, objectivesCount: 0 };
    }
  }, [selectedOwner, selectedBoss, clearComments]);

  const handleSaveComment = async (objectiveId) => {
    if (!isOnline) {
      alert('⚠️ No hay conexión a internet. No se puede guardar el comentario.');
      return;
    }
    
    if (tempComment.trim() !== '') {
      const result = await saveComment(objectiveId, tempComment.trim());
      if (result.success) {
        setEditingComment(null);
        setTempComment('');
      } else {
        alert('Error al guardar el comentario: ' + result.error);
      }
    } else {
      const result = await deleteComment(objectiveId);
      if (result.success) {
        setEditingComment(null);
        setTempComment('');
      } else {
        alert('Error al eliminar el comentario: ' + result.error);
      }
    }
  };

  const handleEditComment = (objectiveId, currentComment) => {
    setEditingComment(objectiveId);
    setTempComment(currentComment || '');
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setTempComment('');
  };

  const handleDeleteComment = async (objectiveId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      const result = await deleteComment(objectiveId);
      if (!result.success) {
        alert('Error al eliminar el comentario: ' + result.error);
      }
    }
  };

  const getChartData = () => {
    if (selectedOwner) {
      return {
        labels: objectives.map(obj => 
          obj.objective.length > 50 ? 
          obj.objective.substring(0, 50) + '...' : obj.objective
        ),
        datasets: [
          {
            label: 'Avance (%)',
            data: objectives.map(obj => obj.progress),
            backgroundColor: objectives.map(obj => 
              obj.progress >= 80 ? 'rgba(75, 192, 192, 0.7)' :
              obj.progress >= 50 ? 'rgba(255, 205, 86, 0.7)' :
              'rgba(255, 99, 132, 0.7)'
            ),
            borderColor: objectives.map(obj => 
              obj.progress >= 80 ? 'rgba(75, 192, 192, 1)' :
              obj.progress >= 50 ? 'rgba(255, 205, 86, 1)' :
              'rgba(255, 99, 132, 1)'
            ),
            borderWidth: 1,
          },
        ],
      };
    } else {
      const ownerMap = {};
      objectives.forEach(item => {
        if (!ownerMap[item.owner]) {
          ownerMap[item.owner] = {
            owner: item.owner,
            department: item.department,
            objectives: [],
            totalProgress: 0
          };
        }
        ownerMap[item.owner].objectives.push(item);
        ownerMap[item.owner].totalProgress += item.progress;
      });

      const ownerStats = Object.values(ownerMap).map(ownerData => ({
        ...ownerData,
        avgProgress: ownerData.totalProgress / ownerData.objectives.length
      }));

      return {
        labels: ownerStats.map(owner => owner.owner),
        datasets: [
          {
            label: 'Avance Promedio (%)',
            data: ownerStats.map(owner => owner.avgProgress),
            backgroundColor: ownerStats.map(owner => 
              owner.avgProgress >= 80 ? 'rgba(75, 192, 192, 0.7)' :
              owner.avgProgress >= 50 ? 'rgba(255, 205, 86, 0.7)' :
              'rgba(255, 99, 132, 0.7)'
            ),
            borderColor: ownerStats.map(owner => 
              owner.avgProgress >= 80 ? 'rgba(75, 192, 192, 1)' :
              owner.avgProgress >= 50 ? 'rgba(255, 205, 86, 1)' :
              'rgba(255, 99, 132, 1)'
            ),
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: selectedOwner ? 'y' : 'x',
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: selectedOwner ? 'Porcentaje de Avance' : ''
        }
      },
      y: {
        beginAtZero: true,
        max: selectedOwner ? undefined : 100,
        title: {
          display: !selectedOwner,
          text: selectedOwner ? '' : 'Porcentaje de Avance'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: selectedOwner ? {
          title: function(tooltipItems) {
            return objectives[tooltipItems[0].dataIndex].objective;
          }
        } : {}
      }
    }
  };

  const chartData = getChartData();

  if (!selectedOwner && !selectedBoss) {
    return (
      <div className="card centered-card">
        <h2>Detalle de Objetivos</h2>
        <div className="no-selection">
          <p>Selecciona un jefe directo o propietario del gráfico para ver el detalle de sus objetivos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card full-width-card">
      <h2>
        {selectedOwner 
          ? `Objetivos de ${selectedOwner.owner} (Jefe: ${selectedOwner.boss}, Depto: ${selectedOwner.department})`
          : `Objetivos del Equipo - ${selectedBoss}`
        }
        {!isOnline && (
          <span style={{ 
            fontSize: '14px', 
            color: '#e74c3c', 
            marginLeft: '10px',
            fontWeight: 'normal'
          }}>
            ⚠️ Modo offline
          </span>
        )}
      </h2>
      
      <div className="centered-chart-container">
        {objectives.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="no-selection">
            <p>No hay objetivos para mostrar</p>
          </div>
        )}
      </div>

      {objectives.length > 0 && (
        <div className="table-full-container">
          <h3>Lista de Objetivos</h3>
          <div className="table-container-full">
            <table className="full-width-table">
              <thead>
                <tr>
                  <th className="col-objective">Objetivo</th>
                  <th className="col-progress">Avance</th>
                  <th className="col-bar">Progreso</th>
                  <th className="col-comment">Comentario de Dirección General</th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((obj, index) => {
                  const objectiveId = getObjectiveId(obj);
                  const progressColor = obj.progress < 60 ? '#e74c3c' : '#4caf50';
                  const currentComment = comments[objectiveId] || '';
                  const isLoading = loading[objectiveId];
                  
                  return (
                    <tr key={index}>
                      <td className="col-objective">{obj.objective}</td>
                      <td className="col-progress">{obj.progress}%</td>
                      <td className="col-bar">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${obj.progress}%`, 
                              backgroundColor: progressColor 
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="col-comment">
                        {editingComment === objectiveId ? (
                          <div className="comment-edit-container">
                            <textarea
                              value={tempComment}
                              onChange={(e) => setTempComment(e.target.value)}
                              placeholder="Escriba su comentario aquí..."
                              className="comment-textarea"
                              rows="3"
                              disabled={isLoading || !isOnline}
                            />
                            {!isOnline && (
                              <div style={{ 
                                color: '#e74c3c', 
                                fontSize: '12px', 
                                marginBottom: '5px' 
                              }}>
                                ⚠️ Sin conexión - No se puede guardar
                              </div>
                            )}
                            <div className="comment-buttons">
                              <button 
                                className="comment-btn save-btn"
                                onClick={() => handleSaveComment(objectiveId)}
                                disabled={isLoading || !isOnline}
                              >
                                {isLoading ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button 
                                className="comment-btn cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={isLoading}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="comment-display-container">
                            {currentComment ? (
                              <>
                                <div className="comment-text">{currentComment}</div>
                                <div className="comment-actions">
                                  <button 
                                    className="comment-btn edit-btn"
                                    onClick={() => handleEditComment(objectiveId, currentComment)}
                                    disabled={isLoading}
                                  >
                                    {isLoading ? 'Cargando...' : 'Editar'}
                                  </button>
                                  <button 
                                    className="comment-btn delete-btn"
                                    onClick={() => handleDeleteComment(objectiveId)}
                                    disabled={isLoading || !isOnline}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button 
                                className="comment-btn add-btn"
                                onClick={() => handleEditComment(objectiveId, '')}
                                disabled={isLoading}
                              >
                                {isLoading ? 'Cargando...' : '+ Agregar Comentario'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};