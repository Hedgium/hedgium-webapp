export default function HeroSection() {
  return (
    <section className="relative h-[96vh] w-full overflow-hidden flex items-center justify-center text-white">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover">
        <source src="/videos/hero_video.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute left-0 top-64 md:top-32 md:mx-4 md:mx-8 z-10 p-4 w-10/12 md:w-5/12 bg-primary/20"
        data-aos="fade-up"
        data-aos-duration="800"
        data-aos-once="true"
      >
        <h1 className="text-3xl md:text-5xl font-medium leading-tight">
          Ambition Guided By Intelligence. Defined by Performance
        </h1>
      </div>
      <div
        className="trapezium-wrap absolute bottom-0 px-4 md:px-8 w-full z-30"
      >
        <div className="trapezium-reverse mx-auto">
          <div className="trapezium-inner">
            <p className="text-base text-center md:text-lg opacity-90 leading-relaxed">
              <span className="md:hidden text-center">Two decades of expertise. Cutting-edge technology.</span>
              <span className="hidden md:inline">
                We capture opportunities in real-time and deliver sophisticated playbooks to maximize risk-adjusted returns, by combining two decades of market expertise with cutting-edge technology.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
