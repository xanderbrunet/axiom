"use client";
import { ReactNode } from 'react';
import { setLastPageVisited } from '@/lib/functions'; // Optional: Import a footer component
import React from 'react';
interface ProjectsLayoutProps {
  children: ReactNode;
}

const ProjectsLayout: React.FC<ProjectsLayoutProps> = ({ children }) => {
  React.useEffect(() => {
    setLastPageVisited();
  }, []);
  return (
    <div className="w-dvw min-h-dvh flex overflow-hidden">
        {children}
    </div>
  )
}

export default ProjectsLayout;