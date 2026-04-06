'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowRight, BarChart3, Zap, BookOpen, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Notes',
    description: 'Automatically generate comprehensive study notes from any YouTube video',
  },
  {
    icon: BarChart3,
    title: 'Smart Quizzes',
    description: 'Test your knowledge with AI-generated quizzes tailored to the content',
  },
  {
    icon: BookOpen,
    title: 'Learning Analytics',
    description: 'Track your progress with detailed insights and learning statistics',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with other learners and share your study materials',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="container max-w-screen-2xl px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 text-center"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              >
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  NoteTube
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Turn Videos Into Notes
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl"
              >
                Transform any YouTube video into comprehensive study notes and interactive quizzes using advanced AI. Supercharge your learning journey today.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button size="lg" asChild className="gap-2">
                <Link href={isAuthenticated ? '/dashboard' : '/signup'}>
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-2 gap-4 pt-8 md:grid-cols-4 md:gap-8"
            >
              {[
                { label: 'Videos Processed', value: '10K+' },
                { label: 'Hours Saved', value: '50K+' },
                { label: 'Active Learners', value: '5K+' },
                { label: 'Success Rate', value: '98%' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="space-y-1"
                >
                  <p className="text-2xl font-bold md:text-3xl">{stat.value}</p>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/40 py-20">
        <div className="container max-w-screen-2xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-12"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Powerful Features for Better Learning
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to transform your educational content into actionable learning
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={item}
                  whileHover={{ translateY: -5 }}
                  className="group relative rounded-lg border border-border/40 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl" />
        </div>

        <div className="container max-w-screen-2xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="rounded-lg border border-border/40 bg-card p-8 text-center md:p-12"
          >
            <h2 className="text-3xl font-bold md:text-4xl mb-4">
              Ready to Study Smarter?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start with NoteTube and turn any YouTube video into comprehensive study notes with bookmarks and AI-generated quizzes.
            </p>
            <Button size="lg" asChild>
              <Link href={isAuthenticated ? '/dashboard' : '/signup'}>
                Start Learning Now
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
