import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useSetting } from '../../lib/settings';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  const { value: preview } = useSetting('app_logo');

  return (
    <div className={cn("flex items-center justify-center py-1", className)}>
      <div className={cn(
        "flex items-center justify-center transition-all duration-300",
        !preview && "w-12 h-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 text-white font-black text-xl"
      )}>
        {preview ? (
          <img src={preview} alt="Logo" className="h-10 md:h-14 w-auto object-contain" />
        ) : (
          "D"
        )}
      </div>
    </div>
  );
}
