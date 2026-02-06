/**
 * Global type definitions for the application.
 */

// Re-export API types for convenience
export * from "@/lib/api/types";

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Form types
export interface FieldError {
  field: string;
  message: string;
}
