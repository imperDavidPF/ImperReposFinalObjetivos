import React from 'react';

export const ExportSection = ({ onGeneratePDF }) => {
  return (
    <div className="export-section">
      <div className="card">
        <div className="export-container">
          <button 
            id="downloadPDF" 
            className="export-button"
            onClick={onGeneratePDF}
          >
            📊 Descargar Reporte Completo PDF
          </button>
          <div className="export-info">
            <small>Incluye todos los gráficos y tablas actuales</small>
          </div>
        </div>
      </div>
    </div>
  );
};