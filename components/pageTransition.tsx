'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckLogin } from "@/lib/functions";

interface PageTransitionProps {
  children: React.ReactNode;
}

import AxiomSidebar from '@/components/axiomSidebar';
import { AxiomTopRightDropdown } from '@/components/axiomTopRightDropdown';

export default function PageTransition({ children }: PageTransitionProps) {
  const [isAuth, setIsAuth] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const pathname = usePathname();
  React.useEffect(() => {
    if (pathname === '/auth') {
      setIsAuth(true);
    } else {
      setIsAuth(false);
      CheckLogin();
    }
    setIsReady(true);
  }, [pathname]);

  return (
    <div className='flex w-dvw h-dvh overflow-hidden'>
            {!isAuth && isReady && (
          <>
            <AxiomSidebar />
            <AxiomTopRightDropdown />
          </>
        )}
        <div className='flex overflow-hidden'>
          {children}
        </div>
    </div>
  );
}