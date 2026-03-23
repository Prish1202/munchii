import { ArrowLeft, Mail, MapPin, Clock, Building2, Globe, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 pb-20 space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Link>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-3xl font-display font-bold">Contact Us</h1>
          <p className="text-muted-foreground mt-2">We'd love to hear from you. Reach out to us for any queries, feedback, or support.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Support */}
          <motion.div className="p-6 rounded-2xl border bg-card space-y-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold">General Support</h2>
            <p className="text-sm text-muted-foreground">For order issues, account help, or general queries</p>
            <a href="mailto:support.munchii.in@gmail.com" className="text-sm text-primary font-medium hover:underline block">
              support.munchii.in@gmail.com
            </a>
          </motion.div>

          {/* Grievance */}
          <motion.div className="p-6 rounded-2xl border bg-card space-y-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <div className="w-10 h-10 rounded-xl gradient-royal flex items-center justify-center">
              <Mail className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h2 className="font-display font-bold">Grievance Officer</h2>
            <p className="text-sm text-muted-foreground">For escalated concerns or formal complaints</p>
            <a href="mailto:munchii.in.prm@gmail.com" className="text-sm text-primary font-medium hover:underline block">
              munchii.in.prm@gmail.com
            </a>
            <p className="text-xs text-muted-foreground">Response within 24 hours · Resolution within 15 business days</p>
          </motion.div>
        </div>

        {/* Business Info */}
        <motion.div className="p-6 rounded-2xl border bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
          <h2 className="font-display font-bold text-lg mb-4">Business Information</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Munchii</p>
                <p className="text-muted-foreground">Sole Proprietorship · Owner: Krish Gautam</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Registered Address</p>
                <p className="text-muted-foreground">8th Floor, Tirupati Apartment, Bikaner, Rajasthan — 334001, India</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">GSTIN</p>
                <p className="text-muted-foreground">08ETJPG5027D1ZU</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Website</p>
                <p className="text-muted-foreground">munchii.in</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Phone</p>
                <a href="tel:+919461456707" className="text-primary hover:underline">+91 94614 56707</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Support Hours</p>
                <p className="text-muted-foreground">Monday to Saturday, 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">© 2026 Munchii · Made with 🍕 in India</p>
      </div>
    </div>
  );
}
