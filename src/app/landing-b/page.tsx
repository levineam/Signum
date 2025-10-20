'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/branding/Logo'
import Link from 'next/link'
import {
  BookOpen, Link2, Brain, Shield, ArrowRight, Github,
  Zap, Lock, Cloud, Code, CheckCircle2, TrendingUp,
  Users, Heart, FileText
} from 'lucide-react'

export default function LandingPageB() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <Logo size={32} />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#tech" className="text-sm hover:text-primary transition-colors">
              Technology
            </Link>
            <Link href="#roadmap" className="text-sm hover:text-primary transition-colors">
              Roadmap
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
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">AI-Powered Personal Ontology</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Journaling That Understands You
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Transform private reflections into structured self-knowledge. Signum combines intelligent journaling,
              AI-powered ontology extraction, and knowledge graph connections—all in a calm, distraction-free environment.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">Sub-2s</p>
                <p className="text-xs text-muted-foreground">Response Time</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-muted-foreground">Private</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/auth">
                <Button size="lg" className="text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://github.com/levineam/Signum" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Github className="mr-2 h-5 w-5" />
                  View Source
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
            <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <p className="text-muted-foreground">Journal Editor Demo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Value Props */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Brain className="h-8 w-8 mx-auto text-accent-foreground" />
                <h3 className="font-semibold">AI Ontology</h3>
                <p className="text-sm text-muted-foreground">Automatic value extraction</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Link2 className="h-8 w-8 mx-auto text-accent-foreground" />
                <h3 className="font-semibold">Smart Linking</h3>
                <p className="text-sm text-muted-foreground">Bidirectional connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Shield className="h-8 w-8 mx-auto text-accent-foreground" />
                <h3 className="font-semibold">Bank-Level Security</h3>
                <p className="text-sm text-muted-foreground">RLS + encryption</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Zap className="h-8 w-8 mx-auto text-accent-foreground" />
                <h3 className="font-semibold">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Sub-2s load times</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Comprehensive Feature Set</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for meaningful journaling, from rich text editing to AI-powered insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>WYSIWYG Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Full rich text formatting with 11 formatting options
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bold, italic, underline</li>
                  <li>• Headings (H1, H2)</li>
                  <li>• Lists (bullets, numbers)</li>
                  <li>• Text alignment</li>
                  <li>• Quote blocks</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Auto-Save</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  2-second debounced auto-save to cloud
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Never lose your work</li>
                  <li>• Optimistic UI updates</li>
                  <li>• Real-time sync status</li>
                  <li>• Conflict resolution</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>ACT Prompts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Gentle prompts based on Acceptance and Commitment Therapy
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 12 rotating prompts</li>
                  <li>• Values exploration</li>
                  <li>• Mindfulness themes</li>
                  <li>• Dismissible & refreshable</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Link2 className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Note Linking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Create linked notes from any highlighted text
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• One-click note creation</li>
                  <li>• Bidirectional links</li>
                  <li>• Rich text in notes</li>
                  <li>• Cross-device persistence</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>AI Ontology</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  GPT-5-mini extracts Values, Beliefs, and Aims
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• One-click analysis</li>
                  <li>• 20-note processing</li>
                  <li>• Confidence scoring</li>
                  <li>• Source tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Knowledge Graph</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Watch connections emerge between your thoughts
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic link tracking</li>
                  <li>• Metadata preservation</li>
                  <li>• Pattern recognition</li>
                  <li>• Temporal evolution</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Row-Level Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Database-level user isolation with Supabase RLS
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete data privacy</li>
                  <li>• Policy enforcement</li>
                  <li>• Multi-user isolation</li>
                  <li>• Audit logging</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Multi-Device Sync</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Access your journal from any browser
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time synchronization</li>
                  <li>• Supabase Realtime</li>
                  <li>• Automatic backups</li>
                  <li>• 99.9% uptime SLA</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-accent-foreground mb-2" />
                <CardTitle>Privacy-First</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Your data stays yours, always
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Server-side AI processing</li>
                  <li>• No data mining</li>
                  <li>• HTTPS everywhere</li>
                  <li>• Content Security Policy</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="bg-muted/30 py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 text-accent-foreground">
              <Code className="h-5 w-5" />
              <span className="font-semibold">Built With Modern Tools</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Technical Excellence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry-leading technologies ensure reliability, performance, and developer experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Frontend</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Next.js 15.5.3 + Turbopack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>React 19.1.0</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>TypeScript</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>shadcn/ui + Tailwind 4</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Backend</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Supabase PostgreSQL</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Supabase Auth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Row-Level Security</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Real-time subscriptions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">AI & Analysis</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>OpenAI GPT-5-mini</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Responses API (reasoning)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Server-side processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Confidence scoring</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Infrastructure</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Vercel deployment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>GitHub CI/CD</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Playwright E2E tests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>PR preview deploys</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="border-accent/50">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-3xl font-bold">Sub-2s</p>
                <p className="text-sm text-muted-foreground">Response time for journal operations</p>
              </CardContent>
            </Card>
            <Card className="border-accent/50">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-3xl font-bold">&lt;10s</p>
                <p className="text-sm text-muted-foreground">AI ontology analysis (20 notes)</p>
              </CardContent>
            </Card>
            <Card className="border-accent/50">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-3xl font-bold">99.9%</p>
                <p className="text-sm text-muted-foreground">Uptime SLA with Supabase</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">What's Next</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Signum is actively developed with ambitious plans for the future
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Badge variant="default" className="w-fit mb-2">Live Now</Badge>
                <CardTitle>Core Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Rich text journaling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Note linking system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>AI ontology extraction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Multi-device sync</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Secure authentication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">Coming Soon</Badge>
                <CardTitle>Enhanced Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Incremental AI analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Paragraph-level suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Natural language tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Weekly analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-foreground mt-0.5" />
                    <span>Keyword visualization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">Future</Badge>
                <CardTitle>Social Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>Values-based connections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>Karma point system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>Articles platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>Feedback feed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>In-person meets</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-accent/10 py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Start Building Your Personal Ontology Today
          </h2>
          <p className="text-xl text-muted-foreground">
            Join the community of reflective thinkers using Signum for deeper self-understanding
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
                Explore the Code
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-background">
        <div className="container mx-auto px-6 max-w-7xl">
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
                <li><Link href="#tech" className="hover:text-foreground transition-colors">Technology</Link></li>
                <li><Link href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="https://github.com/levineam/Signum" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</Link></li>
                <li><Link href="https://github.com/levineam/Signum/blob/main/docs/prd.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="https://github.com/levineam/Signum/blob/main/docs/prd.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">PRD</Link></li>
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
            <p>© 2025 Signum. Built with Next.js 15.5.3, Supabase, shadcn/ui Notebook theme, and TypeScript.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
