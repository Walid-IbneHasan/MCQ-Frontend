// components/ui/checkbox-with-indeterminate.tsx
"use client";

import * as React from "react";
import { Checkbox } from "./checkbox";

interface CheckboxWithIndeterminateProps {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export const CheckboxWithIndeterminate = React.forwardRef<
  HTMLButtonElement,
  CheckboxWithIndeterminateProps
>(({ checked, indeterminate, onCheckedChange, ...props }, ref) => {
  const checkboxRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate || false;
    }
  }, [indeterminate]);

  return (
    <Checkbox
      ref={checkboxRef}
      checked={indeterminate ? false : checked}
      onCheckedChange={onCheckedChange}
      {...props}
    />
  );
});
