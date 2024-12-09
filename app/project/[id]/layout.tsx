"use client";
import { ReactNode } from "react";
import React from "react";
import { setLastPageVisited } from "@/lib/functions";
import ProjNavbar from "./proj-navbar";
import {AutosaveProvider} from "./proj-autosave"; // Wrap with AutosaveProvider for global state

interface ProjectsLayoutProps {
  children: ReactNode;
}

const ProjectsLayout: React.FC<ProjectsLayoutProps> = ({ children }) => {
  React.useEffect(() => {
    setLastPageVisited();
  }, []);

  return (
    <AutosaveProvider>
      <div className="w-dvw min-h-dvh flex flex-col overflow-x-hidden">
        <ProjNavbar />
        <div className="flex flex-col mt-16">{children}</div>
      </div>
    </AutosaveProvider>
  );
};

export default ProjectsLayout;
