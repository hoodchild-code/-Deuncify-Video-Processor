import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileVideo, X, Scissors, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleProcess = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file) onFileSelect(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02] shadow-xl shadow-primary/10"
            : "border-white/10 hover:border-white/20 hover:bg-white/5",
          file ? "border-solid border-primary/50 bg-card/40" : "",
          isProcessing ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
        )}
      >
        <input {...getInputProps()} />

        <div className="p-12 min-h-[400px] flex flex-col items-center justify-center text-center relative z-10">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center space-y-6"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-10 h-10 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display text-white">
                    Drop your video here
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    or click to browse files
                  </p>
                </div>
                <div className="flex gap-3 text-xs font-mono text-muted-foreground/60 mt-8">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    MP4
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    MOV
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    MAX 500MB
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md"
              >
                <div className="relative bg-card border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <button
                    onClick={clearFile}
                    className="absolute -top-3 -right-3 p-2 bg-destructive text-white rounded-full shadow-lg hover:bg-destructive/90 transition-colors z-20"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <FileVideo className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <h4 className="font-bold text-lg truncate text-white">
                        {file.name}
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </div>
                      <p className="text-sm text-center text-primary animate-pulse font-medium">
                        Analyzing audio & trimming silence...
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleProcess}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <Scissors className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                      Deuncify Video
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
