import React, { useState, useEffect } from 'react';
import { getUniqueOwners } from '../utils/chartUtils';

export const SearchSection = ({ objectivesData, onOwnerSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const performSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    const uniqueOwners = getUniqueOwners(objectivesData);
    const results = uniqueOwners.filter(owner => 
      owner.name.toLowerCase().includes(query) || 
      owner.department.toLowerCase().includes(query)
    );
    
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

  const handleOwnerSelect = (owner, department) => {
    onOwnerSelect(owner, department);
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
        <h3>Buscador de Propietarios</h3>
        <div className="search-container">
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyPress={handleKeyPress}
            placeholder="Escribe el nombre del propietario..." 
          />
          <button onClick={performSearch}>Buscar</button>
          <button onClick={clearSearchResults}>Limpiar</button>
        </div>
        
        {showResults && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="no-results">No se encontraron propietarios</div>
            ) : (
              searchResults.map((owner, index) => (
                <div 
                  key={index}
                  className="search-result-item"
                  onClick={() => handleOwnerSelect(owner.name, owner.department)}
                >
                  <div className="search-result-name">{owner.name}</div>
                  <div className="search-result-department">
                    {owner.department} ({owner.objectiveCount} objetivos)
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