export const CompliancePanel = ({ objectivesData, currentBoss }) => {
  const calculateCompliance = () => {
    let filteredObjectives = objectivesData;
    if (currentBoss) {
      filteredObjectives = objectivesData.filter(item => item.boss === currentBoss);
    }
    
    const total = filteredObjectives.length;
    const totalProgress = filteredObjectives.reduce((sum, obj) => sum + obj.progress, 0);
    const avgCompliance = total > 0 ? Math.round((totalProgress / total) * 100) / 100 : 0;
    
    return {
      value: avgCompliance,
      boss: currentBoss || 'Todos los Jefes Directos'
    };
  };

  const compliance = calculateCompliance();
  const backgroundColor = compliance.value >= 80 ? 
    'linear-gradient(135deg, #2ecc71, #27ae60)' : 
    compliance.value >= 50 ? 
    'linear-gradient(135deg, #f39c12, #e67e22)' : 
    'linear-gradient(135deg, #e74c3c, #c0392b)';

  return (
    <div className="compliance-panel">
      <div className="compliance-card" style={{ background: backgroundColor }}>
        <div className="compliance-label">Cumplimiento del Jefe Directo</div>
        <div className="compliance-value">{compliance.value}%</div>
        <div>{compliance.boss}</div>
      </div>
    </div>
  );
};