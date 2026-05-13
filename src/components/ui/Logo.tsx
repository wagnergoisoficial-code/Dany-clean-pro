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
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 relative bg-white shadow-sm border border-slate-100",
        !preview && "bg-blue-600 shadow-lg shadow-blue-600/20 border-none"
      )}>
        {preview ? (
          <img src={preview} alt="Dany Clean Pro" className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-white font-black text-xl">D</span>
        )}
      </div>
    </div>
  );
}
