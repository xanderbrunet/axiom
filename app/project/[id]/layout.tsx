"use client";
import { ReactNode } from 'react';
import React from 'react';
import { setLastPageVisited } from '@/lib/functions';
import ProjNavbar from './proj-navbar';

interface ProjectsLayoutProps {
  children: ReactNode;
}

const ProjectsLayout: React.FC<ProjectsLayoutProps> = ({ children }) => {
  React.useEffect(() => {
    setLastPageVisited();
  }, []);
  return (
    <div className="w-dvw min-h-dvh flex flex-col overflow-x-hidden">
        <ProjNavbar />
        <div className='flex flex-col mt-24 md:mt-10'>
        {children}
        </div>
    </div>
  )
}

export default ProjectsLayout;