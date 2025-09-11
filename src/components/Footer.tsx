
import { 
  LineChart, Bot, Code2, Smartphone, Shield, Users, 
  CheckCircle, X, Check, User, Star, ChevronDown,
  TrendingUp, ArrowRight, Menu, X as CloseIcon
} from 'lucide-react';

export default function Footer() {

    return (
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

    )
}