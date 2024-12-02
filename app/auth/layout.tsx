import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="w-dvw min-h-dvh flex overflow-hidden">
        {children}
    </div>
  )
}

export default AuthLayout;