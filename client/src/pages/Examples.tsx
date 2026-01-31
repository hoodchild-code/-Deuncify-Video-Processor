import { Link } from "wouter";
import { ArrowLeft, Mic, Video, Music, Smartphone } from "lucide-react";

export default function Examples() {
  const examples = [
    {
      icon: <Mic className="w-8 h-8 text-primary" aria-hidden="true" />,
      title: "Podcast Episodes",
      description: "Remove the awkward silence at the start of your podcast and trim long pauses between segments. Perfect for solo shows and interviews. Many creators use Deuncify as an AI silence remover for videos to cut editing time from hours to minutes.",
    },
    {
      icon: <Video className="w-8 h-8 text-accent" aria-hidden="true" />,
      title: "YouTube Videos",
      description: "Use an automatic silence cutter for YouTube to remove dead air from vlogs, tutorials, and talking-head content. Keep your audience engaged with tighter pacing. Trim pauses in MP4 files without opening a video editor.",
    },
    {
      icon: <Smartphone className="w-8 h-8 text-purple-400" aria-hidden="true" />,
      title: "TikTok & Short-Form",
      description: "Remove millennial pause from TikTok videos so your hook lands in the first second. Every frame counts in short-form content – Deuncify helps you cut the fluff and keep viewers watching.",
    },
    {
      icon: <Music className="w-8 h-8 text-green-400" aria-hidden="true" />,
      title: "Interviews & Lectures",
      description: "Trim awkward silences in interview recordings or educational content. Get professional-sounding output without manual timeline editing. Remove silence from video free and export clean MP4 files.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Deuncify
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-white mb-4">Examples: How Creators Use Our AI Silence Remover</h1>
        <p className="text-xl text-muted-foreground mb-12">
          See how podcasters, YouTubers, and TikTok creators use Deuncify to remove awkward silences 
          and trim pauses in their videos. Add your own before/after screenshots once you&apos;ve tried it.
        </p>

        <div className="space-y-8">
          {examples.map((ex, i) => (
            <article
              key={i}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center">
                  {ex.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{ex.title}</h2>
                  <p className="text-muted-foreground">{ex.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Try It Yourself</h2>
          <p className="text-muted-foreground mb-6">
            Upload your video and see how Deuncify removes awkward silences in seconds.
          </p>
          <Link href="/?utm_source=examples&utm_medium=cta&utm_campaign=get_started">
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-opacity">
              Start Removing Silences Now – Free
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
