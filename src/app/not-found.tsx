import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function Custom404() {
  return (
    <>
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="flex justify-center">
              <div className="text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mt-4">404</h1>
            <h2 className="text-2xl font-semibold mt-2 text-error">
              Trade Route Not Found
            </h2>
            
            <p className="mt-4 text-base-content/70">
              {`The market data you're looking for seems to have moved or doesn't exist. 
              Maybe it's been delisted or you took a wrong turn in the market charts.`}
            </p>
            
            <div className="card-actions justify-center mt-6">
              <Link href="/" className="btn btn-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Homepage
              </Link>
            </div>

            <div className="mt-6">
              <p className="text-sm text-base-content/50">
                Need help? Contact our support team or check our market status
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}