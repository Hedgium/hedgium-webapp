
import { 
  LineChart
} from 'lucide-react';

import Link from 'next/link';

export default function Footer() {

    return (
              <footer className="footer md:footer-horizontal p-10 bg-neutral text-neutral-content">
        <div>
          <span className="footer-title">
            <LineChart className="mr-2" size={20} />
            Hedgium
          </span> 
          <Link href="#"className="link link-hover">AI-Powered Trading Strategies</Link>
          <Link href="#"className="link link-hover">Futures & Options</Link>
          <Link href="#"className="link link-hover">Python Code & Algorithms</Link>
        </div> 
        <div>
          <span className="footer-title">Product</span> 
          <Link href="#"className="link link-hover">Strategies</Link>
          <Link href="#"className="link link-hover">Pricing</Link>
          <Link href="#"className="link link-hover">Web App</Link>
          <Link href="#"className="link link-hover">Mobile App</Link>
        </div> 
        <div>
          <span className="footer-title">Company</span> 
          <Link href="#"className="link link-hover">About us</Link>
          <Link href="#"className="link link-hover">Contact</Link>
          <Link href="#"className="link link-hover">Careers</Link>
          <Link href="#"className="link link-hover">Press kit</Link>
        </div> 
        <div>
          <span className="footer-title">Legal</span> 
          <Link href="#"className="link link-hover">Terms of use</Link>
          <Link href="#"className="link link-hover">Privacy policy</Link>
          <Link href="#"className="link link-hover">Cookie policy</Link>
        </div>
      </footer>

    )
}