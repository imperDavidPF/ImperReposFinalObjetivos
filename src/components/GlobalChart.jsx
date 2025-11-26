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
import { calculateDepartmentStats, calculateOwnerStats, generateDepartmentColors } from '../utils/chartUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const GlobalChart = ({ 
  objectivesData, 
  currentDepartment, 
  isDepartmentView, 
  onDepartmentSelect, 
  onOwnerSelect 
}) => {
  const departments = [...new Set(objectivesData.map(item => item.department))];
  const departmentColors = generateDepartmentColors(departments);

  const getChartData = () => {
    if (isDepartmentView) {
      const departmentStats = calculateDepartmentStats(objectivesData);
      
      return {
        labels: departmentStats.map(dept => dept.department),
        datasets: [
          {
            label: 'Avance Promedio (%)',
            data: departmentStats.map(dept => dept.avgProgress),
            backgroundColor: departmentStats.map(dept => departmentColors[dept.department]),
            borderColor: departmentStats.map(dept => departmentColors[dept.department].replace('0.7', '1')),
            borderWidth: 1,
          },
        ],
      };
    } else {
      const ownerStats = calculateOwnerStats(objectivesData, currentDepartment);
      
      return {
        labels: ownerStats.map(owner => owner.owner),
        datasets: [
          {
            label: 'Avance Promedio (%)',
            data: ownerStats.map(owner => owner.avgProgress),
            backgroundColor: ownerStats.map(owner => departmentColors[owner.department]),
            borderColor: ownerStats.map(owner => departmentColors[owner.department].replace('0.7', '1')),
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const options = {
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
  };

  const chartData = getChartData();

  if (chartData.labels.length === 0) {
    return (
      <div className="chart-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#7f8c8d',
          fontSize: '16px'
        }}>
          No hay datos disponibles para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
};