import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 pb-20 space-y-8">
        <Link to="/customer/profile/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Link>

        <div>
          <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 16, 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Name, email, phone number, campus/university, and profile photo.</li>
              <li><strong>Order Data:</strong> Order history, payment method preferences, and pickup times.</li>
              <li><strong>Usage Data:</strong> App interactions, device information, and analytics for improving our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the Munchii platform and services.</li>
              <li>To process orders and facilitate payments.</li>
              <li>To manage your reward points and wallet.</li>
              <li>To send order updates and important notifications.</li>
              <li>To maintain platform safety and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">3. Data Sharing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We share your name and phone number with restaurant partners only for order fulfillment.</li>
              <li>We do not sell your personal data to third parties.</li>
              <li>We may share data with law enforcement if required by law.</li>
              <li>Payment processing is handled by Razorpay — refer to their privacy policy for payment data handling.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">4. Data Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All data is transmitted over encrypted connections (HTTPS/TLS).</li>
              <li>Payments are processed securely by Razorpay; we never store your card or UPI details.</li>
              <li>We use industry-standard security practices to protect your data.</li>
              <li>Access to user data is restricted to authorized personnel only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">5. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You can access and update your personal information at any time through profile settings.</li>
              <li>You can request deletion of your account and associated data.</li>
              <li>You can opt out of non-essential notifications.</li>
              <li>You have the right to data portability as per applicable laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Upon account deletion, we remove personal data within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">7. Cookies & Analytics</h2>
            <p>We use essential cookies for authentication and session management. We may use anonymized analytics to improve the platform experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of significant changes through the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">9. Contact</h2>
            <p>For privacy-related inquiries, contact our Grievance Officer at <a href="mailto:munchii.in.prm@gmail.com" className="text-primary hover:underline">munchii.in.prm@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
