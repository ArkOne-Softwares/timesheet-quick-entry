import React, { useState, useEffect } from 'react';

export default function FilterBar({ 
  data = [], 
  onFilteredData, 
  storageKey = 'filters', 
  showProjectFilter = true 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [projectFilters, setProjectFilters] = useState([]);
  const [sortField, setSortField] = useState('creation');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available filter options
  const statusOptions = ['Open', 'Working', 'Pending Review', 'Overdue', 'Completed', 'Cancelled'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  
  // Get unique projects from data
  const projectOptions = [...new Set(data.map(item => item.project).filter(Boolean))];

  // Apply filters and sort
  useEffect(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilters.length > 0) {
      filtered = filtered.filter(item => statusFilters.includes(item.status));
    }

    // Priority filter
    if (priorityFilters.length > 0) {
      filtered = filtered.filter(item => priorityFilters.includes(item.priority));
    }

    // Project filter
    if (projectFilters.length > 0) {
      filtered = filtered.filter(item => projectFilters.includes(item.project));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'creation' || sortField === 'modified') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    onFilteredData(filtered);
  }, [data, searchTerm, statusFilters, priorityFilters, projectFilters, sortField, sortOrder]);

  const toggleFilter = (filterArray, setFilterArray, value) => {
    if (filterArray.includes(value)) {
      setFilterArray(filterArray.filter(item => item !== value));
    } else {
      setFilterArray([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilters([]);
    setPriorityFilters([]);
    setProjectFilters([]);
    setSortField('creation');
    setSortOrder('desc');
  };

  return (
    <div className="arkone-filter-bar">
      <div className="arkone-filter-content">
        {/* Search */}
        <div className="arkone-search">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks and projects..."
          />
        </div>

        {/* Quick filters - desktop only */}
        <div className="filter-chips" style={{ display: 'none' }}>
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter(statusFilters, setStatusFilters, status)}
              className={`filter-chip ${statusFilters.includes(status) ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Mobile filter toggle */}
        <button 
          className="mobile-filter-toggle"
          onClick={() => setShowMobileFilters(true)}
        >
          🔍 Filters
        </button>

        {/* Clear filters */}
        {(searchTerm || statusFilters.length || priorityFilters.length || projectFilters.length) && (
          <button onClick={clearAllFilters} className="filter-chip">
            Clear All
          </button>
        )}
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="mobile-filter-modal show">
          <div className="mobile-filter-content">
            <div className="mobile-filter-header">
              <h3>Filters & Sort</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                ✕
              </button>
            </div>

            <div className="mobile-filter-body">
              {/* Status Filter */}
              <div className="filter-section">
                <label>Status</label>
                <div className="filter-chips">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => toggleFilter(statusFilters, setStatusFilters, status)}
                      className={`filter-chip ${statusFilters.includes(status) ? 'active' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="filter-section">
                <label>Priority</label>
                <div className="filter-chips">
                  {priorityOptions.map(priority => (
                    <button
                      key={priority}
                      onClick={() => toggleFilter(priorityFilters, setPriorityFilters, priority)}
                      className={`filter-chip ${priorityFilters.includes(priority) ? 'active' : ''}`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Filter */}
              {showProjectFilter && projectOptions.length > 0 && (
                <div className="filter-section">
                  <label>Projects</label>
                  <div className="filter-chips">
                    {projectOptions.map(project => (
                      <button
                        key={project}
                        onClick={() => toggleFilter(projectFilters, setProjectFilters, project)}
                        className={`filter-chip ${projectFilters.includes(project) ? 'active' : ''}`}
                      >
                        {project}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort */}
              <div className="filter-section">
                <label>Sort by</label>
                <div className="sort-grid">
                  <button
                    onClick={() => setSortField('creation')}
                    className={`sort-button ${sortField === 'creation' ? 'active' : ''}`}
                  >
                    📅 Created
                  </button>
                  <button
                    onClick={() => setSortField('modified')}
                    className={`sort-button ${sortField === 'modified' ? 'active' : ''}`}
                  >
                    🔄 Updated
                  </button>
                  <button
                    onClick={() => setSortField('exp_end_date')}
                    className={`sort-button ${sortField === 'exp_end_date' ? 'active' : ''}`}
                  >
                    ⏰ Due Date
                  </button>
                  <button
                    onClick={() => setSortField('priority')}
                    className={`sort-button ${sortField === 'priority' ? 'active' : ''}`}
                  >
                    ⚡ Priority
                  </button>
                </div>
                
                <div className="sort-grid" style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`sort-button ${sortOrder === 'asc' ? 'active' : ''}`}
                  >
                    ↑ Ascending
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`sort-button ${sortOrder === 'desc' ? 'active' : ''}`}
                  >
                    ↓ Descending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
