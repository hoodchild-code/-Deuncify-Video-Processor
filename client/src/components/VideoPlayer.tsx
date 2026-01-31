import { useRef, useState, useEffect } from "react";
import { Download, RefreshCw, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button-custom";
import { motion } from "framer-motion";

interface VideoPlayerProps {
  videoBlob: Blob;
  onReset: () => void;
}

export function VideoPlayer({ videoBlob, onReset }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(videoBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [videoBlob]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `deuncified-${new Date().getTime()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video">
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain"
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
          playsInline
          preload="metadata"
          title="Deuncified video playback"
        />

        {/* Custom Overlay Controls */}
        <div 
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white fill-white" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-end pointer-events-none">
           <button 
             onClick={(e) => { e.stopPropagation(); toggleMute(); }}
             className="pointer-events-auto p-2 rounded-full hover:bg-white/10 text-white transition-colors"
           >
             {isMuted ? <VolumeX /> : <Volume2 />}
           </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5">
        <div className="text-left">
          <h3 className="text-xl font-bold text-white mb-1">Success!</h3>
          <p className="text-muted-foreground">
            Your video has been trimmed. The millennial pause is gone.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={onReset}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            New Video
          </Button>
          <Button
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            Download
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
