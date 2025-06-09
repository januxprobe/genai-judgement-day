"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CrtOverlayProps {
  className?: string;
}

const CrtOverlay: React.FC<CrtOverlayProps> = ({ className }) => {
  return <div className={cn('crt-overlay', className)} />;
};

export default CrtOverlay;
