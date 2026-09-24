import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 pb-20 space-y-8">
        <Link to="/customer/profile/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Link>

        <div>
          <h1 className="text-3xl font-display font-bold">Community Guidelines</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 16, 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold">Our Mission</h2>
            <p>Munchii is built for students, by students. We want to create a safe, respectful, and fun campus food community. These guidelines help ensure everyone has a positive experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">Be Respectful</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Treat everyone with dignity and respect — fellow users, restaurant partners, and staff.</li>
              <li>No hate speech, discrimination, or bullying based on race, gender, religion, sexuality, or any other characteristic.</li>
              <li>Disagreements are natural, but keep interactions civil and constructive.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">Keep It Safe</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do not share personal information of others without their consent.</li>
              <li>Be courteous to restaurant staff when collecting your order.</li>
              <li>Report any suspicious or harmful behavior immediately.</li>
              <li>Do not post reviews that are violent, sexually explicit, or illegal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">Be Honest</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use your real identity. Do not impersonate others.</li>
              <li>Do not create fake accounts or engage in fraudulent activities.</li>
              <li>Do not manipulate the Coins rewards system or exploit platform features.</li>
              <li>Leave genuine reviews based on your actual orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">Reporting & Enforcement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Contact support to report violations or problems with an order.</li>
              <li>Our team reviews all reports within 24 hours.</li>
              <li>Violations may result in warnings, temporary suspension, or permanent ban.</li>
              <li>Severe violations (threats, illegal content) result in immediate account termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold">Grievance Officer</h2>
            <p>If you have concerns about content or user behavior, contact our Grievance Officer:</p>
            <p><a href="mailto:munchii.in.prm@gmail.com" className="text-primary hover:underline">munchii.in.prm@gmail.com</a></p>
            <p className="text-muted-foreground text-sm">We aim to acknowledge grievances within 24 hours and resolve within 15 business days.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
