import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useHealth() {
  return useQuery({
    queryKey: [api.health.path],
    queryFn: async () => {
      const res = await fetch(api.health.path);
      if (!res.ok) throw new Error("API is offline");
      return api.health.responses[200].parse(await res.json());
    },
    // Don't retry too aggressively for health checks
    retry: 1,
    refetchInterval: 30000, // Check every 30s
  });
}
