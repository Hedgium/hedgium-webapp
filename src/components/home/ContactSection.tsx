import { Mail, Phone, MapPin, Calendar, MessageCircle } from "lucide-react";

export default function ContactSection() {
  return (
    <section className="relative bg-base-100 py-20">

      <div className="max-w-4xl mx-auto px-4 lg:px-8">

        {/* headline */}
        <div className="text-center mb-12 space-y-6">

          <h2 className="text-2xl md:text-4xl font-semibold text-primary leading-relaxed">
            In a market dominated by directional risk,
            <br className="hidden md:block"/>
            we focus on systematic probability-driven alpha.
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">

            <p className="text-lg font-medium text-accent">
              {`Let’s get started`}
            </p>

            <button className="btn btn-primary gap-2">
              <Calendar size={18} />
              Schedule an expert call
            </button>

          </div>
        </div>


        {/* contact card */}
        <div className="bg-base-200 border rounded-xl p-4 md:p-6 border-base-300">

          <div className="grid md:grid-cols-2 gap-0">

            {/* contact info */}
            <div className="space-y-6">

              <div className="flex items-center gap-4">
                <Mail className="text-primary" size={22}/>
                <div>
                  <p className="text-sm text-base-content/60">Email</p>
                  <p className="font-semibold">contact@hedgium.in</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="text-primary" size={22}/>
                <div>
                  <p className="text-sm text-base-content/60">Phone / WhatsApp</p>
                  <p className="font-semibold">+91 {process.env.NEXT_PUBLIC_PHONE_NUMBER}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="text-primary mt-1" size={22}/>
                <div>
                  <p className="text-sm text-base-content/60">Locations</p>
                  <p className="font-semibold leading-relaxed">
                    Haware City, Thane <br/>
                    Powai, Mumbai <br/>
                    Seawoods, Navi Mumbai
                  </p>
                </div>
              </div>

            </div>

            {/* whatsapp CTA */}
            <div className="flex flex-col md:border-l border-base-300 md:px-4 py-4 justify-center items-center md:items-start gap-4">

              <p className="text-base-content/70 text-base">
                Prefer WhatsApp? Send us a quick message and our team will get back to you shortly.
              </p>

              <a
                href={`https://wa.me/+91${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'm interested in Hedgium. I'd like to schedule a call or learn more.")}`}
                className="btn btn-outline btn-primary gap-2"
              >
                <MessageCircle size={18} />
                Send us a “Hi” on WhatsApp
              </a>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}