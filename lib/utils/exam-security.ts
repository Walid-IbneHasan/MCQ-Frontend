// lib/utils/exam-security.ts - Enhanced exam security features
export class ExamSecurity {
  private static instance: ExamSecurity;
  private tabSwitchCount = 0;
  private suspiciousActivity: string[] = [];

  static getInstance(): ExamSecurity {
    if (!ExamSecurity.instance) {
      ExamSecurity.instance = new ExamSecurity();
    }
    return ExamSecurity.instance;
  }

  enableSecurityMode() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', this.preventContextMenu);
    
    // Block developer tools shortcuts
    document.addEventListener('keydown', this.preventDevToolsShortcuts);
    
    // Track tab visibility changes
    document.addEventListener('visibilitychange', this.trackTabSwitches);
    
    // Prevent text selection (optional)
    document.addEventListener('selectstart', this.preventSelection);
  }

  disableSecurityMode() {
    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('keydown', this.preventDevToolsShortcuts);
    document.removeEventListener('visibilitychange', this.trackTabSwitches);
    document.removeEventListener('selectstart', this.preventSelection);
  }

  private preventContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.suspiciousActivity.push('Right-click attempted');
  };

  private preventDevToolsShortcuts = (e: KeyboardEvent) => {
    // Block F12
    if (e.key === 'F12') {
      e.preventDefault();
      this.suspiciousActivity.push('F12 pressed');
    }
    
    // Block Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      this.suspiciousActivity.push('Ctrl+Shift+I pressed');
    }
    
    // Block Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      this.suspiciousActivity.push('Ctrl+U pressed');
    }
    
    // Block Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      this.suspiciousActivity.push('Ctrl+Shift+J pressed');
    }
  };

  private trackTabSwitches = () => {
    if (document.hidden) {
      this.tabSwitchCount++;
      this.suspiciousActivity.push(`Tab switch #${this.tabSwitchCount}`);
    }
  };

  private preventSelection = (e: Event) => {
    e.preventDefault();
  };

  getSecurityReport() {
    return {
      tabSwitches: this.tabSwitchCount,
      suspiciousActivities: [...this.suspiciousActivity],
      timestamp: new Date().toISOString()
    };
  }

  resetSecurityData() {
    this.tabSwitchCount = 0;
    this.suspiciousActivity = [];
  }
}
