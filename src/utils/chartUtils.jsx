// Funciones de utilidad para gráficos y búsqueda

// ==============================
// FUNCIONES PARA GRÁFICOS
// ==============================

/**
 * Genera colores únicos para cada jefe directo
 * @param {Array} bosses - Lista de nombres de jefes
 * @returns {Object} Mapa de colores por jefe
 */
export const generateBossColors = (bosses) => {
  const colors = [
    'rgba(54, 162, 235, 0.7)',   // Azul
    'rgba(255, 99, 132, 0.7)',   // Rojo
    'rgba(75, 192, 192, 0.7)',   // Verde agua
    'rgba(255, 159, 64, 0.7)',   // Naranja
    'rgba(153, 102, 255, 0.7)',  // Morado
    'rgba(255, 205, 86, 0.7)',   // Amarillo
    'rgba(201, 203, 207, 0.7)',  // Gris
    'rgba(255, 99, 71, 0.7)',    // Tomate
    'rgba(50, 205, 50, 0.7)',    // Verde lima
    'rgba(138, 43, 226, 0.7)',   // Violeta
    'rgba(70, 130, 180, 0.7)',   // Azul acero
    'rgba(210, 105, 30, 0.7)',   // Chocolate
    'rgba(0, 128, 128, 0.7)',    // Verde azulado
    'rgba(186, 85, 211, 0.7)',   // Orquídea
    'rgba(220, 20, 60, 0.7)',    // Carmesí
  ];

  const bossColors = {};
  bosses.forEach((boss, index) => {
    bossColors[boss] = colors[index % colors.length];
  });

  return bossColors;
};

/**
 * Calcula estadísticas de avance por jefe directo
 * @param {Array} objectivesData - Datos de objetivos
 * @returns {Array} Estadísticas por jefe
 */
export const calculateBossStats = (objectivesData) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }

  const bossMap = {};

  objectivesData.forEach(item => {
    if (item.boss) {
      if (!bossMap[item.boss]) {
        bossMap[item.boss] = {
          boss: item.boss,
          objectives: [],
          totalProgress: 0,
          departmentCount: 0,
          departments: new Set(),
          ownerCount: 0,
          owners: new Set()
        };
      }
      
      bossMap[item.boss].objectives.push(item);
      bossMap[item.boss].totalProgress += item.progress;
      bossMap[item.boss].departments.add(item.department);
      bossMap[item.boss].owners.add(item.owner);
    }
  });

  // Convertir Sets a números
  const bossStats = Object.values(bossMap).map(bossData => {
    const avgProgress = bossData.objectives.length > 0 
      ? bossData.totalProgress / bossData.objectives.length 
      : 0;
    
    return {
      boss: bossData.boss,
      avgProgress: Math.round(avgProgress * 100) / 100,
      objectiveCount: bossData.objectives.length,
      departmentCount: bossData.departments.size,
      ownerCount: bossData.owners.size,
      totalProgress: bossData.totalProgress
    };
  });

  return bossStats.sort((a, b) => b.avgProgress - a.avgProgress);
};

/**
 * Calcula estadísticas de propietarios filtrados por jefe
 * @param {Array} objectivesData - Datos de objetivos
 * @param {string} currentBoss - Jefe actual para filtrar
 * @returns {Array} Estadísticas de propietarios
 */
export const calculateOwnerStatsByBoss = (objectivesData, currentBoss) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }

  const filteredData = currentBoss
    ? objectivesData.filter(item => item.boss === currentBoss)
    : objectivesData;

  const ownerMap = {};

  filteredData.forEach(item => {
    const key = `${item.owner}|${item.department}`;

    if (!ownerMap[key]) {
      ownerMap[key] = {
        owner: item.owner,
        boss: item.boss,
        department: item.department,
        objectives: [],
        totalProgress: 0,
        lastObjective: null
      };
    }

    ownerMap[key].objectives.push(item);
    ownerMap[key].totalProgress += item.progress;
    ownerMap[key].lastObjective = item.objective; // Para referencia
  });

  const ownerStats = Object.values(ownerMap).map(ownerData => {
    const avgProgress = ownerData.objectives.length > 0 
      ? ownerData.totalProgress / ownerData.objectives.length 
      : 0;
    
    return {
      owner: ownerData.owner,
      boss: ownerData.boss,
      department: ownerData.department,
      avgProgress: Math.round(avgProgress * 100) / 100,
      objectiveCount: ownerData.objectives.length,
      totalProgress: ownerData.totalProgress,
      progressStatus: getProgressStatus(avgProgress)
    };
  });

  return ownerStats.sort((a, b) => b.avgProgress - a.avgProgress);
};

/**
 * Calcula estadísticas por departamento
 * @param {Array} objectivesData - Datos de objetivos
 * @returns {Array} Estadísticas por departamento
 */
export const calculateDepartmentStats = (objectivesData) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }

  const departmentMap = {};

  objectivesData.forEach(item => {
    const dept = item.department || 'Sin departamento';
    
    if (!departmentMap[dept]) {
      departmentMap[dept] = {
        department: dept,
        objectives: [],
        totalProgress: 0,
        bossCount: 0,
        bosses: new Set(),
        ownerCount: 0,
        owners: new Set()
      };
    }
    
    departmentMap[dept].objectives.push(item);
    departmentMap[dept].totalProgress += item.progress;
    departmentMap[dept].bosses.add(item.boss);
    departmentMap[dept].owners.add(item.owner);
  });

  const departmentStats = Object.values(departmentMap).map(deptData => {
    const avgProgress = deptData.objectives.length > 0 
      ? deptData.totalProgress / deptData.objectives.length 
      : 0;
    
    return {
      department: deptData.department,
      avgProgress: Math.round(avgProgress * 100) / 100,
      objectiveCount: deptData.objectives.length,
      bossCount: deptData.bosses.size,
      ownerCount: deptData.owners.size,
      totalProgress: deptData.totalProgress
    };
  });

  return departmentStats.sort((a, b) => b.avgProgress - a.avgProgress);
};

// ==============================
// FUNCIONES PARA BÚSQUEDA
// ==============================

/**
 * Obtiene propietarios únicos para el buscador
 * @param {Array} objectivesData - Datos de objetivos
 * @returns {Array} Propietarios únicos con información
 */
export const getUniqueOwners = (objectivesData) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }
  
  const ownerMap = {};
  
  objectivesData.forEach(item => {
    const key = `${item.owner}|${item.boss}|${item.department}`;
    
    if (!ownerMap[key]) {
      ownerMap[key] = {
        name: item.owner,
        boss: item.boss,
        department: item.department,
        objectiveCount: 0,
        totalProgress: 0,
        lastObjective: item.objective
      };
    }
    
    ownerMap[key].objectiveCount++;
    ownerMap[key].totalProgress += item.progress;
  });
  
  const owners = Object.values(ownerMap).map(owner => {
    const avgProgress = owner.objectiveCount > 0 
      ? owner.totalProgress / owner.objectiveCount 
      : 0;
    
    return {
      ...owner,
      avgProgress: Math.round(avgProgress * 100) / 100,
      progressStatus: getProgressStatus(avgProgress)
    };
  });
  
  return owners.sort((a, b) => b.avgProgress - a.avgProgress);
};

/**
 * Obtiene jefes únicos para el buscador
 * @param {Array} objectivesData - Datos de objetivos
 * @returns {Array} Jefes únicos con información
 */
export const getUniqueBosses = (objectivesData) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }
  
  const bossMap = {};
  
  objectivesData.forEach(item => {
    if (item.boss) {
      if (!bossMap[item.boss]) {
        bossMap[item.boss] = {
          name: item.boss,
          objectiveCount: 0,
          totalProgress: 0,
          departments: new Set(),
          owners: new Set(),
          objectivesList: []
        };
      }
      
      bossMap[item.boss].objectiveCount++;
      bossMap[item.boss].totalProgress += item.progress;
      bossMap[item.boss].departments.add(item.department);
      bossMap[item.boss].owners.add(item.owner);
      
      // Guardar algunos objetivos de ejemplo (máximo 3)
      if (bossMap[item.boss].objectivesList.length < 3) {
        bossMap[item.boss].objectivesList.push(item.objective);
      }
    }
  });
  
  const bosses = Object.values(bossMap).map(boss => {
    const avgProgress = boss.objectiveCount > 0 
      ? boss.totalProgress / boss.objectiveCount 
      : 0;
    
    return {
      name: boss.name,
      objectiveCount: boss.objectiveCount,
      departmentCount: boss.departments.size,
      ownerCount: boss.owners.size,
      avgProgress: Math.round(avgProgress * 100) / 100,
      totalProgress: boss.totalProgress,
      sampleObjectives: boss.objectivesList,
      progressStatus: getProgressStatus(avgProgress)
    };
  });
  
  return bosses.sort((a, b) => b.avgProgress - a.avgProgress);
};

/**
 * Busca en todos los campos (propietarios, jefes, departamentos)
 * @param {Array} objectivesData - Datos de objetivos
 * @param {string} query - Término de búsqueda
 * @returns {Object} Resultados categorizados
 */
export const searchAllFields = (objectivesData, query) => {
  if (!objectivesData || objectivesData.length === 0 || !query || query.trim().length < 2) {
    return { owners: [], bosses: [], departments: [] };
  }
  
  const searchTerm = query.trim().toLowerCase();
  const owners = getUniqueOwners(objectivesData);
  const bosses = getUniqueBosses(objectivesData);
  const departments = calculateDepartmentStats(objectivesData);
  
  // Buscar propietarios
  const ownerResults = owners.filter(owner => 
    owner.name.toLowerCase().includes(searchTerm) || 
    owner.boss.toLowerCase().includes(searchTerm) ||
    owner.department.toLowerCase().includes(searchTerm)
  );
  
  // Buscar jefes
  const bossResults = bosses.filter(boss => 
    boss.name.toLowerCase().includes(searchTerm)
  );
  
  // Buscar departamentos
  const departmentResults = departments.filter(dept => 
    dept.department.toLowerCase().includes(searchTerm)
  );
  
  return {
    owners: ownerResults.slice(0, 10), // Limitar a 10 resultados
    bosses: bossResults.slice(0, 10),
    departments: departmentResults.slice(0, 10)
  };
};

// ==============================
// FUNCIONES DE FORMATO Y UTILIDAD
// ==============================

/**
 * Obtiene el estado del progreso para colores y etiquetas
 * @param {number} progress - Porcentaje de avance
 * @returns {Object} Información de estado
 */
export const getProgressStatus = (progress) => {
  if (progress >= 80) {
    return {
      level: 'excellent',
      label: 'Excelente',
      color: '#2ecc71',
      bgColor: 'rgba(46, 204, 113, 0.1)',
      icon: '✅'
    };
  } else if (progress >= 50) {
    return {
      level: 'good',
      label: 'Bueno',
      color: '#f39c12',
      bgColor: 'rgba(243, 156, 18, 0.1)',
      icon: '⚠️'
    };
  } else {
    return {
      level: 'needs_improvement',
      label: 'Necesita mejora',
      color: '#e74c3c',
      bgColor: 'rgba(231, 76, 60, 0.1)',
      icon: '❌'
    };
  }
};

/**
 * Formatea un nombre largo para mostrarlo en gráficos
 * @param {string} name - Nombre a formatear
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Nombre formateado
 */
export const formatChartLabel = (name, maxLength = 20) => {
  if (!name) return '';
  
  if (name.length <= maxLength) {
    return name;
  }
  
  const parts = name.split(' ');
  let result = '';
  
  for (const part of parts) {
    if (result.length + part.length + 1 <= maxLength - 3) {
      result += (result ? ' ' : '') + part;
    } else {
      break;
    }
  }
  
  return result + '...';
};

/**
 * Obtiene estadísticas generales del dashboard
 * @param {Array} objectivesData - Datos de objetivos
 * @returns {Object} Estadísticas generales
 */
export const getDashboardStats = (objectivesData) => {
  if (!objectivesData || objectivesData.length === 0) {
    return {
      totalObjectives: 0,
      totalBosses: 0,
      totalDepartments: 0,
      totalOwners: 0,
      overallProgress: 0,
      bossStats: [],
      departmentStats: []
    };
  }
  
  const totalObjectives = objectivesData.length;
  const totalProgress = objectivesData.reduce((sum, obj) => sum + obj.progress, 0);
  const overallProgress = totalObjectives > 0 ? totalProgress / totalObjectives : 0;
  
  const bosses = [...new Set(objectivesData.map(item => item.boss))].filter(boss => boss);
  const departments = [...new Set(objectivesData.map(item => item.department))].filter(dept => dept);
  const owners = [...new Set(objectivesData.map(item => item.owner))].filter(owner => owner);
  
  const bossStats = calculateBossStats(objectivesData);
  const departmentStats = calculateDepartmentStats(objectivesData);
  
  return {
    totalObjectives,
    totalBosses: bosses.length,
    totalDepartments: departments.length,
    totalOwners: owners.length,
    overallProgress: Math.round(overallProgress * 100) / 100,
    bossStats,
    departmentStats,
    progressStatus: getProgressStatus(overallProgress)
  };
};

/**
 * Filtra datos por múltiples criterios
 * @param {Array} objectivesData - Datos de objetivos
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} Datos filtrados
 */
export const filterObjectives = (objectivesData, filters = {}) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }
  
  let filteredData = [...objectivesData];
  
  // Filtrar por jefe
  if (filters.boss) {
    filteredData = filteredData.filter(item => item.boss === filters.boss);
  }
  
  // Filtrar por departamento
  if (filters.department) {
    filteredData = filteredData.filter(item => item.department === filters.department);
  }
  
  // Filtrar por propietario
  if (filters.owner) {
    filteredData = filteredData.filter(item => item.owner === filters.owner);
  }
  
  // Filtrar por rango de progreso
  if (filters.minProgress !== undefined) {
    filteredData = filteredData.filter(item => item.progress >= filters.minProgress);
  }
  
  if (filters.maxProgress !== undefined) {
    filteredData = filteredData.filter(item => item.progress <= filters.maxProgress);
  }
  
  // Filtrar por estado de progreso
  if (filters.progressStatus) {
    filteredData = filteredData.filter(item => {
      const status = getProgressStatus(item.progress);
      return status.level === filters.progressStatus;
    });
  }
  
  return filteredData;
};

/**
 * Obtiene los objetivos más críticos (bajo progreso)
 * @param {Array} objectivesData - Datos de objetivos
 * @param {number} limit - Límite de resultados
 * @returns {Array} Objetivos críticos
 */
export const getCriticalObjectives = (objectivesData, limit = 10) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }
  
  return [...objectivesData]
    .filter(obj => obj.progress < 50)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, limit)
    .map(obj => ({
      ...obj,
      progressStatus: getProgressStatus(obj.progress)
    }));
};

/**
 * Obtiene los objetivos destacados (alto progreso)
 * @param {Array} objectivesData - Datos de objetivos
 * @param {number} limit - Límite de resultados
 * @returns {Array} Objetivos destacados
 */
export const getTopObjectives = (objectivesData, limit = 10) => {
  if (!objectivesData || objectivesData.length === 0) {
    return [];
  }
  
  return [...objectivesData]
    .filter(obj => obj.progress >= 80)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit)
    .map(obj => ({
      ...obj,
      progressStatus: getProgressStatus(obj.progress)
    }));
};

export default {
  generateBossColors,
  calculateBossStats,
  calculateOwnerStatsByBoss,
  calculateDepartmentStats,
  getUniqueOwners,
  getUniqueBosses,
  searchAllFields,
  getProgressStatus,
  formatChartLabel,
  getDashboardStats,
  filterObjectives,
  getCriticalObjectives,
  getTopObjectives
};