import { ReactNode } from 'react';

interface ProjectsLayoutProps {
  children: ReactNode;
}

const ProjectsLayout: React.FC<ProjectsLayoutProps> = ({ children }) => {
  return (
    <div className="w-dvw min-h-dvh flex overflow-hidden">
        {children}
    </div>
  )
}

export default ProjectsLayout;