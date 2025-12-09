import { useState, useEffect } from 'react';

export const useExcelData = () => {
  const [objectivesData, setObjectivesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseTSVData = (tsvText) => {
    try {
      const lines = tsvText.split(/\r?\n/).filter(line => line.trim());
      console.log('Líneas TSV encontradas:', lines.length);
      
      if (lines.length < 2) {
        return [];
      }

      const data = [];
      
      // Procesar desde la segunda línea (saltar encabezados)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Dividir por tabulador
        const rowData = line.split('\t').map(cell => cell.trim());
        
        if (rowData.length >= 5) {
          const boss = rowData[0] || '';
          const department = rowData[1] || '';
          const owner = rowData[2] || '';
          const objective = rowData[3] || '';
          
          // Procesar el progreso
          let progress = 0;
          const progressText = rowData[4] || '0';
          if (progressText) {
            const cleanProgress = progressText.replace('%', '').replace(',', '.').trim();
            progress = parseFloat(cleanProgress) || 0;
          }

          // Validar datos mínimos
          if (boss && department && owner && objective && !isNaN(progress)) {
            data.push({
              boss,
              department,
              owner,
              objective,
              progress: Math.min(100, Math.max(0, progress))
            });
          }
        }
      }
      
      console.log(`Datos TSV procesados: ${data.length} registros`);
      return data;
      
    } catch (error) {
      console.error('Error procesando TSV:', error);
      return [];
    }
  };

  const loadFromGoogleSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIVFB72FWhTL8ftl-rmYtvOyxqobGAW9Q_laq4g6SwThLN1pEgphDxjSsAwfs62w/pub?output=tsv';
      
      console.log('Cargando datos desde Google Sheets (TSV)...');
      const response = await fetch(tsvUrl);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const tsvText = await response.text();
      const parsedData = parseTSVData(tsvText);
      
      if (parsedData.length === 0) {
        throw new Error('No se pudieron procesar los datos del archivo');
      }
      
      setObjectivesData(parsedData);
      console.log('Datos cargados exitosamente:', parsedData.length, 'registros');
      
    } catch (err) {
      console.error('Error al cargar desde Google Sheets:', err);
      setError(`Error: ${err.message}`);
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    console.log('Cargando datos de muestra...');
    const sampleData = [
      { boss: "FRANCISCO JAVIER VALENZUELA", department: "INGENIERIA Y DESARROLLO (50000017)", owner: "CLAUDIA VIVEROS", objective: "Alimentar al 100% la información necesaria en tiempo y forma en las plataformas (SAP, Fuerza de Ventas, Rendimiento y objetivos)", progress: 98 },
      { boss: "FRANCISCO JAVIER VALENZUELA", department: "INGENIERIA Y DESARROLLO (50000017)", owner: "CLAUDIA VIVEROS", objective: "Asegurar el cumplimiento de las capacitaciones técnicas en I+D APER del 75 al 90% a diciembre 2025", progress: 99 },
      { boss: "RAMON REYES", department: "OPERACIONES (50000010)", owner: "JESUS ALBERTO FERNANDEZ", objective: "Implementar tecnologías de industria 4.0 de 0% al 40% de nuestros procesos productivos", progress: 92 },
      { boss: "RAMON REYES", department: "OPERACIONES (50000010)", owner: "JESUS ALBERTO FERNANDEZ", objective: "Incrementar el conocimiento del 62 al 80 % de procedimientos e instrucciones de trabajo", progress: 100 }
    ];
    
    setObjectivesData(sampleData);
    console.log('Datos de muestra cargados:', sampleData.length, 'registros');
  };

  useEffect(() => {
    loadFromGoogleSheets();
  }, []);

  return { 
    objectivesData, 
    loading, 
    error, 
    reloadData: loadFromGoogleSheets 
  };
};