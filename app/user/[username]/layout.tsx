// pages/[username]/layout.tsx
"use client";
import React from 'react';
import { setLastPageVisited } from '@/lib/functions'; // Optional: Import a footer component

type ProfileLayoutProps = {
  children: React.ReactNode;
};

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  React.useEffect(() => {
    setLastPageVisited();
  }, []);
  return (
    <div className="w-dvw min-h-dvh flex overflow-x-hidden">
        {children}
    </div>
  );
};

export default ProfileLayout;
