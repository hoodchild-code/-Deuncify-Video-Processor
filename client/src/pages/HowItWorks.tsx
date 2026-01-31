import { Link } from "wouter";
import { ArrowLeft, Upload, Zap, Download, Mic, Video, Music } from "lucide-react";

export default function HowItWorks() {
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
        <h1 className="text-4xl font-bold text-white mb-4">How Deuncify Works: AI Silence Remover for Videos</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Learn how our AI-powered tool removes awkward silences from your videos in seconds. 
          Perfect for podcasters, YouTubers, and TikTok creators.
        </p>

        <div className="mb-12 rounded-2xl overflow-hidden border border-white/10">
          <img
            src="/og-image.png"
            alt="AI removing silence from podcast video – Deuncify processes audio to detect and trim awkward pauses"
            className="w-full h-auto"
            width={1200}
            height={630}
          />
        </div>

        <div className="prose prose-invert max-w-none space-y-12 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What Is Deuncify?</h2>
            <p>
              Deuncify is a free AI video editor silence remover that automatically detects and removes awkward 
              silences, pauses, and dead air from your video content. Whether you record podcasts, YouTube videos, 
              TikTok clips, or interview content, our tool helps you trim pauses in MP4 and MOV files with one click. 
              No manual scrubbing through timelines – our AI does the work for you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Three Simple Steps to Remove Silence from Video Free</h2>
            <div className="space-y-8 mt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">1. Upload Your Video</h3>
                  <p>
                    Drag and drop your MP4 or MOV file into the upload zone, or click to browse. Our secure video 
                    upload system accepts files up to 500MB. You don&apos;t need an account to try it – just upload and go. 
                    For signed-in users, we&apos;ll save your processed videos for 30 days so you can re-download anytime.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">2. AI Analyzes & Trims</h3>
                  <p>
                    Our AI silence detection analyzes your audio track in real time. It identifies when you start 
                    speaking versus when there&apos;s silence (the &quot;millennial pause&quot; at the start, awkward gaps, or dead air). 
                    We use a smart decibel threshold to detect speech onset, then trim the silence while keeping a 
                    0.1-second buffer so your words don&apos;t sound clipped. Processing typically takes just a few seconds.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">3. Download Your Edited Video</h3>
                  <p>
                    Once processing is complete, preview your trimmed video and hit Download. You&apos;ll get a clean 
                    MP4 file ready to publish. That&apos;s it – remove silence from video free, no editing software required.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Use Cases: Who Benefits from an AI Silence Remover?</h2>
            <p>
              Our automatic silence cutter works for any creator who records video or audio. Here are the most 
              common use cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-white">Podcasters:</strong> Remove awkward silence at the start of episodes 
                and trim long pauses between segments. Cut editing time from hours to minutes.
              </li>
              <li>
                <strong className="text-white">YouTubers:</strong> Use an automatic silence cutter for YouTube to 
                remove dead air from talking heads, vlogs, and tutorials. Improve viewer engagement by keeping 
                content punchy.
              </li>
              <li>
                <strong className="text-white">TikTok & Short-Form Creators:</strong> Remove millennial pause from 
                TikTok videos so your hook lands immediately. Every second counts in short-form content.
              </li>
              <li>
                <strong className="text-white">Interviewers & Educators:</strong> Trim awkward silences in interviews 
                or lecture recordings. Professional output without manual timeline editing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Benefits of Using Deuncify</h2>
            <p>
              Choosing an AI silence remover for videos over manual editing delivers clear benefits:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-white">Faster editing:</strong> What used to take 30+ minutes of scrubbing 
                now takes seconds. Focus on creating, not cutting.
              </li>
              <li>
                <strong className="text-white">Improved viewer engagement:</strong> Viewers bounce when content 
                drags. Removing dead air keeps pacing tight and retention higher.
              </li>
              <li>
                <strong className="text-white">No software to learn:</strong> No Premiere, DaVinci, or Audacity – 
                just upload and download. Works in the browser.
              </li>
              <li>
                <strong className="text-white">Free to use:</strong> Remove silence from video free. Create an 
                account to save your videos for 30 days, or process without signing up.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our AI Technology</h2>
            <p>
              Deuncify uses smart audio analysis to detect when speech begins. We analyze decibel levels across 
              your audio track and identify the transition from silence to speech. Our algorithm keeps a small 
              buffer so natural breath and articulation aren&apos;t clipped – you get clean cuts without robotic 
              sounding edits. It&apos;s designed for spoken content: podcasts, vlogs, interviews, and social media. 
              <Link href="/" className="text-primary hover:underline ml-1">Try it now</Link> and see the difference.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Keywords You Might Be Searching For</h2>
            <p>
              If you&apos;re looking for ways to remove silence from video free, trim pauses in MP4, use an AI video 
              editor silence remover, get an automatic silence cutter for YouTube, or remove millennial pause from 
              TikTok videos – you&apos;re in the right place. Deuncify does all of that.
            </p>
          </section>
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Remove Awkward Silences?</h2>
          <p className="text-muted-foreground mb-6">
            Upload your video and get a trimmed MP4 in seconds. No signup required.
          </p>
          <Link href="/?utm_source=how_it_works&utm_medium=cta&utm_campaign=get_started">
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-opacity">
              Start Removing Silences Now – Free
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
