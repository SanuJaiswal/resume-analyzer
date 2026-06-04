import { toast as sonnerToast } from "sonner";

// Thin wrapper to keep the { toast } = useToast() API the app expects
export function useToast() {
  const toast = ({ title, description, variant }) => {
    if (variant === "destructive") {
      sonnerToast.error(title, { description });
    } else {
      sonnerToast.success(title, { description });
    }
  };
  return { toast };
}
