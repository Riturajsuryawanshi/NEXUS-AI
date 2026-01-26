
import { AnalysisProject, WorkflowStep } from "../types";

const PROJECTS_KEY = 'nexus_projects';

export const projectService = {
  getProjects: (userId: string): AnalysisProject[] => {
    const data = localStorage.getItem(PROJECTS_KEY);
    const projects: AnalysisProject[] = data ? JSON.parse(data) : [];
    return projects.filter(p => p.userId === userId).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  saveProject: (project: AnalysisProject) => {
    const data = localStorage.getItem(PROJECTS_KEY);
    let projects: AnalysisProject[] = data ? JSON.parse(data) : [];
    const index = projects.findIndex(p => p.id === project.id);
    
    const updatedProject = { ...project, updatedAt: Date.now() };
    
    if (index > -1) {
      projects[index] = updatedProject;
    } else {
      projects.push(updatedProject);
    }
    
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return updatedProject;
  },

  deleteProject: (projectId: string) => {
    const data = localStorage.getItem(PROJECTS_KEY);
    let projects: AnalysisProject[] = data ? JSON.parse(data) : [];
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  createEmptyProject: (userId: string, name: string): AnalysisProject => {
    return {
      id: `proj_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeStep: WorkflowStep.IMPORT,
      dataset: null,
      rawDataset: null,
      schema: null,
      auditIssues: [],
      cleaningPlan: [],
      messages: [],
      historyLogs: [],
      consoleCode: '# New Analysis Session'
    };
  }
};
