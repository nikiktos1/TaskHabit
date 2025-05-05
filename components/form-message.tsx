"use client";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export type Message = {
  message?: string;
  error?: string;
  success?: string;
};

export function FormMessage({ message }: { message: Message }) {
  if (!message || Object.keys(message).length === 0) {
    return null;
  }

  if (message.error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message.error}</AlertDescription>
      </Alert>
    );
  }

  if (message.success) {
    return (
      <Alert variant="default" className="mt-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>{message.success}</AlertDescription>
      </Alert>
    );
  }

  if (message.message) {
    return (
      <Alert variant="default" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>{message.message}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
