import { Link } from "wouter";
import { useHealth } from "@/hooks/use-health";
import { Heart, Activity } from "lucide-react";

export function Footer() {
  const { data: health, isLoading } = useHealth();

  return (
    <footer className="w-full py-6 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
        <div className="flex items-center gap-2">
          <span>Built with</span>
          <Heart className="w-4 h-4 text-primary animate-pulse" />
          <span>for creators</span>
        </div>

        <nav className="flex items-center gap-4" aria-label="Legal">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="font-mono text-xs">
              System Status:{" "}
              {isLoading ? (
                <span className="text-muted-foreground">Checking...</span>
              ) : health?.status ? (
                <span className="text-green-400 font-bold">{health.status}</span>
              ) : (
                <span className="text-destructive font-bold">Offline</span>
              )}
            </span>
          </div>
          <p>© {new Date().getFullYear()} Deuncify</p>
        </div>
      </div>
    </footer>
  );
}
