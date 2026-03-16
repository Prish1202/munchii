import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 pb-20 space-y-8">
        <Link to="/customer/profile/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Link>

        <div>
          <h1 className="text-3xl font-display font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 16, 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing or using Munchii ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">2. Description of Service</h2>
            <p>Munchii is a campus-based social food pre-order platform that connects students with nearby food vendors for pickup orders. The platform also provides social features including messaging, reward points, and community interactions.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 16 years of age to use the Platform.</li>
              <li>One person may only maintain one account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">4. Orders & Payments</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All orders are for self-pickup only. Munchii does not provide delivery services.</li>
              <li>A platform fee of ₹4 is charged per order.</li>
              <li>Payments can be made via Cash on Pickup (COD) or online payment methods.</li>
              <li>Once an order is accepted by the restaurant, cancellation is at the restaurant's discretion.</li>
              <li>Munchii is not responsible for food quality — that responsibility lies with the restaurant partner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">5. Reward Points</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Users earn 3% reward points on every completed order.</li>
              <li>1 point = ₹1 and can be used for future orders (up to 50% of order value).</li>
              <li>Points are non-transferable to cash and are for in-app use only.</li>
              <li>Munchii reserves the right to modify the rewards program at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">6. Prohibited Conduct</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harassment, abuse, or threatening behavior toward other users or restaurant partners.</li>
              <li>Creating fake accounts or manipulating the rewards system.</li>
              <li>Sharing explicit, violent, or illegal content.</li>
              <li>Impersonating another person or entity.</li>
              <li>Attempting to exploit platform vulnerabilities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">7. Termination</h2>
            <p>Munchii reserves the right to suspend or terminate your account at any time for violations of these Terms, without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">8. Limitation of Liability</h2>
            <p>Munchii is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">9. Contact</h2>
            <p>For any questions regarding these Terms, contact us at <a href="mailto:munchii.in.prm@gmail.com" className="text-primary hover:underline">munchii.in.prm@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
