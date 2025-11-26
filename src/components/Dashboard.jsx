import React, { useState, useCallback, useEffect } from 'react';
import { useExcelData } from '../hooks/useExcelData';

import {SearchSection} from './SearchSection';
import {ExportSection} from './ExportSection';
import {GlobalChart} from './GlobalChart';
import {DetailsSection} from './DetailsSection';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CompliancePanel } from './ComliancePanel';
 
export const Dashboard = () => {
  const { objectivesData, loading, error, reloadData } = useExcelData();
  const [currentDepartment, setCurrentDepartment] = useState('');
  const [isDepartmentView, setIsDepartmentView] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Cargar estado guardado al inicializar
  useEffect(() => {
    const savedState = localStorage.getItem('dashboardState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setCurrentDepartment(state.currentDepartment || '');
        setIsDepartmentView(state.isDepartmentView !== false);
        setSelectedOwner(state.selectedOwner || null);
        setSelectedDepartment(state.selectedDepartment || null);
      } catch (error) {
        console.error('Error al cargar estado:', error);
      }
    }
  }, []);

  // Guardar estado cuando cambie
  useEffect(() => {
    const state = {
      currentDepartment,
      isDepartmentView,
      selectedOwner,
      selectedDepartment
    };
    localStorage.setItem('dashboardState', JSON.stringify(state));
  }, [currentDepartment, isDepartmentView, selectedOwner, selectedDepartment]);

  const departments = [...new Set(objectivesData.map(item => item.department))];

  const handleDepartmentFilter = (e) => {
    const department = e.target.value;
    setCurrentDepartment(department);
    
    if (department === '') {
      setIsDepartmentView(true);
    } else {
      setIsDepartmentView(false);
    }
    
    // Limpiar selecciones al cambiar filtro
    setSelectedOwner(null);
    setSelectedDepartment(null);
  };

  const handleOwnerSelect = (owner, department) => {
    setSelectedOwner({ owner, department });
    setSelectedDepartment(null);
    setCurrentDepartment(department);
    setIsDepartmentView(false);
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setSelectedOwner(null);
  };

  const handleOwnerSelectFromChart = (owner, department) => {
    setSelectedOwner({ owner, department });
    setSelectedDepartment(null);
  };

  const generatePDFReport = async () => {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Encabezado
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Reporte de Seguimiento de Objetivos', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition);
      pdf.text(`Fuente: Google Sheets - Actualizado automáticamente`, margin, yPosition + 6);
      
      yPosition += 20;
      
      // Información resumen
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('Resumen Ejecutivo', margin, yPosition);
      yPosition += 15;
      
      const totalObjectives = objectivesData.length;
      const totalDepartments = departments.length;
      const totalOwners = [...new Set(objectivesData.map(item => item.owner))].length;
      const avgProgress = objectivesData.reduce((sum, obj) => sum + obj.progress, 0) / totalObjectives;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(`• Total de Objetivos: ${totalObjectives}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Total de Departamentos: ${totalDepartments}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Total de Propietarios: ${totalOwners}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`• Avance Promedio General: ${avgProgress.toFixed(2)}%`, margin, yPosition);
      yPosition += 20;
      
      // Pie de página
      const footerY = pdf.internal.pageSize.getHeight() - 15;
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      pdf.text('Reporte generado automáticamente - Sistema de Seguimiento de Objetivos - Datos desde Google Sheets', margin, footerY);
      
      const fileName = `Reporte_Objetivos_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el reporte PDF: ' + error.message);
    }
  };

  const handleReloadData = () => {
    reloadData();
    // NO limpiar selecciones al recargar para mantener el estado
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
      />

      <ExportSection onGeneratePDF={generatePDFReport} />

      <div className="dashboard">
        <div className="card full-width-chart">
          <h2>
            {isDepartmentView 
              ? 'Gráfico de Avance por Departamento' 
              : `Gráfico de Avance - ${currentDepartment}`
            }
          </h2>
          <div className="department-filter">
            <label htmlFor="departmentSelect">Filtrar por Departamento:</label>
            <select 
              id="departmentSelect" 
              value={currentDepartment}
              onChange={handleDepartmentFilter}
            >
              <option value="">Todos los departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <GlobalChart 
            objectivesData={objectivesData}
            currentDepartment={currentDepartment}
            isDepartmentView={isDepartmentView}
            onDepartmentSelect={handleDepartmentSelect}
            onOwnerSelect={handleOwnerSelectFromChart}
          />
        </div>

        <CompliancePanel 
          objectivesData={objectivesData}
          currentDepartment={currentDepartment}
        />
      </div>

      <div className="details-section">
        <DetailsSection 
          selectedOwner={selectedOwner}
          selectedDepartment={selectedDepartment}
          objectivesData={objectivesData}
        />
      </div>
    </div>
  );
};