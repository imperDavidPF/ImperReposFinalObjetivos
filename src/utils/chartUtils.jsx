export const generateDepartmentColors = (departments) => {
  const colors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 205, 86, 0.7)',
    'rgba(201, 203, 207, 0.7)',
    'rgba(0, 128, 128, 0.7)',
    'rgba(128, 0, 128, 0.7)',
    'rgba(128, 128, 0, 0.7)'
  ];
  
  const departmentColors = {};
  departments.forEach((dept, index) => {
    departmentColors[dept] = colors[index % colors.length];
  });
  
  return departmentColors;
};

export const calculateDepartmentStats = (objectivesData) => {
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
};

export const calculateOwnerStats = (objectivesData, currentDepartment = '') => {
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
};

export const getUniqueOwners = (objectivesData) => {
  const ownerMap = {};
  objectivesData.forEach(item => {
    const key = `${item.owner}|${item.department}`;
    if (!ownerMap[key]) {
      ownerMap[key] = {
        name: item.owner,
        department: item.department,
        objectiveCount: 0
      };
    }
    ownerMap[key].objectiveCount++;
  });
  
  return Object.values(ownerMap);
};