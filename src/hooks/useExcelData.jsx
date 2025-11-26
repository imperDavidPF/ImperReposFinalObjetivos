import { useState, useEffect } from 'react';

export const useExcelData = () => {
  const [objectivesData, setObjectivesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseHTMLTable = (htmlText) => {
    try {
      console.log('Procesando HTML...');
      
      // Crear un parser de HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      // Buscar TODAS las tablas en el HTML
      const tables = doc.querySelectorAll('table');
      console.log('Tablas encontradas:', tables.length);
      
      if (tables.length === 0) {
        // Intentar buscar de otras formas
        const allTables = doc.getElementsByTagName('table');
        console.log('Tablas por tag name:', allTables.length);
        throw new Error('No se encontraron tablas en el HTML');
      }

      // Usar la primera tabla que encontremos
      const table = tables[0];
      const rows = table.querySelectorAll('tr');
      console.log('Filas encontradas:', rows.length);

      if (rows.length < 2) {
        throw new Error('No hay suficientes filas en la tabla');
      }

      const data = [];
      
      // Procesar filas (empezando desde la primera para incluir encabezados si es necesario)
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td, th');
        console.log(`Fila ${i}, celdas:`, cells.length);
        
        if (cells.length >= 4) {
          const department = cells[0]?.textContent?.trim() || '';
          const owner = cells[1]?.textContent?.trim() || '';
          const objective = cells[2]?.textContent?.trim() || '';
          
          // Saltar la fila de encabezados si contiene "Departamento"
          if (department.toLowerCase().includes('departamento') || 
              owner.toLowerCase().includes('propietario')) {
            console.log('Saltando fila de encabezados');
            continue;
          }
          
          // Procesar el progreso
          let progress = 0;
          const progressText = cells[3]?.textContent?.trim() || '0';
          if (progressText && progressText !== 'Realizacion') {
            const cleanProgress = progressText.replace('%', '').replace(',', '.').trim();
            progress = parseFloat(cleanProgress) || 0;
          }

          // Validar datos mínimos (excluir filas vacías o de encabezados)
          if (department && owner && objective && !isNaN(progress) && 
              !department.toLowerCase().includes('departamento')) {
            data.push({
              department,
              owner,
              objective,
              progress: Math.min(100, Math.max(0, progress))
            });
          }
        }
      }
      
      console.log(`Datos procesados: ${data.length} registros válidos`);
      console.log('Primeros registros:', data.slice(0, 3));
      return data;
      
    } catch (error) {
      console.error('Error parsing HTML table:', error);
      return [];
    }
  };

  const loadFromGoogleSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // URL alternativa - usar la versión TSV que es más confiable
      const tsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIVFB72FWhTL8ftl-rmYtvOyxqobGAW9Q_laq4g6SwThLN1pEgphDxjSsAwfs62w/pub?output=tsv';
      
      console.log('Cargando datos desde Google Sheets (TSV)...');
      const response = await fetch(tsvUrl);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const tsvText = await response.text();
      console.log('Datos TSV recibidos:', tsvText.substring(0, 500));
      
      // Procesar como TSV en lugar de HTML
      const parsedData = parseTSVData(tsvText);
      
      if (parsedData.length === 0) {
        throw new Error('No se pudieron procesar los datos del archivo');
      }
      
      setObjectivesData(parsedData);
      console.log('Datos cargados exitosamente:', parsedData.length, 'registros');
      
    } catch (err) {
      console.error('Error al cargar desde Google Sheets:', err);
      setError(`Error: ${err.message}`);
      // Cargar datos de muestra como respaldo
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

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
        console.log(`Fila ${i}:`, rowData);
        
        if (rowData.length >= 4) {
          const department = rowData[0] || '';
          const owner = rowData[1] || '';
          const objective = rowData[2] || '';
          
          // Procesar el progreso
          let progress = 0;
          const progressText = rowData[3] || '0';
          if (progressText) {
            const cleanProgress = progressText.replace('%', '').replace(',', '.').trim();
            progress = parseFloat(cleanProgress) || 0;
          }

          // Validar datos mínimos
          if (department && owner && objective && !isNaN(progress)) {
            data.push({
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

  const loadSampleData = () => {
    console.log('Cargando datos de muestra...');
    const sampleData = [
      { department: "ACTIVOS INMOBILIARIOS Y SERVICIOS (50000018)", owner: "JOSE EVERARDO ROSALES", objective: "Actualizar y/o implementar procesos para el área de servicios en un 100%", progress: 100 },
      { department: "ACTIVOS INMOBILIARIOS Y SERVICIOS (50000018)", owner: "JOSE EVERARDO ROSALES", objective: "Adquirir el 100% del conocimiento adquirido en los cursos programados", progress: 100 },
      { department: "ACTIVOS INMOBILIARIOS Y SERVICIOS (50000018)", owner: "JOSE EVERARDO ROSALES", objective: "Atender de manera oportuna el 100% de los requerimientos, cuestión de mantenimientos de edificios, vehículos y sus permisos correspondientes", progress: 100 },
      { department: "ACTIVOS INMOBILIARIOS Y SERVICIOS (50000018)", owner: "JOSE EVERARDO ROSALES", objective: "Reducción a un 85% de solicitud de anticipos, para seguir el proceso interno y no afectar el presupuesto", progress: 97 },
      { department: "ADMINISTRACION Y FINANZAS (50000001)", owner: "ARMANDO TEOYOTL", objective: "Asegurar al 90% la efectividad de la verificación a los embarques, al 30 de Junio de 2025", progress: 100 },
      { department: "ADMINISTRACION Y FINANZAS (50000001)", owner: "ARMANDO TEOYOTL", objective: "Dominio del 100% de los procesos e instrucciones de trabajo para el equipo de embarques", progress: 0 },
      { department: "ADMINISTRACION Y FINANZAS (50000001)", owner: "CARLOS ARTURO HERNANDEZ", objective: "Apoyo en mantener el 100% los CFDI de nóminas conciliado SAT vs SAP", progress: 0 },
      { department: "ADMINISTRACION Y FINANZAS (50000001)", owner: "CARLOS ARTURO HERNANDEZ", objective: "Asistir al 100% a las capacitaciones programadas", progress: 0 }
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