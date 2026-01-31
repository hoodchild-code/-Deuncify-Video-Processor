import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-US")}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as email address and password when you create an
              account. We also collect video files you upload for processing, which are processed on our servers and
              stored temporarily for account holders.
            </p>
            <p className="mt-2">
              We automatically collect certain technical data, including IP address, browser type, and usage information
              to operate and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your videos and deliver results</li>
              <li>Authenticate your account and communicate with you</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Third-Party Services</h2>
            <p>
              We use Supabase for authentication and user management. Supabase processes your email and account data
              according to their privacy policy. Video processing occurs on our infrastructure; we do not share your
              videos with third parties for advertising or other purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Data Retention</h2>
            <p>
              Processed videos linked to your account are stored for approximately 30 days, then deleted. Account
              information is retained while your account is active. You may request deletion of your account and
              associated data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Cookies and Similar Technologies</h2>
            <p>
              We use essential cookies and similar technologies to enable authentication and maintain your session. Our
              auth provider (Supabase) may set cookies for sign-in functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your data. However, no method of transmission over
              the internet is 100% secure. Use the Service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal data. Contact
              us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Children</h2>
            <p>
              The Service is not intended for users under 13. We do not knowingly collect personal information from
              children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the
              updated policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. Contact</h2>
            <p>
              For questions about this Privacy Policy or your data, please contact us through the contact information
              provided on our website.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
