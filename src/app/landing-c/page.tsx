'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/branding/Logo'
import Link from 'next/link'
import { BookOpen, ArrowRight, Github, Quote } from 'lucide-react'

export default function LandingPageC() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-6xl">
          <Logo size={32} />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#story" className="text-sm hover:text-primary transition-colors">
              Our Story
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
              <Button size="sm">Begin Your Journey</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Emotional Hook */}
      <section className="container mx-auto px-6 py-24 md:py-32 max-w-5xl">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              What if your journal
              <br />
              <span className="text-accent-foreground">understood you back?</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Every day, you write about what matters. Your hopes, fears, values, and dreams.
              But those insights stay scattered across pages, slowly forgotten.
            </p>
          </div>

          <div className="py-6">
            <p className="text-2xl md:text-3xl font-semibold">
              Until now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-accent-foreground to-accent-foreground/80">
                Start Your Meaning-Making Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem - Relatable Pain Point */}
      <section className="bg-gradient-to-br from-accent/20 to-accent/5 py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                You've felt this before...
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2">
                <CardContent className="p-8 space-y-4">
                  <Quote className="h-8 w-8 text-accent-foreground/50" />
                  <p className="text-lg italic text-muted-foreground">
                    "I keep writing about the same problems, but I never see the pattern until months later."
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-8 space-y-4">
                  <Quote className="h-8 w-8 text-accent-foreground/50" />
                  <p className="text-lg italic text-muted-foreground">
                    "I wrote something profound last year about what I value, but now I can't find it."
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-8 space-y-4">
                  <Quote className="h-8 w-8 text-accent-foreground/50" />
                  <p className="text-lg italic text-muted-foreground">
                    "My social media feeds show me what everyone else thinks matters. What about what *I* think matters?"
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-8 space-y-4">
                  <Quote className="h-8 w-8 text-accent-foreground/50" />
                  <p className="text-lg italic text-muted-foreground">
                    "I wish there was a way to connect with people who share my actual values, not just my interests."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution - Transformation Story */}
      <section id="story" className="py-20">
        <div className="container mx-auto px-6 max-w-4xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Introducing Signum
            </h2>
            <p className="text-xl text-muted-foreground">
              A journaling platform that learns from you, connects your thoughts, and helps you discover your authentic self
            </p>
          </div>

          {/* Story Arc 1: The First Entry */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent-foreground">
                1
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">You open Signum and start writing</h3>
                <p className="text-lg text-muted-foreground">
                  A gentle prompt appears: <em>"What's something you're grateful for today, and why does it matter?"</em>
                </p>
                <p className="text-lg text-muted-foreground">
                  You write about a conversation with a friend that reminded you what you value most: genuine connection.
                  The editor is clean, distraction-free, with just enough formatting to express yourself.
                </p>
                <div className="rounded-lg border border-border shadow-md overflow-hidden bg-card mt-4">
                  <div className="aspect-video bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Arc 2: Making Connections */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent-foreground">
                2
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Connections start to emerge</h3>
                <p className="text-lg text-muted-foreground">
                  As you write, you highlight the phrase <em>"genuine connection"</em> and click "Make Note."
                  Suddenly, you're building a personal encyclopedia of what matters to you.
                </p>
                <p className="text-lg text-muted-foreground">
                  Over weeks, you notice you keep coming back to this note. It links to five different journal entries.
                  A pattern is forming—something about authenticity runs through your thinking.
                </p>
              </div>
            </div>
          </div>

          {/* Story Arc 3: AI Reveals Your Ontology */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent-foreground">
                3
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Your personal ontology takes shape</h3>
                <p className="text-lg text-muted-foreground">
                  One day, you click <strong>"Analyze My Notes."</strong> In seconds, Signum's AI reads through
                  your journal entries and extracts your core <strong>Values</strong>, <strong>Beliefs</strong>, and <strong>Aims</strong>.
                </p>
                <Card className="border-2 mt-4">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">Your Values:</p>
                      <p className="text-muted-foreground">Authenticity • Compassion • Presence • Growth</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">Your Beliefs:</p>
                      <p className="text-muted-foreground">Meaning comes from connection • People have inherent wisdom • Action follows clarity</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">Your Aims:</p>
                      <p className="text-muted-foreground">Build deeper relationships • Balance ambition with presence • Create meaningful work</p>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-lg text-muted-foreground mt-4">
                  For the first time, you see your entire philosophical framework laid out.
                  This isn't what you <em>think</em> you should value—it's what you <em>actually</em> write about when no one's watching.
                </p>
              </div>
            </div>
          </div>

          {/* Story Arc 4: The Transformation */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent-foreground">
                4
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Everything changes</h3>
                <p className="text-lg text-muted-foreground">
                  With your values visible, decisions become clearer. That job offer that seemed exciting?
                  You realize it conflicts with your core value of "presence." That friendship you've been
                  neglecting? Your values remind you why it matters.
                </p>
                <p className="text-lg text-muted-foreground">
                  Your journal isn't just a record anymore. It's a mirror showing you who you really are—and
                  who you're becoming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Future - Community & Connection */}
      <section className="bg-gradient-to-br from-accent/20 to-accent/5 py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              And this is just the beginning
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Soon, Signum will connect you with others who share your <strong>values</strong>—not just your interests.
              Imagine a social platform where Karma rewards depth, not engagement. Where articles emerge from reflection,
              not performance. Where you meet people in real life because you believe similar things about what makes life meaningful.
            </p>
            <Card className="border-2 max-w-2xl mx-auto">
              <CardContent className="p-8 space-y-4">
                <p className="text-lg font-semibold">Coming Soon:</p>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>• <strong>Feedback Feed</strong> — Share insights, get thoughtful responses</li>
                  <li>• <strong>Karma System</strong> — Reward valuable contributions, not viral content</li>
                  <li>• <strong>Values-Based Connections</strong> — Meet people who share your worldview</li>
                  <li>• <strong>Articles Platform</strong> — Turn journal insights into public wisdom</li>
                  <li>• <strong>Meets Feature</strong> — Connect in person with like-minded souls</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy Highlight */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="border-4 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="p-12 space-y-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">
                We believe in meaning over metrics
              </h2>
              <p className="text-xl text-muted-foreground">
                No productivity anxiety. No engagement algorithms. No follower counts.
              </p>
              <p className="text-xl text-muted-foreground">
                Just a calm space to write, think, discover—and eventually, connect with others who are
                doing the same.
              </p>
              <div className="pt-6">
                <p className="text-lg font-semibold text-accent-foreground">
                  "Calm and frictionless"
                </p>
                <p className="text-sm text-muted-foreground mt-2">That's our design philosophy. Always.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonial-Style Quotes (Aspirational) */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              What users are discovering
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-8 space-y-4">
                <Quote className="h-8 w-8 text-accent-foreground/50" />
                <p className="text-lg italic text-muted-foreground">
                  "For the first time, I actually understand what I value. It's all been there in my journal—I just needed help seeing it."
                </p>
                <p className="text-sm font-semibold">— Sarah, Early Adopter</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 space-y-4">
                <Quote className="h-8 w-8 text-accent-foreground/50" />
                <p className="text-lg italic text-muted-foreground">
                  "I've tried every journaling app. This is the only one that makes my past entries useful for my present decisions."
                </p>
                <p className="text-sm font-semibold">— Marcus, Product Designer</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 space-y-4">
                <Quote className="h-8 w-8 text-accent-foreground/50" />
                <p className="text-lg italic text-muted-foreground">
                  "The AI doesn't tell me who I am. It shows me who I've already been—in my own words. That's powerful."
                </p>
                <p className="text-sm font-semibold">— Priya, Therapist</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final Emotional CTA */}
      <section className="py-24 bg-gradient-to-br from-amber-500/20 via-accent/10 to-transparent">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Your authentic self is waiting
            <br />
            in the pages you've already written
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start journaling today. Let Signum help you discover the patterns, values, and wisdom that have been there all along.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/auth">
              <Button size="lg" className="text-xl px-12 py-8 bg-gradient-to-r from-accent-foreground to-accent-foreground/80">
                Begin Your Journey
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link href="https://github.com/levineam/Signum" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="text-xl px-12 py-8">
                <Github className="mr-2 h-6 w-6" />
                Explore the Code
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            Free to start. No credit card required. Your data stays private.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-background">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo size={32} />
              <p className="text-sm text-muted-foreground">
                Journaling-first platform for meaning-making and authentic connection
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#story" className="hover:text-foreground transition-colors">Our Story</Link></li>
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
            <p>© 2025 Signum. Built with care for meaning-makers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
