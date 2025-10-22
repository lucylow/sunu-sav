import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, 
  Shield, 
  Users, 
  Clock, 
  Globe, 
  Star,
  ArrowRight,
  CheckCircle,
  Download,
  MessageCircle,
  Phone
} from "lucide-react";

export default function Landing() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Smooth scrolling for anchor links
  useEffect(() => {
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = target.getAttribute('href')?.substring(1);
        if (targetId) {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, []);

  const testimonials = [
    {
      text: "A SunuSàv, liggéey bi dafa yomb. Soulal na ma lool.",
      translation: "With SunuSàv, the work is easy. It has helped me a lot.",
      name: "Fatou Diop",
      role: "Market Vendor, Sandaga",
      location: "Dakar"
    },
    {
      text: "SunuSàv dafa am solo ci jëfandikoo njariñ ci biir ak kër gi.",
      translation: "SunuSàv is important for managing savings within the family.",
      name: "Aminata Fall",
      role: "Tontine Leader",
      location: "Thiès"
    },
    {
      text: "Moo ngiy ñuul ci Bitcoin ak njariñ ci jigéen ak nit ku nekk.",
      translation: "This is helping us with Bitcoin and savings for everyone.",
      name: "Mariama Sarr",
      role: "Community Ambassador",
      location: "Saint-Louis"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const benefits = [
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: "Save Time",
      titleWolof: "Waxtu Jot",
      description: "No need for long physical meetings"
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Secure Funds",
      titleWolof: "Alal Sàkku",
      description: "Multi-signature Bitcoin wallets prevent fraud"
    },
    {
      icon: <Globe className="h-8 w-8 text-orange-600" />,
      title: "Transparent",
      titleWolof: "Jëkkal",
      description: "Visible blockchain transaction records"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      title: "Accessible",
      titleWolof: "Jëfandikoo",
      description: "Works on phones, even without internet via SMS/USSD"
    }
  ];

  const steps = [
    {
      icon: "📱",
      title: "Contribute",
      titleWolof: "Sàng",
      description: "Use Wave or Orange Money from your phone"
    },
    {
      icon: "⚡",
      title: "Secure",
      titleWolof: "Sàkku",
      description: "Funds are pooled securely with Bitcoin multisig"
    },
    {
      icon: "🤝",
      title: "Receive",
      titleWolof: "Jot",
      description: "Get automatic, transparent payouts"
    }
  ];

  return (
    <div className="min-h-screen landing-gradient cultural-pattern pattern-overlay">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SunuSàv</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#how-it-works" className="text-gray-700 hover:text-orange-600 transition-colors">How It Works</a>
              <a href="#benefits" className="text-gray-700 hover:text-orange-600 transition-colors">Benefits</a>
              <a href="#testimonials" className="text-gray-700 hover:text-orange-600 transition-colors">Testimonials</a>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-orange-600 text-white px-4 py-2 text-sm">
                #1 Digital Tontine ci Senegal
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  SunuSàv
                </h1>
                <div className="text-2xl lg:text-3xl font-semibold text-orange-700 mb-2">
                  Njariñ ci jigéen ak nit ku nekk
                </div>
                <div className="text-xl text-gray-600">
                  Our Savings, Our Future
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed">
                Épargnez ensemble en toute sécurité avec la technologie Bitcoin. 
                Rejoignez la communauté qui transforme les tontines traditionnelles pour l'ère numérique.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="btn-senegalese text-white px-8 py-4 text-lg floating-animation"
                >
                  Join Your First Tontine
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg slide-in-left"
                >
                  Learn More
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Secure & Transparent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Mobile-first</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-orange-200">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Digital Tontine</h3>
                    <p className="text-gray-600">Traditional savings, modern technology</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <span className="text-gray-700">Join a tontine group</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-gray-700">Make contributions via mobile money</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <span className="text-gray-700">Receive secure payouts</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-200 rounded-full opacity-60 floating-animation"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-200 rounded-full opacity-60 floating-animation" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-orange-700 font-medium">
              Naka nga ameel?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow border-orange-200">
                <CardContent className="space-y-4">
                  <div className="text-6xl mb-4">{step.icon}</div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    <p className="text-lg text-orange-700 font-medium">{step.titleWolof}</p>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 px-4 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SunuSàv?
            </h2>
            <p className="text-xl text-orange-700 font-medium">
              Lu tax SunuSàv?
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow border-orange-200">
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    {benefit.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">{benefit.title}</h3>
                    <p className="text-orange-700 font-medium">{benefit.titleWolof}</p>
                  </div>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted By Our Community
            </h2>
            <p className="text-xl text-orange-700 font-medium">
              Lanuy Gëm
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border-orange-200 testimonial-card">
              <CardContent className="text-center space-y-6">
                <div className="text-2xl lg:text-3xl text-gray-900 font-medium leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </div>
                <div className="text-lg text-gray-600 italic">
                  "{testimonials[currentTestimonial].translation}"
                </div>
                <Separator className="my-6" />
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center pulse-animation">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                    <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                    <p className="text-sm text-orange-600">{testimonials[currentTestimonial].location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">In partnership with:</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="bg-gray-100 px-6 py-3 rounded-lg">
                <span className="text-gray-700 font-semibold">Wave</span>
              </div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg">
                <span className="text-gray-700 font-semibold">Orange Money</span>
              </div>
              <div className="bg-gray-100 px-6 py-3 rounded-lg">
                <span className="text-gray-700 font-semibold">Bitcoin Lightning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download & Support */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8">
            Get Started Today
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands of Senegalese using SunuSàv for secure digital savings
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="space-y-6">
                <Download className="h-12 w-12 mx-auto text-white" />
                <h3 className="text-2xl font-bold">Download App</h3>
                <p className="opacity-90">Available on Android and iOS</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-white text-orange-600 hover:bg-gray-100">
                    <Download className="mr-2 h-4 w-4" />
                    Android
                  </Button>
                  <Button className="bg-white text-orange-600 hover:bg-gray-100">
                    <Download className="mr-2 h-4 w-4" />
                    iOS
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="space-y-6">
                <MessageCircle className="h-12 w-12 mx-auto text-white" />
                <h3 className="text-2xl font-bold">Get Support</h3>
                <p className="opacity-90">We're here to help you succeed</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp: +221 70 123 45 67</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <Phone className="h-5 w-5" />
                    <span>Phone: +221 33 123 45 67</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold">SunuSàv</span>
              </div>
              <p className="text-gray-400">
                Transforming traditional tontines with Bitcoin technology for Senegal's community savers.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#how-it-works" className="hover:text-orange-400 transition-colors">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-orange-400 transition-colors">Benefits</a></li>
                <li><a href="#testimonials" className="hover:text-orange-400 transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-orange-400 transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Stay Updated</h4>
              <p className="text-gray-400 mb-4">
                Get the latest updates and earn Bitcoin tips
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 SunuSàv. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">WhatsApp</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
