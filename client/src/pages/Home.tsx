import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Users, Shield, Zap, TrendingUp, ArrowRight, Bitcoin } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/groups">
                  <Button variant="default">My Groups</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/about">
                  <Button variant="ghost">About</Button>
                </Link>
                <a href={getLoginUrl()}>
                  <Button variant="default">Get Started</Button>
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-orange-900 mb-6 leading-tight">
                Our Savings,<br />Our Future
              </h2>
              <p className="text-xl text-gray-700 mb-8">
                Powered by Bitcoin. Driven by Community.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                SunuSàv brings traditional Senegalese tontine savings circles into the digital age with Bitcoin Lightning Network. 
                Save together, grow together, secure your future together.
              </p>
              <div className="flex gap-4">
                {isAuthenticated ? (
                  <Link href="/groups">
                    <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                      Browse Groups <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                      Join Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                )}
                <Link href="/about">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Savings</span>
                    <Bitcoin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-orange-900">21,000,000 sats</div>
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">+12% this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-orange-900 mb-12">
            Why Choose SunuSàv?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Community Powered</CardTitle>
                <CardDescription>
                  Join trusted savings circles with friends, family, and community members. Built on the traditional tontine model.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Multi-Signature Security</CardTitle>
                <CardDescription>
                  Your funds are protected with Bitcoin multi-signature wallets. No single point of failure, complete transparency.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Instant contributions and payouts using Bitcoin Lightning Network. Low fees, instant settlement.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-orange-50">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-orange-900 mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create or Join", desc: "Start a new savings group or join an existing one" },
              { step: "2", title: "Contribute", desc: "Make regular contributions using Bitcoin Lightning" },
              { step: "3", title: "Rotate Payouts", desc: "Members receive payouts in rotation each cycle" },
              { step: "4", title: "Build Wealth", desc: "Save consistently and achieve your financial goals" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="font-bold text-lg mb-2 text-orange-900">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-4xl font-bold mb-6">
            Ready to Start Saving?
          </h3>
          <p className="text-xl mb-8 text-orange-100">
            Join thousands of Senegalese building their financial future with Bitcoin-powered tontines.
          </p>
          {isAuthenticated ? (
            <Link href="/groups/create">
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                Create Your First Group
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                Get Started Free
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bitcoin className="h-6 w-6 text-orange-600" />
                <span className="font-bold text-white">{APP_TITLE}</span>
              </div>
              <p className="text-sm">
                Empowering Senegalese communities through Bitcoin-powered savings.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-white mb-4">Product</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/groups">Groups</Link></li>
                <li><Link href="/how-it-works">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-4">Resources</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 {APP_TITLE}. Built for Dakar Bitcoin Hack.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

