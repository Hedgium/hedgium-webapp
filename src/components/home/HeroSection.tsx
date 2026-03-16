export default function HeroSection() {
  return (
    <section className="relative h-[96vh] w-full overflow-hidden flex items-center justify-center text-white">
      
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover">
        <source src="/videos/hero_video.mp4" type="video/mp4" />
      </video>

      {/* Container */}
      <div className="absolute inset-0 z-10 px-4 lg:px-8 flex items-center">
        
        <div
          className="max-w-7xl w-full mx-auto px-4 -translate-y-8"
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-once="true"
        >
          <div className="w-full md:w-6/12 bg-primary/20 p-4 lg:p-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl font-medium leading-tight">
              Ambition Guided by Intelligence. Defined by Performance
            </h1>
          </div>
        </div>

      </div>

      {/* Bottom trapezium */}
      <div className="trapezium-wrap absolute bottom-0 left-1/2 -translate-x-1/2 px-4 md:px-8 w-full max-w-7xl z-30">
        <div className="trapezium-reverse mx-auto">
          <div className="trapezium-inner">
            <p className="text-base text-center md:text-lg lg:text-xl  opacity-90 leading-relaxed">
              <span className="text-center">
              We capture opportunities in real-time and deliver sophisticated playbooks to maximize risk-adjusted returns, by combining two decades of market expertise with cutting-edge technology.

              </span>
             
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}