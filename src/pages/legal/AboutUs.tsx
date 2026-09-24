import { ArrowLeft, UtensilsCrossed, MapPin, Mail, Building2, Heart, Target, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 pb-20 space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Link>

        {/* Hero */}
        <motion.div className="text-center space-y-4" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mx-auto">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">About Munchii</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your campus food network — built by students, for students. We're reimagining how you order, earn, share, and socialize around food.
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div className="p-6 rounded-2xl border bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg mb-2">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To create a seamless, affordable, and social food ordering experience for college students across India — starting with zero delivery fees and real reward points that matter.
            </p>
          </motion.div>

          <motion.div className="p-6 rounded-2xl border bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <div className="w-10 h-10 rounded-xl gradient-royal flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg mb-2">Our Vision</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To become India's largest student-first food community where every meal is an opportunity to earn, share, and connect with your campus tribe.
            </p>
          </motion.div>
        </div>

        {/* What Makes Us Different */}
        <motion.div className="p-6 rounded-2xl border bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
          <div className="w-10 h-10 rounded-xl gradient-coin flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg mb-3">What Makes Munchii Different?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { emoji: '🍕', title: 'Pickup Only', desc: 'Zero delivery fees — walk up and grab your fresh meal' },
              { emoji: '💰', title: 'Real Rewards', desc: 'Earn 3% points on every order. 1 point = ₹1. Use or share them!' },
              { emoji: '⏱️', title: 'Skip the Wait', desc: 'Pre-order and pick a pickup window — your food is ready when you arrive' },
              { emoji: '🔐', title: 'Secure Pickup', desc: 'A 4-digit code makes sure only you collect your order' },
              { emoji: '🏫', title: 'Campus Focused', desc: 'Discover the best food spots near your campus' },
              { emoji: '🔒', title: 'Privacy First', desc: 'Your data stays yours. No tracking, no selling, no compromises' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Founder */}
        <motion.div className="p-6 rounded-2xl border bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}>
          <h2 className="font-display font-bold text-lg mb-3">Founded By</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-royal flex items-center justify-center text-2xl font-display font-bold text-secondary-foreground">
              K
            </div>
            <div>
              <h3 className="font-semibold">Krish Gautam</h3>
              <p className="text-sm text-muted-foreground">Founder & Owner</p>
            </div>
          </div>
        </motion.div>

        {/* Business Details */}
        <motion.div className="p-6 rounded-2xl border bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}>
          <h2 className="font-display font-bold text-lg mb-4">Business Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Registered Business Name</p>
                <p className="text-muted-foreground">Munchii — Sole Proprietorship</p>
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
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Support Email</p>
                <a href="mailto:support.munchii.in@gmail.com" className="text-primary hover:underline">support.munchii.in@gmail.com</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Grievance Officer</p>
                <a href="mailto:munchii.in.prm@gmail.com" className="text-primary hover:underline">munchii.in.prm@gmail.com</a>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">© 2026 Munchii · Made with 🍕 in India</p>
      </div>
    </div>
  );
}
