'use client';

import { useState, useEffect } from 'react';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Não retorna nada no servidor para evitar hidratação
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}