import { Link } from "wouter";
import { ArrowLeft, Check, Zap } from "lucide-react";

export default function Pricing() {
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
        <h1 className="text-4xl font-bold text-white mb-4">Pricing</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Remove silence from video free. No credit card required.
        </p>

        <div className="rounded-2xl border-2 border-primary/30 bg-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            Free
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Deuncify Free</h2>
              <p className="text-3xl font-bold text-white mt-1">$0 <span className="text-base font-normal text-muted-foreground">/ forever</span></p>
            </div>
          </div>
          <p className="text-muted-foreground mb-6">
            Full access to our AI silence remover for videos. Upload MP4 or MOV, trim pauses instantly, 
            and download your edited file. No hidden fees.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-400 shrink-0" />
              Remove awkward silences from videos
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-400 shrink-0" />
              Trim pauses in MP4 and MOV files
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-400 shrink-0" />
              No signup required for basic use
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-400 shrink-0" />
              Create account to save videos for 30 days
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-5 h-5 text-green-400 shrink-0" />
              Secure video uploads
            </li>
          </ul>
          <Link href="/?utm_source=pricing&utm_medium=cta&utm_campaign=start_free">
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:opacity-90 transition-opacity">
              Start Removing Silences Now – Free Trial
            </button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions? Check our <Link href="/how-it-works" className="text-primary hover:underline">How it works</Link> page.
        </p>
      </main>
    </div>
  );
}
