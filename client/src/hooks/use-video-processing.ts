import { useMutation } from "@tanstack/react-query";
import { errorSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export function useVideoProcessing() {
  const { toast, getAccessToken } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
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
