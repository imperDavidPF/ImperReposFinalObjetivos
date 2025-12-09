import React, { useState, useEffect } from 'react';

export const SearchSection = ({ objectivesData, onOwnerSelect, onBossSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Obtener propietarios únicos
  const getUniqueOwners = () => {
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
          objectiveCount: 0
        };
      }
      
      ownerMap[key].objectiveCount++;
    });
    
    return Object.values(ownerMap);
  };

  // Obtener jefes únicos
  const getUniqueBosses = () => {
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
            departmentCount: 0,
            departments: new Set(),
            owners: new Set()
          };
        }
        bossMap[item.boss].objectiveCount++;
        bossMap[item.boss].departments.add(item.department);
        bossMap[item.boss].owners.add(item.owner);
      }
    });
    
    const bosses = Object.values(bossMap).map(boss => ({
      name: boss.name,
      objectiveCount: boss.objectiveCount,
      departmentCount: boss.departments.size,
      ownerCount: boss.owners.size
    }));
    
    return bosses.sort((a, b) => b.objectiveCount - a.objectiveCount);
  };

  const performSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    const uniqueOwners = getUniqueOwners();
    const uniqueBosses = getUniqueBosses();
    
    // Buscar en propietarios
    const ownerResults = uniqueOwners.filter(owner => 
      owner.name.toLowerCase().includes(query) || 
      owner.boss.toLowerCase().includes(query) ||
      owner.department.toLowerCase().includes(query)
    ).map(owner => ({
      ...owner,
      type: 'owner'
    }));
    
    // Buscar en jefes
    const bossResults = uniqueBosses.filter(boss => 
      boss.name.toLowerCase().includes(query)
    ).map(boss => ({
      ...boss,
      type: 'boss'
    }));
    
    // Combinar y ordenar resultados
    const results = [...ownerResults, ...bossResults];
    
    setSearchResults(results);
    setShowResults(true);
  };

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const clearSearchResults = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleResultSelect = (result) => {
    if (result.type === 'owner') {
      onOwnerSelect(result.name, result.boss, result.department);
    } else if (result.type === 'boss') {
      onBossSelect(result.name);
    }
    clearSearchResults();
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(performSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  return (
    <div className="search-section">
      <div className="card">
        <h3>Buscador de Propietarios y Jefes</h3>
        <div className="search-container">
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyPress={handleKeyPress}
            placeholder="Buscar por propietario, jefe directo o departamento..." 
          />
          <button onClick={performSearch}>Buscar</button>
          <button onClick={clearSearchResults}>Limpiar</button>
        </div>
        
        {showResults && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="no-results">No se encontraron resultados</div>
            ) : (
              searchResults.map((result, index) => (
                <div 
                  key={index}
                  className={`search-result-item ${result.type}`}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="search-result-type">
                    {result.type === 'boss' ? '👔 Jefe Directo' : '👤 Propietario'}
                  </div>
                  <div className="search-result-name">{result.name}</div>
                  <div className="search-result-info">
                    {result.type === 'owner' ? (
                      <>
                        <div>Jefe: {result.boss}</div>
                        <div>Depto: {result.department}</div>
                        <div>({result.objectiveCount} objetivos)</div>
                      </>
                    ) : (
                      <>
                        <div>{result.ownerCount} personas a cargo</div>
                        <div>{result.objectiveCount} objetivos en {result.departmentCount} departamentos</div>
                        <div>Click para ver equipo completo</div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};