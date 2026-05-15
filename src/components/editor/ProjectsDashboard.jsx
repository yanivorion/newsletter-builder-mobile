import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, MoreVertical, Trash2, Copy, Edit2, 
  Calendar, Mail, FolderOpen, ArrowLeft, Grid, List,
  SortAsc, SortDesc, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';

function ProjectsDashboard({ 
  projects, 
  onSelectProject, 
  onCreateNew, 
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onBack 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'name', 'createdAt'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [renamingProject, setRenamingProject] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'updatedAt') {
        comparison = new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      } else if (sortBy === 'createdAt') {
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    return result;
  }, [projects, searchQuery, sortBy, sortOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleRenameSubmit = (projectId) => {
    if (renameValue.trim()) {
      onRenameProject(projectId, renameValue.trim());
    }
    setRenamingProject(null);
    setRenameValue('');
  };

  const startRename = (project) => {
    setRenamingProject(project.id);
    setRenameValue(project.name);
    setMenuOpenFor(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-zinc-600" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-900">My Projects</h1>
                  <p className="text-sm text-zinc-500">{projects.length} newsletter{projects.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              <Plus size={18} />
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            {/* View & Sort Controls */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="updatedAt">Last modified</option>
                <option value="createdAt">Date created</option>
                <option value="name">Name</option>
              </select>
              
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
              >
                {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </button>
              
              <div className="w-px h-6 bg-zinc-200 mx-1" />
              
              {/* View Mode */}
              <div className="flex bg-zinc-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === 'grid' ? "bg-white shadow-sm" : "hover:bg-zinc-200"
                  )}
                >
                  <Grid size={18} className={viewMode === 'grid' ? 'text-zinc-900' : 'text-zinc-500'} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === 'list' ? "bg-white shadow-sm" : "hover:bg-zinc-200"
                  )}
                >
                  <List size={18} className={viewMode === 'list' ? 'text-zinc-900' : 'text-zinc-500'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <Search size={48} className="mx-auto text-zinc-300 mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 mb-2">No results found</h3>
                <p className="text-zinc-500">Try a different search term</p>
              </>
            ) : (
              <>
                <FolderOpen size={48} className="mx-auto text-zinc-300 mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 mb-2">No projects yet</h3>
                <p className="text-zinc-500 mb-6">Create your first newsletter to get started</p>
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <Plus size={18} />
                  Create Project
                </button>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                formatDate={formatDate}
                isMenuOpen={menuOpenFor === project.id}
                onMenuToggle={() => setMenuOpenFor(menuOpenFor === project.id ? null : project.id)}
                onSelect={() => onSelectProject(project)}
                onDelete={() => { onDeleteProject(project.id); setMenuOpenFor(null); }}
                onDuplicate={() => { onDuplicateProject(project.id); setMenuOpenFor(null); }}
                onRename={() => startRename(project)}
                isRenaming={renamingProject === project.id}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameSubmit={() => handleRenameSubmit(project.id)}
                onRenameCancel={() => { setRenamingProject(null); setRenameValue(''); }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600">Sections</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600">Last Modified</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600">Created</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer transition-colors"
                    onClick={() => onSelectProject(project)}
                  >
                    <td className="px-4 py-3">
                      {renamingProject === project.id ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(project.id);
                            if (e.key === 'Escape') { setRenamingProject(null); setRenameValue(''); }
                          }}
                          onBlur={() => handleRenameSubmit(project.id)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-zinc-900">{project.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {project.sections?.length || 0} sections
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {formatDate(project.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpenFor(menuOpenFor === project.id ? null : project.id)}
                          className="p-1.5 hover:bg-zinc-200 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} className="text-zinc-400" />
                        </button>
                        {menuOpenFor === project.id && (
                          <ProjectMenu
                            onRename={() => startRename(project)}
                            onDuplicate={() => { onDuplicateProject(project.id); setMenuOpenFor(null); }}
                            onDelete={() => { onDeleteProject(project.id); setMenuOpenFor(null); }}
                            onClose={() => setMenuOpenFor(null)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ 
  project, 
  formatDate, 
  isMenuOpen, 
  onMenuToggle, 
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel
}) {
  // Generate a preview color based on the first section's background
  const previewColor = project.sections?.[0]?.backgroundColor || '#E5E5E5';
  
  return (
    <div 
      className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all cursor-pointer"
      onClick={onSelect}
    >
      {/* Preview */}
      <div 
        className="h-36 relative"
        style={{ backgroundColor: previewColor }}
      >
        {/* Thumbnail preview of sections */}
        <div className="absolute inset-2 flex flex-col gap-1 overflow-hidden opacity-60">
          {project.sections?.slice(0, 4).map((section, i) => (
            <div 
              key={i}
              className="h-6 rounded"
              style={{ 
                backgroundColor: section.backgroundColor || '#f5f5f5',
                border: '1px solid rgba(0,0,0,0.05)'
              }}
            />
          ))}
        </div>
        
        {/* Menu Button */}
        <div 
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onMenuToggle}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm transition-colors"
          >
            <MoreVertical size={16} className="text-zinc-600" />
          </button>
          {isMenuOpen && (
            <ProjectMenu
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onClose={onMenuToggle}
            />
          )}
        </div>
      </div>
      
      {/* Info */}
      <div className="p-3">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit();
              if (e.key === 'Escape') onRenameCancel();
            }}
            onBlur={onRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full px-2 py-1 border border-blue-500 rounded text-sm font-medium focus:outline-none"
          />
        ) : (
          <h3 className="font-medium text-zinc-900 truncate">{project.name}</h3>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <Clock size={12} />
          <span>{formatDate(project.updatedAt || project.createdAt)}</span>
          <span className="text-zinc-300">•</span>
          <span>{project.sections?.length || 0} sections</span>
        </div>
      </div>
    </div>
  );
}

function ProjectMenu({ onRename, onDuplicate, onDelete, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Menu */}
      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
        <button
          onClick={onRename}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Edit2 size={14} />
          Rename
        </button>
        <button
          onClick={onDuplicate}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Copy size={14} />
          Duplicate
        </button>
        <div className="border-t border-zinc-100 my-1" />
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </>
  );
}

export default ProjectsDashboard;


