"use client";

import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  formAction?: (formData: FormData) => Promise<any>;
}

export function SubmitButton({
  children,
  className,
  pendingText,
  formAction,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={className}
      disabled={pending}
      formAction={formAction}
    >
      {pending ? (
        <>
          <div className="h-4 w-4 border-t-2 border-b-2 border-current rounded-full animate-spin mr-2"></div>
          {pendingText || "Submitting..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
