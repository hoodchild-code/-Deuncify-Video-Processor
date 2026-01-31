import { useState } from "react";
import { Link } from "wouter";
import { UploadZone } from "@/components/UploadZone";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Footer } from "@/components/Footer";
import { useVideoProcessing } from "@/hooks/use-video-processing";
import { useAuth } from "@/lib/auth";
import { Sparkles, Zap, MicOff, Scissors, LogIn, LogOut, Film } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button-custom";

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const [processedVideo, setProcessedVideo] = useState<Blob | null>(null);
  const { mutate: processVideo, isPending } = useVideoProcessing();

  const handleFileSelect = (file: File) => {
    processVideo(file, {
      onSuccess: (blob) => {
        setProcessedVideo(blob);
      },
    });
  };

  const reset = () => {
    setProcessedVideo(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center bg-fixed bg-no-repeat relative">
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl z-0" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white">Deuncify</span>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/videos">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Film className="w-4 h-4 mr-1" />
                    My Videos
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <LogIn className="w-4 h-4 mr-1" />
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
        {!user && !isLoading && (
          <div className="container mx-auto px-4 pb-3">
            <p className="text-sm text-amber-200/90">
              <Link href="/register" className="underline font-medium">Create an account</Link> to save your deuncified videos for 30 days.
            </p>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Silence Remover</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight tracking-tight">
            Remove Awkward Silences from Videos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-glow">with AI</span>
          </h1>
          
          <p className="text-xl text-muted-foreground md:px-12 leading-relaxed mb-4">
            Perfect for podcasters, YouTubers, and TikTok creators. Trim pauses in MP4 and MOV files easily – 
            upload, process, and download in seconds. <Link href="/how-it-works?utm_source=home&utm_medium=cta&utm_campaign=learn_more" className="text-primary hover:underline font-medium">Learn more about our AI technology</Link>.
          </p>
        </motion.div>

        {/* Features Grid (Only show if no result) */}
        {!processedVideo && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-4xl"
            aria-labelledby="features-heading"
          >
            <h2 id="features-heading" className="text-2xl font-bold text-white text-center col-span-full mb-2">AI Silence Remover for Videos</h2>
            <FeatureCard 
              icon={<MicOff className="w-6 h-6 text-primary" aria-hidden="true" />}
              title="Smart Silence Detection"
              description="Our AI analyzes audio decibels to find exactly when you start speaking – no manual scrubbing."
            />
            <FeatureCard 
              icon={<Scissors className="w-6 h-6 text-accent" aria-hidden="true" />}
              title="Precise Video Trimming"
              description="Cuts the silence while keeping a 0.1s buffer so you don't sound clipped."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-purple-400" aria-hidden="true" />}
              title="Instant Result"
              description="Trim pauses in seconds. Download your edited MP4 immediately."
            />
          </motion.section>
        )}

        {/* Main Interaction Area */}
        <div className="w-full mb-12">
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure video uploads
            </span>
          </div>
          {processedVideo ? (
            <VideoPlayer videoBlob={processedVideo} onReset={reset} />
          ) : (
            <UploadZone 
              onFileSelect={handleFileSelect} 
              isProcessing={isPending} 
            />
          )}
        </div>

        {/* Use cases & CTA */}
        {!processedVideo && (
          <section className="w-full max-w-4xl mb-16 text-center">
            <h2 className="text-xl font-bold text-white mb-4">Use Cases for AI Silence Remover</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Remove millennial pause from TikTok videos, trim awkward silences in podcast interviews, 
              or cut dead air from YouTube content. Whether you need an automatic silence cutter for YouTube 
              or a quick way to remove silence from video free – Deuncify handles it.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link href="/how-it-works?utm_source=home&utm_medium=cta&utm_campaign=how_it_works">
                <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                  How it works
                </Button>
              </Link>
              <Link href="/examples?utm_source=home&utm_medium=cta&utm_campaign=examples">
                <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                  Examples
                </Button>
              </Link>
              <Link href="/pricing?utm_source=home&utm_medium=cta&utm_campaign=pricing">
                <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                  Pricing
                </Button>
              </Link>
            </div>
            <Link href="/register?utm_source=home&utm_medium=cta&utm_campaign=start_free">
              <Button size="lg" className="font-bold text-lg px-8">
                Start Removing Silences Now – Free
              </Button>
            </Link>
          </section>
        )}

        {/* Testimonial */}
        {!processedVideo && (
          <section className="w-full max-w-2xl mb-16 text-center">
            <blockquote className="text-muted-foreground italic border-l-2 border-primary/50 pl-6 py-2">
              &ldquo;Saved me hours on my podcast editing! I used to manually cut every awkward pause – 
              now Deuncify does it in seconds. Best AI silence remover for videos I&apos;ve tried.&rdquo;
            </blockquote>
            <p className="text-sm text-muted-foreground mt-2">— Creator, podcast & YouTube</p>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 backdrop-blur-sm group">
      <div className="mb-4 p-3 rounded-xl bg-background/50 w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2 font-display">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
