//use-exam-security.ts - Custom hook for managing exam security features
import { useEffect, useState } from 'react';
import { ExamSecurity } from '../lib/utils/exam-security';

export function useExamSecurity(isActive: boolean) {
  const [security] = useState(() => ExamSecurity.getInstance());

  useEffect(() => {
    if (isActive) {
      security.enableSecurityMode();
    } else {
      security.disableSecurityMode();
    }

    return () => {
      security.disableSecurityMode();
    };
  }, [isActive, security]);

  return {
    getSecurityReport: () => security.getSecurityReport(),
    resetSecurityData: () => security.resetSecurityData()
  };
}