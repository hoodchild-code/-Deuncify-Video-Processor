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
            Stop the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-glow">Millennial Pause Today!</span>
          </h1>
          
          <p className="text-xl text-muted-foreground md:px-12 leading-relaxed">
            Upload your video and we'll automatically trim that awkward silence at the start. 
            Instant, professional, and awkward-free.
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
            <h2 id="features-heading" className="sr-only">How Deuncify works</h2>
            <FeatureCard 
              icon={<MicOff className="w-6 h-6 text-primary" aria-hidden="true" />}
              title="Smart Detection"
              description="Analyzes audio decibels to find exactly when you start speaking."
            />
            <FeatureCard 
              icon={<Scissors className="w-6 h-6 text-accent" aria-hidden="true" />}
              title="Precise Trimming"
              description="Cuts the silence while keeping a 0.1s buffer so you don't sound clipped."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-purple-400" aria-hidden="true" />}
              title="Instant Result"
              description="Processing happens in seconds. Download immediately."
            />
          </motion.section>
        )}

        {/* Main Interaction Area */}
        <div className="w-full mb-20">
          {processedVideo ? (
            <VideoPlayer videoBlob={processedVideo} onReset={reset} />
          ) : (
            <UploadZone 
              onFileSelect={handleFileSelect} 
              isProcessing={isPending} 
            />
          )}
        </div>
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
