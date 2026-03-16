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
    description: 'Zero delivery fees. Walk up, grab your hot meal, and save more on every order.',
    gradient: 'gradient-primary',
  },
  {
    icon: Coins,
    title: 'Reward Points',
    description: 'Earn 3% points on every order. Use them on your next meal — 1 point = ₹1.',
    gradient: 'gradient-coin',
  },
  {
    icon: MessageCircle,
    title: 'E2EE Chat',
    description: 'End-to-end encrypted messaging. Chat privately with fellow foodies on campus.',
    gradient: 'gradient-social',
  },
  {
    icon: Users,
    title: 'Social Network',
    description: 'Follow friends, share points with them, discover what your campus is eating.',
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
  { value: '3%', label: 'Points Back' },
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
            <span className="font-display font-bold text-xl">Munchii</span>
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
        {/* Decorative background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-hero-orb-1 rounded-full blur-[120px] animate-pulse-soft" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-hero-orb-2 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-hero-orb-3 rounded-full blur-[90px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
          
          {/* Floating food emojis */}
          <div className="absolute top-20 left-[10%] text-4xl animate-float opacity-20" style={{ animationDelay: '0s' }}>🍕</div>
          <div className="absolute top-32 right-[15%] text-3xl animate-float opacity-15" style={{ animationDelay: '0.5s' }}>🍔</div>
          <div className="absolute bottom-32 left-[20%] text-3xl animate-float opacity-15" style={{ animationDelay: '1s' }}>🧋</div>
          <div className="absolute bottom-20 right-[10%] text-4xl animate-float opacity-20" style={{ animationDelay: '1.5s' }}>🍜</div>
          <div className="absolute top-1/2 left-[5%] text-2xl animate-float opacity-10" style={{ animationDelay: '2s' }}>🥗</div>
        </div>
        
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
            Your campus food network — order takeaway, collect reward points on every meal,
            share them with friends, and connect with fellow foodies. 1 point = ₹1.
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
                Order Now <ArrowRight className="w-5 h-5" />
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
      <section className="py-12 border-y bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.04]" />
        <div className="container relative">
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
      <section className="py-20 md:py-28 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-hero-orb-2 rounded-full blur-[150px] opacity-50" />
        <div className="container relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">More than just ordering food</h2>
            <p className="text-muted-foreground mt-3 text-lg">A complete campus food ecosystem built for Gen-Z</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group relative p-6 rounded-3xl border bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
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
      <section className="py-20 bg-secondary/30 border-y relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="container relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">How it works</h2>
            <p className="text-muted-foreground mt-3 text-lg">Three steps to campus food heaven</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Browse & Order', desc: 'Find your favorite campus food spots and place your order', emoji: '🍕' },
              { step: '02', title: 'Pick Up & Collect', desc: 'Grab your food and collect 3% reward points', emoji: '🎯' },
              { step: '03', title: 'Share & Connect', desc: 'Share points with friends. Chat with foodies. Repeat!', emoji: '💬' },
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-foreground/5 rounded-full blur-[60px]" />
        <div className="container text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground">
            Your campus. Your food. Your points.
          </h2>
          <p className="mt-5 text-primary-foreground/80 max-w-lg mx-auto text-lg">
            Join the food revolution. No delivery fees, no data games — just great food and points you can actually use.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="mt-10 gap-2 text-base font-bold h-14 px-8 rounded-2xl shadow-xl">
              Order Now <ArrowRight className="w-5 h-5" />
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
            <span className="font-display font-bold">Munchii</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Munchii · Made with 🍕 in India · Student-first food network
          </p>
        </div>
      </footer>
    </div>
  );
}
