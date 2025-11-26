import React from 'react';

export const ObjectivesTable = ({ selectedOwner, selectedDepartment, objectivesData }) => {
  const getObjectives = () => {
    if (selectedOwner) {
      return objectivesData.filter(
        item => item.owner === selectedOwner.owner && item.department === selectedOwner.department
      );
    } else if (selectedDepartment) {
      return objectivesData.filter(item => item.department === selectedDepartment);
    }
    return [];
  };

  const objectives = getObjectives();

  if (!selectedOwner && !selectedDepartment) {
    return (
      <div className="card">
        <h2>Lista de Objetivos</h2>
        <div className="no-selection">
          <p>Selecciona un departamento o propietario para ver la lista de sus objetivos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        {selectedOwner 
          ? `Lista de Objetivos - ${selectedOwner.owner}`
          : `Lista de Objetivos - ${selectedDepartment}`
        }
      </h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Objetivo</th>
              <th>Avance</th>
              <th>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {objectives.map((obj, index) => {
              const progressColor = obj.progress < 60 ? '#e74c3c' : '#4caf50';
              return (
                <tr key={index}>
                  <td>{obj.objective}</td>
                  <td>{obj.progress}%</td>
                  <td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};