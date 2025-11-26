import { useRef, useCallback, useEffect } from 'react';

// Solución para el error "global is not defined"
if (typeof global === 'undefined') {
  window.global = window;
}

// Importación dinámica de Chart.js para evitar problemas con SSR
let Chart;
let ChartInitialized = false;

const initializeChart = async () => {
  if (ChartInitialized) return;
  
  const chartJS = await import('chart.js/auto');
  Chart = chartJS.default;
  ChartInitialized = true;
};

export const useCharts = () => {
  const chartInstances = useRef({});

  // Inicializar Chart.js cuando el hook se use por primera vez
  useEffect(() => {
    initializeChart();
  }, []);

  const calculateDepartmentStats = useCallback((objectivesData) => {
    if (!objectivesData || objectivesData.length === 0) {
      return [];
    }

    const departmentMap = {};
    
    objectivesData.forEach(item => {
      const dept = item.department;
      
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          objectives: [],
          totalProgress: 0
        };
      }
      
      departmentMap[dept].objectives.push({
        objective: item.objective,
        progress: item.progress
      });
      
      departmentMap[dept].totalProgress += item.progress;
    });
    
    const departmentStats = Object.values(departmentMap).map(deptData => {
      const avgProgress = deptData.totalProgress / deptData.objectives.length;
      return {
        ...deptData,
        avgProgress: Math.round(avgProgress * 100) / 100,
        objectiveCount: deptData.objectives.length
      };
    });
    
    return departmentStats.sort((a, b) => b.avgProgress - a.avgProgress);
  }, []);

  const calculateOwnerStats = useCallback((objectivesData, currentDepartment) => {
    if (!objectivesData || objectivesData.length === 0) {
      return [];
    }

    const ownerMap = {};
    
    objectivesData.forEach(item => {
      if (currentDepartment && item.department !== currentDepartment) {
        return;
      }
      
      const key = `${item.owner}|${item.department}`;
      
      if (!ownerMap[key]) {
        ownerMap[key] = {
          owner: item.owner,
          department: item.department,
          objectives: [],
          totalProgress: 0
        };
      }
      
      ownerMap[key].objectives.push({
        objective: item.objective,
        progress: item.progress
      });
      
      ownerMap[key].totalProgress += item.progress;
    });
    
    const ownerStats = Object.values(ownerMap).map(ownerData => {
      const avgProgress = ownerData.totalProgress / ownerData.objectives.length;
      return {
        ...ownerData,
        avgProgress: Math.round(avgProgress * 100) / 100,
        objectiveCount: ownerData.objectives.length
      };
    });
    
    return ownerStats.sort((a, b) => b.avgProgress - a.avgProgress);
  }, []);

  const renderGlobalChart = useCallback((
    canvas,
    objectivesData,
    currentDepartment,
    isDepartmentView,
    departmentColors,
    onDepartmentSelect,
    onOwnerSelect
  ) => {
    if (!ChartInitialized || !Chart) {
      console.warn('Chart.js no está inicializado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (chartInstances.current.globalChart) {
      chartInstances.current.globalChart.destroy();
      chartInstances.current.globalChart = null;
    }

    // Limpiar el canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!objectivesData || objectivesData.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos disponibles para mostrar', canvas.width / 2, canvas.height / 2);
      return;
    }

    let labels, data, departments, backgroundColors;

    try {
      if (isDepartmentView) {
        const departmentStats = calculateDepartmentStats(objectivesData);
        labels = departmentStats.map(dept => dept.department);
        data = departmentStats.map(dept => dept.avgProgress);
        backgroundColors = labels.map(dept => departmentColors[dept] || 'rgba(201, 203, 207, 0.7)');
      } else {
        const ownerStats = calculateOwnerStats(objectivesData, currentDepartment);
        labels = ownerStats.map(owner => owner.owner);
        data = ownerStats.map(owner => owner.avgProgress);
        departments = ownerStats.map(owner => owner.department);
        backgroundColors = departments.map(dept => departmentColors[dept] || 'rgba(201, 203, 207, 0.7)');
      }

      // Verificar que tenemos datos válidos
      if (!labels || !data || labels.length === 0 || data.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos disponibles para mostrar', canvas.width / 2, canvas.height / 2);
        return;
      }

      chartInstances.current.globalChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Avance Promedio (%)',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Porcentaje de Avance'
              }
            },
            x: {
              title: {
                display: true,
                text: isDepartmentView ? 'Departamentos' : 'Propietarios'
              },
              ticks: {
                callback: function(value) {
                  const label = this.getLabelForValue(value);
                  return label.length > 15 ? label.substring(0, 15) + '...' : label;
                }
              }
            }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              if (isDepartmentView) {
                const departmentStats = calculateDepartmentStats(objectivesData);
                const department = departmentStats[index].department;
                onDepartmentSelect(department);
              } else {
                const ownerStats = calculateOwnerStats(objectivesData, currentDepartment);
                const owner = ownerStats[index].owner;
                const department = ownerStats[index].department;
                onOwnerSelect(owner, department);
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (isDepartmentView) {
                    return `Avance: ${context.parsed.y}%`;
                  } else {
                    const ownerStats = calculateOwnerStats(objectivesData, currentDepartment);
                    const department = ownerStats[context.dataIndex].department;
                    return `Departamento: ${department}, Avance: ${context.parsed.y}%`;
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al renderizar gráfico global:', error);
      ctx.font = '16px Arial';
      ctx.fillStyle = '#e74c3c';
      ctx.textAlign = 'center';
      ctx.fillText('Error al cargar el gráfico', canvas.width / 2, canvas.height / 2);
    }
  }, [calculateDepartmentStats, calculateOwnerStats]);

  const renderDetailsChart = useCallback((
    canvas,
    objectives,
    selectedOwner,
    selectedDepartment
  ) => {
    if (!ChartInitialized || !Chart) {
      console.warn('Chart.js no está inicializado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (chartInstances.current.detailsChart) {
      chartInstances.current.detailsChart.destroy();
      chartInstances.current.detailsChart = null;
    }

    // Limpiar el canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!objectives || objectives.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos disponibles para mostrar', canvas.width / 2, canvas.height / 2);
      return;
    }

    let labels, data, backgroundColors;

    try {
      if (selectedDepartment) {
        const ownerMap = {};
        objectives.forEach(item => {
          const key = `${item.owner}|${item.department}`;
          if (!ownerMap[key]) {
            ownerMap[key] = {
              owner: item.owner,
              objectives: [],
              totalProgress: 0
            };
          }
          ownerMap[key].objectives.push(item);
          ownerMap[key].totalProgress += item.progress;
        });

        const ownerStats = Object.values(ownerMap).map(ownerData => {
          const avgProgress = ownerData.totalProgress / ownerData.objectives.length;
          return {
            ...ownerData,
            avgProgress: Math.round(avgProgress * 100) / 100
          };
        }).sort((a, b) => b.avgProgress - a.avgProgress);

        labels = ownerStats.map(owner => owner.owner);
        data = ownerStats.map(owner => owner.avgProgress);
        backgroundColors = data.map(progress => {
          if (progress >= 80) return 'rgba(75, 192, 192, 0.7)';
          if (progress >= 50) return 'rgba(255, 205, 86, 0.7)';
          return 'rgba(255, 99, 132, 0.7)';
        });

        chartInstances.current.detailsChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Avance Promedio (%)',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Porcentaje de Avance'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Propietarios'
                }
              }
            }
          }
        });
      } else if (selectedOwner) {
        labels = objectives.map(obj => 
          obj.objective.length > 50 ? 
            obj.objective.substring(0, 50) + '...' : obj.objective
        );
        data = objectives.map(obj => obj.progress);
        backgroundColors = data.map(progress => {
          if (progress >= 80) return 'rgba(75, 192, 192, 0.7)';
          if (progress >= 50) return 'rgba(255, 205, 86, 0.7)';
          return 'rgba(255, 99, 132, 0.7)';
        });

        chartInstances.current.detailsChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Avance (%)',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
              borderWidth: 1
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Porcentaje de Avance'
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  title: function(tooltipItems) {
                    const index = tooltipItems[0].dataIndex;
                    return objectives[index].objective;
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error al renderizar gráfico de detalles:', error);
      ctx.font = '16px Arial';
      ctx.fillStyle = '#e74c3c';
      ctx.textAlign = 'center';
      ctx.fillText('Error al cargar el gráfico', canvas.width / 2, canvas.height / 2);
    }
  }, []);

  // Función para limpiar todos los gráficos
  const cleanupCharts = useCallback(() => {
    Object.values(chartInstances.current).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    chartInstances.current = {};
  }, []);

  return {
    renderGlobalChart,
    renderDetailsChart,
    cleanupCharts
  };
};