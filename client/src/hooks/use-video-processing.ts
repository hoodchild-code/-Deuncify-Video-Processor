import { useMutation } from "@tanstack/react-query";
import { errorSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useVideoProcessing() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          const parsed = errorSchema.safeParse(errorData);
          if (parsed.success) {
            throw new Error(parsed.data.detail);
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      // Server saves to history automatically for logged-in users
      return await res.blob();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error.message || "Could not process video. Please try again.",
      });
    },
  });
}
