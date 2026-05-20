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
    <div className={cn("flex items-center gap-2.5 md:gap-3 py-1", className)}>
      <div className={cn(
        "flex items-center justify-center transition-all duration-300 shrink-0",
        !preview && "w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 text-white font-black text-xl"
      )}>
        {preview ? (
          <img src={preview} alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
        ) : (
          "D"
        )}
      </div>
      <span className="font-sans font-extrabold text-base md:text-lg text-slate-800 tracking-tight whitespace-nowrap">
        Dany Clean <span className="text-blue-600">Pro</span>
      </span>
    </div>
  );
}
