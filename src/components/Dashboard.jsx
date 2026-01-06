import React, { useState, useCallback, useEffect } from 'react';
import { useExcelData } from '../hooks/useExcelData';
import { SearchSection } from './SearchSection';
import { ExportSection } from './ExportSection';
import { GlobalChart } from './GlobalChart';
import { DetailsSection } from './DetailsSection';
import { CompliancePanel } from './ComliancePanel';
import { jsPDF } from 'jspdf';

export const Dashboard = () => {
  const { objectivesData, loading, error, reloadData } = useExcelData();
  const [currentBoss, setCurrentBoss] = useState('');
  const [isBossView, setIsBossView] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedBoss, setSelectedBoss] = useState(null);

  // Cargar estado guardado al inicializar
  useEffect(() => {
    const savedState = localStorage.getItem('dashboardState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setCurrentBoss(state.currentBoss || '');
        setIsBossView(state.isBossView !== false);
        setSelectedOwner(state.selectedOwner || null);
        setSelectedBoss(state.selectedBoss || null);
      } catch (error) {
        console.error('Error al cargar estado:', error);
      }
    }
  }, []);

  // Guardar estado cuando cambie
  useEffect(() => {
    const state = {
      currentBoss,
      isBossView,
      selectedOwner,
      selectedBoss
    };
    localStorage.setItem('dashboardState', JSON.stringify(state));
  }, [currentBoss, isBossView, selectedOwner, selectedBoss]);

  const bosses = [...new Set(objectivesData.map(item => item.boss))].filter(boss => boss);

  const handleBossFilter = (e) => {
    const boss = e.target.value;
    setCurrentBoss(boss);
    
    if (boss === '') {
      setIsBossView(true);
    } else {
      setIsBossView(false);
    }
    
    // Limpiar selecciones al cambiar filtro
    setSelectedOwner(null);
    setSelectedBoss(null);
  };

  const handleOwnerSelect = (owner, boss, department) => {
    setSelectedOwner({ owner, boss, department });
    setSelectedBoss(null);
    setCurrentBoss(boss);
    setIsBossView(false);
  };

  const handleBossSelect = (boss) => {
    setSelectedBoss(boss);
    setSelectedOwner(null);
    setCurrentBoss(boss);
    setIsBossView(false);
  };

  const handleOwnerSelectFromChart = (owner, boss, department) => {
    setSelectedOwner({ owner, boss, department });
    setSelectedBoss(null);
    setCurrentBoss(boss);
    setIsBossView(false);
  };

  // Nueva función para manejar selección de jefe desde el buscador
  const handleBossSelectFromSearch = (boss) => {
    setCurrentBoss(boss);
    setIsBossView(false);
    setSelectedBoss(boss);
    setSelectedOwner(null);
  };

  const generatePDFReport = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Determinar el jefe para el reporte
      const reportBoss = currentBoss || (selectedBoss ? selectedBoss : 'Todos los Jefes');
      const bossObjectives = currentBoss ? 
        objectivesData.filter(item => item.boss === currentBoss) : 
        objectivesData;

      // ENCABEZADO
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Reporte de Seguimiento de Objetivos', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Jefe Directo: ${reportBoss}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Fuente: Google Sheets - Actualizado automáticamente`, margin, yPosition);
      
      yPosition += 20;

      // INFORMACIÓN RESUMEN DEL JEFE
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Resumen del Equipo', margin, yPosition);
      yPosition += 15;

      // Calcular estadísticas del jefe
      const totalObjectives = bossObjectives.length;
      const totalProgress = bossObjectives.reduce((sum, obj) => sum + obj.progress, 0);
      const avgProgress = totalObjectives > 0 ? totalProgress / totalObjectives : 0;
      
      // Obtener departamentos únicos del jefe
      const bossDepartments = [...new Set(bossObjectives.map(item => item.department))];
      
      // Obtener propietarios únicos del jefe
      const bossOwners = [...new Set(bossObjectives.map(item => item.owner))];
      
      // Calcular estadísticas por departamento del jefe
      const departmentStats = bossDepartments.map(dept => {
        const deptObjectives = bossObjectives.filter(item => item.department === dept);
        const deptProgress = deptObjectives.reduce((sum, obj) => sum + obj.progress, 0);
        const deptAvgProgress = deptObjectives.length > 0 ? deptProgress / deptObjectives.length : 0;
        
        return {
          department: dept,
          avgProgress: deptAvgProgress,
          objectiveCount: deptObjectives.length
        };
      });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(`• Jefe Directo: ${reportBoss}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Total de Objetivos del Equipo: ${totalObjectives}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Total de Personas a Cargo: ${bossOwners.length}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Total de Departamentos: ${bossDepartments.length}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Avance Promedio del Equipo: ${avgProgress.toFixed(2)}%`, margin, yPosition);
      yPosition += 15;

      // ESTADÍSTICAS POR DEPARTAMENTO DEL JEFE
      if (departmentStats.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text('Avance por Departamento:', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        departmentStats.forEach(dept => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(`• ${dept.department}: ${dept.avgProgress.toFixed(2)}% (${dept.objectiveCount} objetivos)`, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      }

      // DETALLE POR PERSONA A CARGO
      if (bossOwners.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text('Detalle por Persona a Cargo:', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        // Calcular estadísticas por persona
        const ownerStats = bossOwners.map(owner => {
          const ownerObjectives = bossObjectives.filter(item => item.owner === owner);
          const ownerProgress = ownerObjectives.reduce((sum, obj) => sum + obj.progress, 0);
          const ownerAvgProgress = ownerObjectives.length > 0 ? ownerProgress / ownerObjectives.length : 0;
          const ownerDepartment = ownerObjectives.length > 0 ? ownerObjectives[0].department : 'N/A';
          
          return {
            owner: owner,
            department: ownerDepartment,
            avgProgress: ownerAvgProgress,
            objectiveCount: ownerObjectives.length,
            objectives: ownerObjectives
          };
        }).sort((a, b) => b.avgProgress - a.avgProgress);

        ownerStats.forEach(owner => {
          // Verificar si necesitamos nueva página
          if (yPosition > 200) {
            pdf.addPage();
            yPosition = 20;
          }

          // Información de la persona
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${owner.owner} (${owner.department})`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`  Avance: ${owner.avgProgress.toFixed(2)}% - ${owner.objectiveCount} objetivos`, margin, yPosition);
          yPosition += 6;

          // Listar objetivos individuales (solo si hay espacio)
          if (yPosition < 250 && owner.objectives.length <= 5) {
            owner.objectives.forEach(obj => {
              if (yPosition > 250) return;
              
              const progressColor = obj.progress >= 80 ? '#2ecc71' : obj.progress >= 50 ? '#f39c12' : '#e74c3c';
              pdf.setTextColor(0, 0, 0);
              pdf.text(`  • ${obj.objective.substring(0, 60)}${obj.objective.length > 60 ? '...' : ''}`, margin + 5, yPosition);
              yPosition += 4;
              
              pdf.setTextColor(progressColor === '#2ecc71' ? 46 : progressColor === '#f39c12' ? 243 : 231, 
                              progressColor === '#2ecc71' ? 204 : progressColor === '#f39c12' ? 156 : 76, 
                              progressColor === '#2ecc71' ? 113 : progressColor === '#f39c12' ? 18 : 60);
              pdf.text(`    ${obj.progress}%`, margin + 10, yPosition);
              yPosition += 4;
              
              pdf.setTextColor(0, 0, 0);
            });
          } else {
            pdf.text(`  (Ver detalles en la aplicación)`, margin + 5, yPosition);
            yPosition += 4;
          }
          
          yPosition += 6; // Espacio entre personas
        });
      }

      // RESUMEN FINAL
      if (yPosition > 220) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Resumen Ejecutivo', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      // Encontrar la persona con mejor y peor avance
      const ownerStats = bossOwners.map(owner => {
        const ownerObjectives = bossObjectives.filter(item => item.owner === owner);
        const ownerProgress = ownerObjectives.reduce((sum, obj) => sum + obj.progress, 0);
        return {
          owner: owner,
          avgProgress: ownerObjectives.length > 0 ? ownerProgress / ownerObjectives.length : 0
        };
      });

      const bestPerformer = ownerStats.reduce((best, current) => 
        current.avgProgress > best.avgProgress ? current : best, 
        { owner: 'N/A', avgProgress: 0 }
      );

      const worstPerformer = ownerStats.reduce((worst, current) => 
        current.avgProgress < worst.avgProgress ? current : worst, 
        { owner: 'N/A', avgProgress: 100 }
      );

      pdf.text(`• Mejor desempeño: ${bestPerformer.owner} (${bestPerformer.avgProgress.toFixed(2)}%)`, margin, yPosition);
      yPosition += 6;
      pdf.text(`• Necesita atención: ${worstPerformer.owner} (${worstPerformer.avgProgress.toFixed(2)}%)`, margin, yPosition);
      yPosition += 6;
      
      // Calcular distribución de avances
      const excellent = ownerStats.filter(o => o.avgProgress >= 80).length;
      const good = ownerStats.filter(o => o.avgProgress >= 50 && o.avgProgress < 80).length;
      const needsImprovement = ownerStats.filter(o => o.avgProgress < 50).length;

      pdf.text(`• Excelente (≥80%): ${excellent} personas`, margin, yPosition);
      yPosition += 6;
      pdf.text(`• Bueno (50-79%): ${good} personas`, margin, yPosition);
      yPosition += 6;
      pdf.text(`• Necesita mejora (<50%): ${needsImprovement} personas`, margin, yPosition);
      yPosition += 10;

      // PIE DE PÁGINA
      const footerY = pdf.internal.pageSize.getHeight() - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(127, 140, 141);
      pdf.text('Reporte generado automáticamente - Sistema de Seguimiento de Objetivos - Datos desde Google Sheets', margin, footerY);
      
      const fileName = `Reporte_${reportBoss.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el reporte PDF: ' + error.message);
    }
  };

  const handleReloadData = () => {
    reloadData();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="status-section">
          <div className="status-message loading">
            Cargando datos desde Google Sheets...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="status-section">
          <div className="status-message error">
            Error al cargar desde Google Sheets: {error}
            <button onClick={handleReloadData} style={{marginLeft: '10px', padding: '5px 10px'}}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="status-section">
        <div className="status-message success">
          ✓ Datos cargados correctamente desde Google Sheets
          <button onClick={handleReloadData} style={{marginLeft: '10px', padding: '5px 10px', fontSize: '12px'}}>
            Actualizar Datos
          </button>
        </div>
      </div>

      <SearchSection 
        objectivesData={objectivesData}
        onOwnerSelect={handleOwnerSelect}
        onBossSelect={handleBossSelectFromSearch}
      />

      <ExportSection onGeneratePDF={generatePDFReport} />

      <div className="dashboard">
        <div className="card full-width-chart">
          <h2>
            {isBossView 
              ? 'Gráfico de Avance por Jefe Directo' 
              : `Gráfico de Avance - ${currentBoss || selectedBoss || 'Equipo'}`
            }
          </h2>
          <div className="boss-filter">
            <label htmlFor="bossSelect">Filtrar por Jefe Directo:</label>
            <select 
              id="bossSelect" 
              value={currentBoss}
              onChange={handleBossFilter}
            >
              <option value="">Todos los jefes</option>
              {bosses.map(boss => (
                <option key={boss} value={boss}>{boss}</option>
              ))}
            </select>
          </div>
          <GlobalChart 
            objectivesData={objectivesData}
            currentBoss={currentBoss}
            isBossView={isBossView}
            onBossSelect={handleBossSelect}
            onOwnerSelect={handleOwnerSelectFromChart}
          />
        </div>

        <CompliancePanel 
          objectivesData={objectivesData}
          currentBoss={currentBoss || (selectedBoss ? selectedBoss : '')}
        />
      </div>

      <div className="details-section">
        <DetailsSection 
          selectedOwner={selectedOwner}
          selectedBoss={selectedBoss}
          objectivesData={objectivesData}
        />
      </div>
    </div>
  );
};