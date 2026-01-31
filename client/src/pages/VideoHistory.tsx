import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { useAuth } from "@/lib/auth";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button-custom";
import { Card, CardContent } from "@/components/ui/card";
import { Film, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function VideoHistory() {
  const { user } = useAuth();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const res = await fetch(api.videos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load videos");
      return res.json();
    },
    enabled: !!user,
  });

  const handlePreview = async (id: string) => {
    const res = await fetch(api.videos.get(id).path, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    setPreviewBlob(blob);
    setPreviewId(id);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">Log in</Link> to view your video history.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white hover:opacity-90">
            <ArrowLeft className="w-5 h-5" />
            Back to Deuncify
          </Link>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">My Deuncified Videos</h1>
        <p className="text-muted-foreground mb-8">
          Videos are kept for 30 days. Preview or download anytime.
        </p>

        {previewBlob ? (
          <div className="space-y-6">
            <VideoPlayer
              videoBlob={previewBlob}
              onReset={() => {
                setPreviewBlob(null);
                setPreviewId(null);
              }}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Film className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">No videos yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Process a video on the home page and it will appear here.
              </p>
              <Link href="/">
                <Button>Go process a video</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v: { id: string; originalName: string; createdAt: string }) => (
              <Card
                key={v.id}
                className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => handlePreview(v.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <Film className="w-8 h-8 text-primary shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate" title={v.originalName}>
                        {v.originalName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 group-hover:text-primary transition-colors">
                    Click to preview
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
