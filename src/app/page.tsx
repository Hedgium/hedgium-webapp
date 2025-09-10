'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Bot, Code2, Smartphone, Shield, Users, 
  CheckCircle, X, Check, User, Star, ChevronDown,
  TrendingUp, ArrowRight, Menu, X as CloseIcon
} from 'lucide-react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    // Simple smooth scroll implementation
    const handleAnchorClick = (e:Event) => {
      const target = e.target as Element;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <div className="min-h-screen hero-pattern">
      {/* Navigation */}
      <nav className="navbar bg-base-100 sticky top-0 z-50 shadow-md">
        <div className="navbar-start">
          <div className="dropdown">
            <label 
              tabIndex={0} 
              className="btn btn-ghost lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </label>
            {isMenuOpen && (
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
                <li><a href="#strategies" onClick={() => setIsMenuOpen(false)}>Strategies</a></li>
                <li><a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a></li>
                <li><a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a></li>
              </ul>
            )}
          </div>
          <a className="btn btn-ghost normal-case text-xl font-bold text-primary">
            <LineChart className="mr-2" size={24} />
            Hedgium
          </a>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><a href="#features">Features</a></li>
            <li><a href="#strategies">Strategies</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
          </ul>
        </div>
        <div className="navbar-end">
          <a className="btn btn-primary">Sign Up</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                AI-Powered Trading Strategies for <span className="text-primary">Maximum Returns</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8">
                Subscribe to our premium trading strategies powered by Python and AI for Futures and Options trading. 
                Achieve the best annual returns in the market.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/register" className="btn btn-primary btn-lg">
                  Get Started
                  <ArrowRight size={20} />
                </a>
                <a href="#demo" className="btn btn-outline btn-primary btn-lg">
                  View Demo
                  <ChevronDown size={20} />
                </a>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-2">
                  <div className="mockup-code bg-gray-900">
                    <pre data-prefix="$"><code>python trading_bot.py --strategy ai_options</code></pre>
                    <pre data-prefix=">" className="text-warning"><code>Initializing Hedgium AI Trading Bot...</code></pre>
                    <pre data-prefix=">" className="text-success"><code>Strategy loaded: AI Options Premium</code></pre>
                    <pre data-prefix=">" className="text-success"><code>2023-09-10 10:15:23 | Entry: NIFTY 19800 CE</code></pre>
                    <pre data-prefix=">" className="text-success"><code>2023-09-10 10:45:36 | Exit: +₹2,450 profit</code></pre>
                    <pre data-prefix=">" className="text-success"><code>YTD Return: +187.3%</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="text-4xl md:text-5xl font-bold mb-2">+187%</h3>
              <p className="text-lg">Average Annual Return</p>
            </div>
            <div className="p-6">
              <h3 className="text-4xl md:text-5xl font-bold mb-2">94.7%</h3>
              <p className="text-lg">Strategy Accuracy</p>
            </div>
            <div className="p-6">
              <h3 className="text-4xl md:text-5xl font-bold mb-2">5,240+</h3>
              <p className="text-lg">Active Traders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Choose Hedgium?</h2>
          <p className="text-lg md:text-xl text-center text-gray-600 mb-16">
            Our cutting-edge platform provides everything you need for successful trading
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <div className="text-blue-500 mb-4">
                  <Bot size={40} />
                </div>
                <h3 className="card-title">AI-Powered Strategies</h3>
                <p>Our algorithms analyze market data in real-time to identify profitable opportunities.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <div className="text-purple-500 mb-4">
                  <TrendingUp size={40} />
                </div>
                <h3 className="card-title">Proven Performance</h3>
                <p>Backtested strategies with consistent returns across various market conditions.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <div className="text-green-500 mb-4">
                  <Code2 size={40} />
                </div>
                <h3 className="card-title">Python Code Access</h3>
                <p>Get direct access to the Python code behind our strategies for complete transparency.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <div className="text-red-500 mb-4">
                  <Smartphone size={40} />
                </div>
                <h3 className="card-title">Multi-Platform</h3>
                <p>Access our strategies on web and mobile apps, anytime, anywhere.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <div className="text-yellow-500 mb-4">
                  <Shield size={40} />
                </div>
                <h3 className="card-title">Risk Management</h3>
                <p>Built-in risk management features to protect your capital during volatile markets.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <div className="text-indigo-500 mb-4">
                  <Users size={40} />
                </div>
                <h3 className="card-title">Community Support</h3>
                <p>Join our community of traders to share insights and strategies.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategies Section */}
      <section id="strategies" className="py-20 px-4 hero-pattern">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Trading Strategies</h2>
          <p className="text-lg md:text-xl text-center text-gray-600 mb-16">
            Our premium strategies designed for maximum returns
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-2xl">Futures Pro</h3>
                <div className="badge badge-primary badge-lg">Most Popular</div>
                <p className="mt-4">Advanced algorithmic trading strategy for Nifty and BankNifty futures with high-frequency signals.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Average monthly return: 12-15%</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>3-5 signals per day</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>95% accuracy rate</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-2xl">Options AI</h3>
                <div className="badge badge-secondary badge-lg">High Return</div>
                <p className="mt-4">AI-powered options strategy that identifies premium buying opportunities with defined risk.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Average monthly return: 15-20%</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>2-4 signals per day</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>92% accuracy rate</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Subscription Plans</h2>
          <p className="text-lg md:text-xl text-center text-gray-600 mb-16">
            Choose the plan that works best for your trading needs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <h3 className="card-title text-2xl">Basic</h3>
                <div className="text-4xl font-bold my-4">₹9,999<span className="text-lg font-normal">/month</span></div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>1 Trading Strategy</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Web App Access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Email Support</span>
                  </li>
                  <li className="flex items-center text-gray-400">
                    <X className="text-red-500 mr-2" size={20} />
                    <span>Python Code Access</span>
                  </li>
                  <li className="flex items-center text-gray-400">
                    <X className="text-red-500 mr-2" size={20} />
                    <span>Mobile App Access</span>
                  </li>
                </ul>
                <div className="card-actions justify-center mt-8">
                  <button className="btn btn-outline btn-primary w-full">Get Started</button>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover border-2 border-primary">
              <div className="card-body">
                <div className="absolute top-0 right-0 m-4">
                  <div className="badge badge-primary badge-lg">Popular</div>
                </div>
                <h3 className="card-title text-2xl">Pro</h3>
                <div className="text-4xl font-bold my-4">₹19,999<span className="text-lg font-normal">/month</span></div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>All Trading Strategies</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Web & Mobile App Access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Priority Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Python Code Access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Community Access</span>
                  </li>
                </ul>
                <div className="card-actions justify-center mt-8">
                  <button className="btn btn-primary w-full">Get Started</button>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl card-hover">
              <div className="card-body">
                <h3 className="card-title text-2xl">Enterprise</h3>
                <div className="text-4xl font-bold my-4">₹49,999<span className="text-lg font-normal">/month</span></div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>All Trading Strategies</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Web & Mobile App Access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>24/7 Dedicated Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>Custom Strategy Development</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-2" size={20} />
                    <span>API Access</span>
                  </li>
                </ul>
                <div className="card-actions justify-center mt-8">
                  <button className="btn btn-outline btn-primary w-full">Contact Sales</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 hero-pattern">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What Our Traders Say</h2>
          <p className="text-lg md:text-xl text-center text-gray-600 mb-16">
            Join thousands of successful traders using Hedgium
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-white rounded-full w-12">
                      <span>RS</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Rahul Sharma</h4>
                    <p className="text-sm text-gray-500">Professional Trader</p>
                  </div>
                </div>
                <p className="text-gray-600">"Hedgium's AI strategies have completely transformed my trading. My portfolio is up 76% in just 4 months!"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-white rounded-full w-12">
                      <span>PK</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Priya Kumar</h4>
                    <p className="text-sm text-gray-500">Options Trader</p>
                  </div>
                </div>
                <p className="text-gray-600">"The Python code access gives me complete transparency. I can see exactly how the strategies work and modify them for my needs."</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-white rounded-full w-12">
                      <span>AS</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Amit Singh</h4>
                    <p className="text-sm text-gray-500">Swing Trader</p>
                  </div>
                </div>
                <p className="text-gray-600">"The mobile app is fantastic! I get alerts wherever I am and can execute trades instantly. It's like having a trading desk in my pocket."</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Trading?</h2>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto">
            Join thousands of successful traders using Hedgium's AI-powered strategies for consistent profits in Futures and Options trading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing" className="btn btn-lg btn-accent">
              Get Started Now
              <ArrowRight size={20} />
            </a>
            <a href="#demo" className="btn btn-lg btn-outline btn-white">
              Watch Demo
              <ChevronDown size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer md:footer-horizontal p-10 bg-neutral text-neutral-content">
        <div>
          <span className="footer-title">
            <LineChart className="mr-2" size={20} />
            Hedgium
          </span> 
          <a className="link link-hover">AI-Powered Trading Strategies</a>
          <a className="link link-hover">Futures & Options</a>
          <a className="link link-hover">Python Code & Algorithms</a>
        </div> 
        <div>
          <span className="footer-title">Product</span> 
          <a className="link link-hover">Strategies</a>
          <a className="link link-hover">Pricing</a>
          <a className="link link-hover">Web App</a>
          <a className="link link-hover">Mobile App</a>
        </div> 
        <div>
          <span className="footer-title">Company</span> 
          <a className="link link-hover">About us</a>
          <a className="link link-hover">Contact</a>
          <a className="link link-hover">Careers</a>
          <a className="link link-hover">Press kit</a>
        </div> 
        <div>
          <span className="footer-title">Legal</span> 
          <a className="link link-hover">Terms of use</a>
          <a className="link link-hover">Privacy policy</a>
          <a className="link link-hover">Cookie policy</a>
        </div>
      </footer>

     
    </div>
  );
}