import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-US")}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Deuncify (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Description of Service</h2>
            <p>
              Deuncify is a web-based video processing tool that automatically removes silence and pauses from video
              content. You may upload videos, process them, and download the edited results. Some features require an
              account; basic processing is available without registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Only upload content you own or have the right to modify</li>
              <li>Not use the Service for illegal purposes or to infringe on others&apos; rights</li>
              <li>Not upload malicious files, viruses, or content that harms the Service or other users</li>
              <li>Keep your account credentials secure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Intellectual Property</h2>
            <p>
              You retain ownership of any content you upload. By using the Service, you grant us a limited license to
              process your content solely to provide the Service. Deuncify, its branding, and technology remain our
              property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Data Retention</h2>
            <p>
              Processed videos stored in your account are kept for approximately 30 days, after which they may be
              deleted. We do not guarantee indefinite storage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted service. The Service may be modified,
              suspended, or discontinued at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Limitation of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE
              OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Contact</h2>
            <p>
              Questions about these Terms? Contact us through the contact information provided on our website.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
