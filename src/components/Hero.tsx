import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Build Your Financial Future</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                SunuSàv
              </span>
              <br />
              <span className="text-foreground">Our Savings,</span>
              <br />
              <span className="text-foreground">Our Future</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Together, we build wealth. A community-driven platform that empowers you to save, invest, and grow your financial future with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group">
                Start Saving Today
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-8 pt-8 border-t border-border/50">
              <div>
                <p className="text-3xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Active Savers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary">$2M+</p>
                <p className="text-sm text-muted-foreground">Total Saved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">100%</p>
                <p className="text-sm text-muted-foreground">Secure</p>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <img 
                src={heroIllustration} 
                alt="Community members collaborating on savings and financial growth"
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating card elements */}
            <div className="absolute -top-8 -left-8 bg-card border border-border p-4 rounded-2xl shadow-xl animate-float">
              <p className="text-sm font-semibold text-primary">🎯 Goal Achieved!</p>
              <p className="text-xs text-muted-foreground mt-1">+$500 this month</p>
            </div>
            <div className="absolute -bottom-8 -right-8 bg-card border border-border p-4 rounded-2xl shadow-xl animate-float-delay">
              <p className="text-sm font-semibold text-secondary">💰 Savings Growing</p>
              <p className="text-xs text-muted-foreground mt-1">12% increase</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
