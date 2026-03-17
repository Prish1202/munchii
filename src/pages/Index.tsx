import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_ROUTES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ArrowRight, Star, Coins, MessageCircle, Users, Shield, MapPin, Zap, Heart, Sparkles, Trophy, Gift, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from 'framer-motion';

/* ───── animation variants ───── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  })
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

/* ───── data ───── */
const FEATURES = [
  { icon: MapPin, title: 'Pickup Only', description: 'Zero delivery fees. Walk up, grab your hot meal, and save more on every order.', gradient: 'gradient-primary' },
  { icon: Coins, title: 'Reward Points', description: 'Earn 3% points on every order. Use them on your next meal — 1 point = ₹1.', gradient: 'gradient-coin' },
  { icon: MessageCircle, title: 'E2EE Chat', description: 'End-to-end encrypted messaging. Chat privately with fellow foodies on campus.', gradient: 'gradient-social' },
  { icon: Users, title: 'Social Network', description: 'Follow friends, share points with them, discover what your campus is eating.', gradient: 'gradient-mint' },
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

/* ───── Animated Counter ───── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  const display = useTransform(springVal, (v) => `${Math.round(v)}${suffix}`);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ───── Floating 3D coin ───── */
function FloatingCoin({ delay = 0, className = '' }: { delay?: number; className?: string }) {
  return (
    <motion.div
      className={`absolute w-10 h-10 rounded-full gradient-coin shadow-lg glow-coin flex items-center justify-center text-lg font-bold text-primary-foreground ${className}`}
      animate={{ y: [0, -15, 0], rotateY: [0, 360] }}
      transition={{ y: { duration: 3, repeat: Infinity, delay }, rotateY: { duration: 4, repeat: Infinity, delay, ease: "linear" } }}
      style={{ perspective: 600 }}
    >
      ₹
    </motion.div>
  );
}

/* ───── Parallax wrapper ───── */
function ParallaxSection({ children, offset = 50 }: { children: React.ReactNode; offset?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return <motion.div ref={ref} style={{ y }}>{children}</motion.div>;
}

/* ───── Gamification Demo Card ───── */
function GamificationShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {/* Coin Wallet Card */}
      <motion.div variants={scaleIn} className="relative p-6 rounded-3xl border bg-card/80 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
            <Coins className="w-16 h-16 text-coin" />
          </motion.div>
        </div>
        <div className="w-12 h-12 rounded-2xl gradient-coin flex items-center justify-center mb-4 shadow-lg">
          <Gift className="w-6 h-6 text-primary-foreground" />
        </div>
        <h3 className="font-display font-bold text-lg">Earn & Spend</h3>
        <p className="text-muted-foreground text-sm mt-1">Watch your coins pile up with every order</p>
        <div className="mt-4 flex items-center gap-2">
          <motion.div
            className="text-3xl font-display font-bold text-coin"
            animate={inView ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            +42
          </motion.div>
          <span className="text-sm text-muted-foreground">pts earned</span>
        </div>
        {/* Animated coin particles */}
        {inView && [0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-coin/60"
            initial={{ opacity: 0, y: 60, x: 30 + i * 20 }}
            animate={{ opacity: [0, 1, 0], y: [60, -20], x: [30 + i * 20, 40 + i * 15] }}
            transition={{ duration: 1.2, delay: 0.8 + i * 0.2, ease: "easeOut" }}
          />
        ))}
      </motion.div>

      {/* Leaderboard Card */}
      <motion.div variants={scaleIn} className="p-6 rounded-3xl border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-4 shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-display font-bold text-lg">Leaderboard</h3>
        <p className="text-muted-foreground text-sm mt-1">Climb the ranks on your campus</p>
        <div className="mt-4 space-y-2">
          {['Arjun', 'Priya', 'You'].map((name, i) => (
            <motion.div
              key={name}
              className={`flex items-center gap-2 p-2 rounded-xl text-sm ${i === 2 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1 + i * 0.2 }}
            >
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                i === 1 ? 'bg-slate-300 text-white' : 'bg-primary text-primary-foreground'
              }`}>
                {i + 1}
              </span>
              <span className="font-semibold">{name}</span>
              {i === 2 && (
                <motion.span
                  className="ml-auto text-xs text-primary font-bold"
                  animate={inView ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.6, delay: 1.8 }}
                >
                  ↑ Promoted!
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Order Celebration Card */}
      <motion.div variants={scaleIn} className="relative p-6 rounded-3xl border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
        <h3 className="font-display font-bold text-lg">Celebrations</h3>
        <p className="text-muted-foreground text-sm mt-1">Every order is a mini party 🎉</p>
        <div className="mt-4 relative h-20 flex items-center justify-center">
          <motion.div
            className="text-5xl"
            animate={inView ? { scale: [0, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            🎉
          </motion.div>
          {inView && ['🍕', '⭐', '🔥', '💰'].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-xl"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.5], x: [0, (i % 2 ? 1 : -1) * (30 + i * 10)], y: [0, -(20 + i * 12)] }}
              transition={{ duration: 1.2, delay: 1.5 + i * 0.15 }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ───── Main Page ───── */
export default function Index() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  useEffect(() => {
    if (isAuthenticated && user) navigate(ROLE_ROUTES[user.role]);
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Header */}
      <motion.header
        className="sticky top-0 z-50 border-b transition-colors"
        style={{ backgroundColor: useTransform(headerBg, (v) => `hsl(var(--card) / ${0.6 + v * 0.3})`) }}
      >
        <div className="container flex h-16 items-center justify-between backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-lg glow-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </motion.div>
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
      </motion.header>

      {/* Hero */}
      <section ref={heroRef} className="relative py-24 md:py-36">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-10 right-10 w-[500px] h-[500px] bg-hero-orb-1 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-hero-orb-2 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-hero-orb-3 rounded-full blur-[90px]"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          />
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

          {/* Floating food emojis with parallax */}
          {['🍕', '🍔', '🧋', '🍜', '🥗', '🍱'].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl md:text-4xl"
              style={{ top: `${15 + i * 14}%`, left: `${5 + (i * 17) % 85}%` }}
              animate={{ y: [0, -20, 0], rotate: [0, i % 2 ? 10 : -10, 0], opacity: [0.12, 0.25, 0.12] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.4 }}
            >
              {emoji}
            </motion.div>
          ))}

          {/* Floating coins */}
          <FloatingCoin delay={0} className="top-[20%] right-[8%] hidden md:flex" />
          <FloatingCoin delay={1.5} className="bottom-[25%] left-[12%] hidden md:flex" />
        </div>

        <div className="container text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-8 border border-border"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Campus food, reimagined
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight max-w-5xl mx-auto leading-[1.05]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Order. Earn.{' '}
            <span className="text-gradient relative">
              Share.
              <motion.span
                className="absolute -right-4 -top-4 text-2xl"
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.span>
            </span>{' '}
            <br className="hidden md:block" />
            Socialize.
          </motion.h1>

          <motion.p
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Your campus food network — order takeaway, collect reward points on every meal,
            share them with friends, and connect with fellow foodies.{' '}
            <span className="font-semibold text-foreground">1 point = ₹1.</span>
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="gradient-primary border-0 text-base font-semibold shadow-xl glow-primary gap-2 h-14 px-8 rounded-2xl">
                  Order Now <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="outline" className="text-base font-semibold gap-2 h-14 px-8 rounded-2xl border-2">
                  Partner with us <UtensilsCrossed className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            {TRUST_POINTS.map((point, i) => (
              <motion.div
                key={point.text}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground"
                whileHover={{ scale: 1.08, y: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <point.icon className="w-3.5 h-3.5 text-accent" />
                {point.text}
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-16 flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-muted-foreground/40" />
          </motion.div>
        </div>
      </section>

      {/* Stats with animated counters */}
      <section className="py-14 border-y bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.04]" />
        <div className="container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-5xl font-display font-bold text-gradient flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon && <Star className="w-5 h-5 fill-coin text-coin" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1.5 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with parallax */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-hero-orb-2 rounded-full blur-[150px] opacity-50" />
        <div className="container relative">
          <ParallaxSection offset={30}>
            <div className="text-center mb-16">
              <motion.h2
                className="text-3xl md:text-5xl font-display font-bold"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                More than just ordering food
              </motion.h2>
              <motion.p
                className="text-muted-foreground mt-3 text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                A complete campus food ecosystem built for Gen-Z
              </motion.p>
            </div>
          </ParallaxSection>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group relative p-7 rounded-3xl border bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500"
                initial={{ opacity: 0, y: 30, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-accent/5" />
                <motion.div
                  className={`w-14 h-14 rounded-2xl ${feature.gradient} flex items-center justify-center mb-5 shadow-lg relative z-10`}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-display font-bold relative z-10">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed relative z-10">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Showcase */}
      <section className="py-24 bg-secondary/30 border-y relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
        <div className="container relative">
          <ParallaxSection offset={20}>
            <div className="text-center mb-16">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coin/10 text-coin text-sm font-bold mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Gamified Experience
              </motion.div>
              <motion.h2
                className="text-3xl md:text-5xl font-display font-bold"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Food ordering, but make it <span className="text-gradient">fun</span>
              </motion.h2>
              <motion.p
                className="text-muted-foreground mt-3 text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Points, leaderboards, celebrations — every bite is rewarding
              </motion.p>
            </div>
          </ParallaxSection>
          <GamificationShowcase />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative overflow-hidden">
        <div className="container relative">
          <ParallaxSection offset={25}>
            <div className="text-center mb-16">
              <motion.h2
                className="text-3xl md:text-5xl font-display font-bold"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                How it works
              </motion.h2>
              <motion.p
                className="text-muted-foreground mt-3 text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Three steps to campus food heaven
              </motion.p>
            </div>
          </ParallaxSection>

          <div className="grid md:grid-cols-3 gap-10 max-w-3xl mx-auto relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20" />

            {[
              { step: '01', title: 'Browse & Order', desc: 'Find your favorite campus food spots and place your order', emoji: '🍕' },
              { step: '02', title: 'Pick Up & Collect', desc: 'Grab your food and collect 3% reward points', emoji: '🎯' },
              { step: '03', title: 'Share & Connect', desc: 'Share points with friends. Chat with foodies. Repeat!', emoji: '💬' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="text-center relative"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              >
                <motion.div
                  className="text-6xl mb-5 inline-block"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  whileHover={{ scale: 1.3, rotate: 10 }}
                >
                  {item.emoji}
                </motion.div>
                <motion.div
                  className="text-xs font-display font-bold text-primary mb-2 tracking-wider"
                  whileInView={{ scale: [0.8, 1.1, 1] }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 + 0.3 }}
                >
                  STEP {item.step}
                </motion.div>
                <h3 className="font-display font-bold text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-1.5">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-foreground/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[80px]"
          animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        <div className="container text-center relative z-10">
          <motion.h2
            className="text-3xl md:text-6xl font-display font-bold text-primary-foreground"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Your campus. Your food.{' '}
            <br className="hidden md:block" />
            Your points.
          </motion.h2>
          <motion.p
            className="mt-5 text-primary-foreground/80 max-w-lg mx-auto text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join the food revolution. No delivery fees, no data games — just great food and points you can actually use.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.08, y: -3 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="mt-10 gap-2 text-base font-bold h-14 px-8 rounded-2xl shadow-xl">
                  Order Now <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/community-guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Munchii · Made with 🍕 in India
          </p>
        </div>
      </footer>
    </div>
  );
}
