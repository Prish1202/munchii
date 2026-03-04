import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_ROUTES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ArrowRight, Star, Coins, MessageCircle, Users, Shield, MapPin, Zap, Heart, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

const FEATURES = [
  {
    icon: MapPin,
    title: 'Pickup Only',
    description: 'No delivery fees. Pick up hot meals from campus kitchens. Save ₹₹₹ every order.',
    gradient: 'gradient-primary',
  },
  {
    icon: Coins,
    title: 'Earn Rewards',
    description: 'Get 4% back as coins on every order. Stack them, redeem them, share them.',
    gradient: 'gradient-coin',
  },
  {
    icon: MessageCircle,
    title: 'E2EE Chat',
    description: 'End-to-end encrypted messaging. Chat privately with fellow foodies.',
    gradient: 'gradient-social',
  },
  {
    icon: Users,
    title: 'Social Network',
    description: 'Follow friends, share coins, discover what your campus is eating.',
    gradient: 'gradient-mint',
  },
];

const TRUST_POINTS = [
  { icon: Shield, text: 'Built in India 🇮🇳' },
  { icon: Zap, text: 'Low platform fees' },
  { icon: Heart, text: 'Student-first ecosystem' },
  { icon: Shield, text: 'Data privacy focused' },
];

const STATS = [
  { value: '10K+', label: 'Students' },
  { value: '₹0', label: 'Delivery Fee' },
  { value: '4%', label: 'Cashback' },
  { value: '4.9', label: 'Rating', icon: Star },
];

export default function Index() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role]);
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-lg glow-primary">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">FoodyZone</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-primary border-0 font-semibold shadow-lg glow-primary">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-32">
        {/* Background blobs */}
        <div className="absolute top-10 right-0 w-96 h-96 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-social/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 bg-coin/8 rounded-full blur-[80px]" />
        
        <div className="container text-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-8 border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              Campus food, reimagined
            </div>
          </motion.div>
          
          <motion.h1
            className="text-5xl md:text-7xl font-display font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Order. Earn.{' '}
            <span className="text-gradient">Share.</span>{' '}
            Socialize.
          </motion.h1>
          
          <motion.p
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            The campus food network where every order earns you rewards.
            Pick up fresh meals, share coins with friends, and chat with fellow foodies.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Link to="/signup">
              <Button size="lg" className="gradient-primary border-0 text-base font-semibold shadow-xl glow-primary gap-2 h-14 px-8 rounded-2xl">
                Start Earning <Coins className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="text-base font-semibold gap-2 h-14 px-8 rounded-2xl border-2">
                Partner with us <UtensilsCrossed className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Floating badges */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            {TRUST_POINTS.map((point) => (
              <div key={point.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
                <point.icon className="w-3.5 h-3.5 text-accent" />
                {point.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-3xl md:text-4xl font-display font-bold text-gradient flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon && <Star className="w-5 h-5 fill-coin text-coin" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Not just food delivery</h2>
            <p className="text-muted-foreground mt-3 text-lg">A complete campus food ecosystem built for Gen-Z</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group relative p-6 rounded-3xl border bg-card hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className={`w-12 h-12 rounded-2xl ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/30 border-y">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3 text-lg">Three steps to campus food heaven</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Browse & Order', desc: 'Find your favorite campus food spots', emoji: '🍕' },
              { step: '02', title: 'Pick Up & Earn', desc: 'Grab your food. Get 4% back as coins', emoji: '🪙' },
              { step: '03', title: 'Share & Socialize', desc: 'Send coins to friends. Chat. Repeat.', emoji: '💬' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="text-5xl mb-4 animate-float" style={{ animationDelay: `${i * 0.3}s` }}>{item.emoji}</div>
                <div className="text-xs font-display font-bold text-primary mb-2">{item.step}</div>
                <h3 className="font-display font-bold text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px]" />
        <div className="container text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground">
            Your campus. Your food. Your rewards.
          </h2>
          <p className="mt-5 text-primary-foreground/80 max-w-lg mx-auto text-lg">
            Join the food revolution. No delivery fees, no data games — just great food and real rewards.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="mt-10 gap-2 text-base font-bold h-14 px-8 rounded-2xl shadow-xl">
              Join FoodyZone <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">FoodyZone</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 FoodyZone · Made with 🍕 in India · Student-first food network
          </p>
        </div>
      </footer>
    </div>
  );
}
