import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Smartphone, Monitor, Share2, MoreVertical, Plus } from "lucide-react";
import { useDevice, useIsStandalone } from "@/hooks/use-device";
import type { DeviceType } from "@/hooks/use-device";

export default function Install() {
  const detectedDevice = useDevice();
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);
  const device = selectedDevice ?? detectedDevice;
  const isStandalone = useIsStandalone();
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt({ prompt: () => (e as unknown as { prompt: () => Promise<void> }).prompt() });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're using the app</h1>
          <p className="text-muted-foreground mb-8">
            Deuncify is already installed on your device. Enjoy!
          </p>
          <Link href="/">
            <button className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90">
              Open Deuncify
            </button>
          </Link>
        </div>
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-2">Install Deuncify</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Add Deuncify to your home screen for quick access – works offline after first load.
        </p>

        {/* Device selector */}
        <div className="flex gap-2 mb-12 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          {(["ios", "android", "desktop"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDevice(d)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                device === d ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {d === "ios" && <Smartphone className="w-4 h-4" />}
              {d === "android" && <Smartphone className="w-4 h-4" />}
              {d === "desktop" && <Monitor className="w-4 h-4" />}
              <span>{d === "ios" ? "iOS" : d === "android" ? "Android" : "Desktop"}</span>
            </button>
          ))}
        </div>

        {/* Instructions by device */}
        <div className="space-y-8">
          {device === "ios" && (
            <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span> Install on iPhone or iPad
              </h2>
              <p className="text-muted-foreground mb-4">
                You must use <strong className="text-white">Safari</strong> to install. Chrome and other browsers do not support "Add to Home Screen" on iOS.
              </p>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>Open this page in <strong className="text-white">Safari</strong></li>
                <li>Tap the <Share2 className="inline w-4 h-4 mx-1" /> Share button at the bottom</li>
                <li>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></li>
                <li>Tap <strong className="text-white">Add</strong> in the top right</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                If you're in another browser, copy the URL and paste it into Safari.
              </p>
            </section>
          )}

          {device === "android" && (
            <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span> Install on Android
              </h2>
              <p className="text-muted-foreground mb-4">
                Chrome will show an install prompt, or follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>Open this page in <strong className="text-white">Chrome</strong></li>
                <li>Tap the <MoreVertical className="inline w-4 h-4 mx-1" /> menu (three dots) in the top right</li>
                <li>Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong></li>
                <li>Confirm when prompted</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                If you don't see "Install app", try "Add to Home screen" from the menu.
              </p>
            </section>
          )}

          {device === "desktop" && (
            <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💻</span> Install on Desktop
              </h2>
              {deferredPrompt ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Your browser supports installing Deuncify as an app.
                  </p>
                  <button
                    onClick={() => deferredPrompt.prompt()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90"
                  >
                    <Plus className="w-5 h-5" />
                    Install Deuncify
                  </button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    <strong className="text-white">Chrome / Edge:</strong> Look for the install icon (⊕ or computer with arrow) in the address bar, then click it.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-white">Other browsers:</strong> Use "Add to Home screen" or "Create shortcut" from the browser menu.
                  </p>
                </>
              )}
            </section>
          )}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-2">Why install?</h2>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>• Quick access from your home screen</li>
            <li>• Works offline after first load</li>
            <li>• App-like experience without an app store</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
