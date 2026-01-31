import { useMutation } from "@tanstack/react-query";
import { api, errorSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useVideoProcessing() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.upload.path, {
        method: api.upload.method,
        body: formData,
        // Don't set Content-Type header manually, let browser set boundary for multipart
      });

      if (!res.ok) {
        // Try to parse error JSON if possible
        try {
          const errorData = await res.json();
          const parsed = errorSchema.safeParse(errorData);
          if (parsed.success) {
            throw new Error(parsed.data.detail);
          }
        } catch (e) {
          // If JSON parsing fails, fall through to generic error
        }
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      // Return the blob for display
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
