import { Button } from "@/components/Button";
import { ArrowRight, Sparkles, Upload, Video, MessageSquare, RefreshCw, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import "./Hero.css";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Course",
    description: "Share your knowledge by creating and uploading your course content. Earn points for every course you contribute.",
    color: "gradient-primary-blue"
  },
  {
    icon: Sparkles,
    title: "Earn Points",
    description: "Get rewarded with points for each course you upload. The more you teach, the more you earn.",
    color: "gradient-accent-orange"
  },
  {
    icon: Video,
    title: "Learn New Skills",
    description: "Use your earned points to access other students' courses. Exchange knowledge and grow together.",
    color: "gradient-purple-primary"
  }
];

const features = [
  {
    icon: Video,
    title: "Screen Share",
    description: "Share your screen during live sessions for interactive learning and collaborative problem-solving.",
    gradient: "gradient-primary-blue"
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Connect instantly with fellow students. Ask questions, share insights, and build your learning community.",
    gradient: "gradient-accent-orange"
  },
  {
    icon: RefreshCw,
    title: "Course Exchange",
    description: "Seamlessly swap courses with other students. Your knowledge becomes their growth, and vice versa.",
    gradient: "gradient-purple-primary"
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    description: "Points-based system ensures fair exchange. Complete courses to earn, spend points to learn more.",
    gradient: "gradient-green-teal"
  }
];

const Hero = () => {
  return (
    <div className="hero">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-decoration hero-decoration-1" />
        <div className="hero-decoration hero-decoration-2" />
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <Sparkles className="w-4 h-4" />
                Start with 100 Free Points
              </div>
              
              <h1 className="hero-title">
                Exchange Skills,{" "}
                <span className="hero-gradient-text">
                  Earn Points
                </span>
              </h1>
              
              <p className="hero-description">
                Join a community where knowledge is currency. Share your courses, earn points, and unlock access to others' expertise. Learn together, grow together.
              </p>
              
              <div className="hero-buttons">
                <Button variant="hero" size="lg">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
              
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">100</div>
                  <div className="hero-stat-label">Free Points to Start</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">100+</div>
                  <div className="hero-stat-label">Courses Available</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value"></div>
                  <div className="hero-stat-label">Active Students</div>
                </div>
              </div>
            </div>
            
            <div className="hero-image">
              <div className="hero-image-container">
                <div className="hero-image-overlay" />
                <img
                  src={heroImage}
                  alt="Students learning and collaborating"
                  className="hero-image-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="how-it-works-bg" />
        
        <div className="hero-container">
          <div className="section-title">
            <h2>
              How It <span className="hero-gradient-text">Works</span>
            </h2>
            <p>
              Three simple steps to start exchanging knowledge
            </p>
          </div>
          
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className={`step-overlay ${step.color}`} />
                
                <div className="step-content">
                  <div className={`step-icon ${step.color}`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="step-number">
                    {index + 1}
                  </div>
                  
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="hero-container">
          <div className="section-title">
            <h2>
              Powerful Features for
              <span className="hero-gradient-text"> Collaborative Learning</span>
            </h2>
            <p>
              Everything you need to exchange knowledge and grow together
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-overlay ${feature.gradient}`} />
                
                <div className="feature-content">
                  <div className={`feature-icon ${feature.gradient}`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-bg" />
        
        <div className="hero-container">
          <div className="cta-content">
            <div className="cta-decoration cta-decoration-1" />
            <div className="cta-decoration cta-decoration-2" />
            
            <div className="cta-inner">
              <div className="cta-badge">
                <Sparkles className="w-4 h-4" />
                Start Learning Today
              </div>
              
              <h2>
                Ready to Exchange Skills?
              </h2>
              
              <p>
                Join thousands of students already learning, earning points, and growing together on Skill Swap
              </p>
              
              <div className="cta-buttons">
                <Button 
                  variant="accent" 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl"
                >
                  Get Started - 100 Points Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="cta-note">
                No credit card required • Start with 100 free points • Join in seconds
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
