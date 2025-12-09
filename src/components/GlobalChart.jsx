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
import { calculateBossStats, calculateOwnerStatsByBoss, generateBossColors } from '../utils/chartUtils';

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
  currentBoss, 
  isBossView, 
  onBossSelect, 
  onOwnerSelect 
}) => {
  const bosses = [...new Set(objectivesData.map(item => item.boss))].filter(boss => boss);
  const bossColors = generateBossColors(bosses);

  const getChartData = () => {
    if (isBossView) {
      const bossStats = calculateBossStats(objectivesData);
      
      return {
        labels: bossStats.map(boss => boss.boss),
        datasets: [
          {
            label: 'Avance Promedio (%)',
            data: bossStats.map(boss => boss.avgProgress),
            backgroundColor: bossStats.map(boss => bossColors[boss.boss]),
            borderColor: bossStats.map(boss => bossColors[boss.boss].replace('0.7', '1')),
            borderWidth: 1,
          },
        ],
      };
    } else {
      const ownerStats = calculateOwnerStatsByBoss(objectivesData, currentBoss);
      
      return {
        labels: ownerStats.map(owner => owner.owner),
        datasets: [
          {
            label: 'Avance Promedio (%)',
            data: ownerStats.map(owner => owner.avgProgress),
            backgroundColor: ownerStats.map(owner => bossColors[owner.boss]),
            borderColor: ownerStats.map(owner => bossColors[owner.boss].replace('0.7', '1')),
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
          text: isBossView ? 'Jefes Directos' : 'Propietarios'
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
        
        if (isBossView) {
          const bossStats = calculateBossStats(objectivesData);
          const boss = bossStats[index].boss;
          onBossSelect(boss);
        } else {
          const ownerStats = calculateOwnerStatsByBoss(objectivesData, currentBoss);
          const owner = ownerStats[index].owner;
          const boss = ownerStats[index].boss;
          const department = ownerStats[index].department;
          onOwnerSelect(owner, boss, department);
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            if (isBossView) {
              return `Avance: ${context.parsed.y}%`;
            } else {
              const ownerStats = calculateOwnerStatsByBoss(objectivesData, currentBoss);
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