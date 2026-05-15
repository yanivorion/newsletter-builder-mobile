import { useState, useEffect, useCallback } from 'react';

const PROJECTS_KEY = 'newsletter-builder-projects';

/**
 * Hook for managing newsletter projects in localStorage
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) {
        setProjects(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  // Save projects to localStorage
  const saveToStorage = useCallback((projectList) => {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectList));
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }, []);

  // Save a project (create or update)
  const saveProject = useCallback((newsletter, name = null) => {
    const projectName = name || newsletter.name || `Newsletter ${new Date().toLocaleDateString()}`;
    const projectId = newsletter.projectId || `project-${Date.now()}`;
    
    const project = {
      id: projectId,
      name: projectName,
      updatedAt: new Date().toISOString(),
      createdAt: newsletter.createdAt || new Date().toISOString(),
      thumbnail: null, // Could add thumbnail generation later
      data: {
        ...newsletter,
        projectId,
        name: projectName
      }
    };

    setProjects(prev => {
      const existingIndex = prev.findIndex(p => p.id === projectId);
      let newProjects;
      
      if (existingIndex >= 0) {
        // Update existing project
        newProjects = [...prev];
        newProjects[existingIndex] = project;
      } else {
        // Add new project
        newProjects = [project, ...prev];
      }
      
      saveToStorage(newProjects);
      return newProjects;
    });

    return project;
  }, [saveToStorage]);

  // Delete a project
  const deleteProject = useCallback((projectId) => {
    setProjects(prev => {
      const newProjects = prev.filter(p => p.id !== projectId);
      saveToStorage(newProjects);
      return newProjects;
    });
  }, [saveToStorage]);

  // Load a project
  const loadProject = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.data || null;
  }, [projects]);

  // Rename a project
  const renameProject = useCallback((projectId, newName) => {
    setProjects(prev => {
      const newProjects = prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            name: newName,
            updatedAt: new Date().toISOString(),
            data: { ...p.data, name: newName }
          };
        }
        return p;
      });
      saveToStorage(newProjects);
      return newProjects;
    });
  }, [saveToStorage]);

  // Duplicate a project
  const duplicateProject = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const newId = `project-${Date.now()}`;
    const newProject = {
      ...project,
      id: newId,
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        ...project.data,
        projectId: newId,
        name: `${project.name} (Copy)`
      }
    };

    setProjects(prev => {
      const newProjects = [newProject, ...prev];
      saveToStorage(newProjects);
      return newProjects;
    });

    return newProject;
  }, [projects, saveToStorage]);

  // Export project as JSON
  const exportAsJSON = useCallback((newsletter) => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      newsletter: newsletter
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newsletter.name || 'newsletter'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Import project from JSON file
  const importFromJSON = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Handle both wrapped and unwrapped formats
          const newsletter = data.newsletter || data;
          
          // Validate basic structure
          if (!newsletter.sections || !Array.isArray(newsletter.sections)) {
            throw new Error('Invalid newsletter format: missing sections array');
          }
          
          // Assign new project ID to avoid conflicts
          const importedNewsletter = {
            ...newsletter,
            projectId: `project-${Date.now()}`,
            name: newsletter.name || 'Imported Newsletter',
            importedAt: new Date().toISOString()
          };
          
          resolve(importedNewsletter);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    projects,
    saveProject,
    deleteProject,
    loadProject,
    renameProject,
    duplicateProject,
    exportAsJSON,
    importFromJSON
  };
}

