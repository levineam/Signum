'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/branding/Logo'
import Link from 'next/link'
import { BookOpen, Link2, Brain, Shield, ArrowRight, Github } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-6xl">
          <Logo size={32} />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#philosophy" className="text-sm hover:text-primary transition-colors">
              Philosophy
            </Link>
            <Link href="https://github.com/levineam/Signum" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
              GitHub
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32 max-w-6xl">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Journaling That Understands You
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Transform private reflections into personal insights. AI-powered ontology building meets meaningful connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Your Meaning-Making Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual - Placeholder for screenshot */}
        <div className="mt-16 rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
          <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <p className="text-muted-foreground">Journal Editor Screenshot</p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-accent/10 py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              From Private Thoughts to Shared Wisdom
            </h2>
            <p className="text-lg text-muted-foreground">
              Most platforms optimize for external metrics. Signum bridges private reflection with authentic connection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card>
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">AI Builds Your Personal Ontology</h3>
                <p className="text-muted-foreground">
                  Automatically extract Values, Beliefs, and Aims from your journal entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Knowledge Graph Connects Your Thoughts</h3>
                <p className="text-muted-foreground">
                  Create linked notes from highlights with bidirectional connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Connect Through Values, Not Vanity</h3>
                <p className="text-muted-foreground">
                  Future social features based on shared beliefs, not engagement metrics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6 max-w-6xl space-y-24">
          {/* Feature 1: Seamless Journaling */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-accent-foreground font-semibold">
                <BookOpen className="h-5 w-5" />
                <span>Seamless Journaling</span>
              </div>
              <h3 className="text-3xl font-bold">Write Without Friction</h3>
              <p className="text-lg text-muted-foreground">
                WYSIWYG rich text editor with ACT-inspired prompts. Auto-save ensures you never lose a thought.
                Open the app and start writing—no barriers, no distractions.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Full formatting: bold, italic, headings, lists</li>
                <li>• Gentle prompts guide reflection</li>
                <li>• 2-second auto-save to cloud</li>
                <li>• Chronological journal stream</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border shadow-lg overflow-hidden bg-card">
              <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <p className="text-muted-foreground">Journal Stream Screenshot</p>
              </div>
            </div>
          </div>

          {/* Feature 2: Intelligent Linking */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg border border-border shadow-lg overflow-hidden bg-card md:order-first">
              <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <p className="text-muted-foreground">Note Linking Screenshot</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-accent-foreground font-semibold">
                <Link2 className="h-5 w-5" />
                <span>Intelligent Note Linking</span>
              </div>
              <h3 className="text-3xl font-bold">Connect Your Thoughts</h3>
              <p className="text-lg text-muted-foreground">
                Highlight any text and create a linked note. Navigate between entries and notes seamlessly.
                Build a knowledge graph that reveals patterns in your thinking.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Make Note from any highlighted text</li>
                <li>• Bidirectional links persist across devices</li>
                <li>• Rich text in notes, just like journal entries</li>
                <li>• Watch connections emerge over time</li>
              </ul>
            </div>
          </div>

          {/* Feature 3: AI Ontology */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-accent-foreground font-semibold">
                <Brain className="h-5 w-5" />
                <span>AI-Powered Ontology</span>
              </div>
              <h3 className="text-3xl font-bold">Understand Your Authentic Self</h3>
              <p className="text-lg text-muted-foreground">
                GPT-5-mini analyzes your journal to extract Values, Beliefs, and Aims.
                See your philosophical evolution over time. One-click analysis, zero friction.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Automatic extraction from journal entries</li>
                <li>• Three ontology categories: Values, Beliefs, Aims</li>
                <li>• Confidence scoring and source tracking</li>
                <li>• Privacy-first: All analysis server-side</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border shadow-lg overflow-hidden bg-card">
              <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <p className="text-muted-foreground">Ontology Page Screenshot</p>
              </div>
            </div>
          </div>

          {/* Feature 4: Secure & Private */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg border border-border shadow-lg overflow-hidden bg-card md:order-first">
              <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center p-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center space-y-2">
                    <Shield className="h-12 w-12 mx-auto text-accent-foreground" />
                    <p className="text-sm font-semibold">RLS Policies</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Shield className="h-12 w-12 mx-auto text-accent-foreground" />
                    <p className="text-sm font-semibold">HTTPS</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Shield className="h-12 w-12 mx-auto text-accent-foreground" />
                    <p className="text-sm font-semibold">Multi-Device</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Shield className="h-12 w-12 mx-auto text-accent-foreground" />
                    <p className="text-sm font-semibold">Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-accent-foreground font-semibold">
                <Shield className="h-5 w-5" />
                <span>Secure & Private</span>
              </div>
              <h3 className="text-3xl font-bold">Your Data, Your Privacy</h3>
              <p className="text-lg text-muted-foreground">
                Bank-level security with Supabase Auth and Row-Level Security policies.
                Access your journal from any device. Your reflections stay private.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Row-Level Security isolates user data</li>
                <li>• HTTPS and CSP enforced</li>
                <li>• Multi-device sync with Supabase</li>
                <li>• 99.9% uptime with automatic backups</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Callout */}
      <section id="philosophy" className="bg-accent/10 py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="border-2">
            <CardContent className="p-12 space-y-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">
                "Calm and Frictionless"
              </h2>
              <p className="text-xl text-muted-foreground">
                Most platforms optimize for productivity metrics or engagement. Signum prioritizes
                <strong className="text-foreground"> meaning-making over metrics</strong>.
              </p>
              <p className="text-lg text-muted-foreground">
                Open the app and start writing. No dashboards, no gamification, no anxiety-inducing notifications.
                Just you, your thoughts, and gentle AI assistance when you need it.
              </p>
              <div className="pt-4">
                <Link href="/auth">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Start Journaling With Purpose
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Begin Your Meaning-Making Journey?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join users who are building deeper self-understanding through reflective journaling
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://github.com/levineam/Signum" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo size={32} />
              <p className="text-sm text-muted-foreground">
                Journaling-first social platform for meaning-making
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#philosophy" className="hover:text-foreground transition-colors">Philosophy</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="https://github.com/levineam/Signum" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</Link></li>
                <li><Link href="https://github.com/levineam/Signum/blob/main/docs/prd.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2025 Signum. Built with Next.js 15, Supabase, and shadcn/ui.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
