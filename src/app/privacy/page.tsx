import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy text-text-primary">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-orange transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange to-violet flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl">Privacy Policy</h1>
        </div>

        <p className="text-sm text-text-tertiary mb-10">
          Last updated: October 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-text-secondary">
          <Section title="1. Introduction">
            Vidya AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an AI-powered education platform
            designed for students and institutions in India. We are committed to protecting
            your privacy and handling your data responsibly. This Privacy Policy explains
            what information we collect, how we use it, and your rights regarding your data.
          </Section>

          <Section title="2. Information We Collect">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-text-primary">Account Information:</strong> Name, email address,
                institution, major/branch, semester, and preferred language. We do not collect
                phone numbers, government IDs, or payment information.
              </li>
              <li>
                <strong className="text-text-primary">Academic Data:</strong> Questions you ask, quiz
                responses, flashcard progress, study plans, and performance analytics — all used
                solely to personalise your learning experience.
              </li>
              <li>
                <strong className="text-text-primary">Vault Mode Data (optional):</strong> When you
                voluntarily enable Vault Mode for a quiz, the app may capture webcam snapshots
                and tab-focus events. These are analysed in real-time for integrity purposes and
                are <strong>not</strong> stored permanently.
              </li>
              <li>
                <strong className="text-text-primary">Usage Metadata:</strong> AI model usage (token
                counts), XP, streaks, and session timestamps — used for analytics and fair-usage
                enforcement.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Provide and personalise AI tutoring, quizzes, flashcards, and career guidance.</li>
              <li>Track academic progress and generate performance analytics for you and your institution.</li>
              <li>Enforce fair-use limits on AI features.</li>
              <li>Improve the platform&apos;s educational quality.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> use your data for advertising, sell it to third parties,
              or share it with data brokers.
            </p>
          </Section>

          <Section title="4. Third-Party Services">
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-text-primary">Supabase:</strong> Authentication and database
                hosting. Your data is stored in Supabase-managed infrastructure with encryption
                at rest and in transit.
              </li>
              <li>
                <strong className="text-text-primary">Google Gemini API:</strong> AI-powered features
                (doubt solving, quiz generation, interview practice, etc.). Prompts and responses
                are sent to Google&apos;s API. We do not send your name, email, or other personal
                identifiers to Google.
              </li>
              <li>
                <strong className="text-text-primary">Vercel:</strong> Application hosting. Vercel
                processes HTTP requests but does not have direct access to your stored data.
              </li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <p>We implement multiple layers of security:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>All traffic is encrypted via HTTPS/TLS.</li>
              <li>Authentication uses server-validated JWTs with PKCE flow.</li>
              <li>API endpoints are protected by rate limiting, input validation, and prompt-injection detection.</li>
              <li>Row-Level Security (RLS) ensures users can only access their own data.</li>
              <li>Security headers (CSP, HSTS, X-Frame-Options) are enforced on every response.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            Your academic data is retained as long as your account is active. Vault Mode
            snapshots are processed in real-time and are not stored after analysis. You may
            request deletion of your account and all associated data by contacting your
            institution administrator.
          </Section>

          <Section title="7. Children&apos;s Privacy">
            Vidya AI is designed for higher-education students (typically 17+). We do not
            knowingly collect data from children under 13. If you believe a child under 13
            has created an account, please contact us so we can remove it.
          </Section>

          <Section title="8. Your Rights">
            Under applicable Indian data protection law, you have the right to:
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access your personal data.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Withdraw consent for optional features (e.g. Vault Mode).</li>
            </ul>
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy from time to time. Changes will be posted on
            this page with an updated &quot;Last updated&quot; date. Continued use of the platform
            after changes constitutes acceptance of the revised policy.
          </Section>

          <Section title="10. Contact">
            If you have questions about this Privacy Policy or your data, please reach out
            to your institution&apos;s Vidya AI administrator or contact us at the email address
            provided by your institution.
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-text-tertiary">
          &copy; {new Date().getFullYear()} Vidya AI. All rights reserved.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-lg text-text-primary mb-3">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
