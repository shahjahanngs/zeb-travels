import { Link } from "react-router-dom";
import heroVid from "../../assets/videos/masjid-nabvi.mp4";
import ukImg from "../../assets/images/uk.webp";
import qatarImg from "../../assets/images/qatar.jpg";
import mascatImg from "../../assets/images/mascat.webp";
import uaeImg from "../../assets/images/uae.webp";
import bahrainImg from "../../assets/images/bahrain.webp";
import jeddahImg from "../../assets/images/jeddah.webp";
import madinaImg from "../../assets/images/madina.webp";
import { theme } from "../../theme/theme";

export const groupTypes = [
  {
    label: "Group Tickets",
    value: "UK ONE WAY GROUP",
    path: "public-groups",
    ownGroupType: "UK Groups",
  },
  {
    label: "Umrah Packages",
    value: "UMRAH Packages",
    path: "public-umrah-packages",
    ownGroupType: "Umrah Groups",
  },
];

const groupImages = {
  "Group Tickets":
    "https://images-konectbus.passenger-website.com/2024-12/Group%20Tickets.png",
  "Umrah Packages": madinaImg,
};

export default function HeroSection() {
  return (
    <section
      className="mt-20 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0c15 0%, #0f1119 50%, #0a0c15 100%)",
      }}
    >
      {/* Premium subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* TOP SECTION: Text Left + Video Right */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 lg:mb-20">
          {/* LEFT - Text Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="text-white">AL - MAMOORAH</span>
              </h1>
              <div>
                <span className="bg-linear-to-r from-purple-400 via-white to-white bg-clip-text text-transparent text-3xl sm:text-4xl lg:text-5xl font-light tracking-wider">
                  INTERNATIONAL
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg leading-relaxed text-white/80 max-w-lg">
              Crafting prestigious, tailor-made travel experiences. Discover
              curated premium group packages designed around absolute comfort
              and sophisticated luxury.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-linear-to-r from-emerald-400/50 to-transparent"></div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/70">
                Exclusive Access
              </span>
              <div className="h-px flex-1 bg-linear-to-l from-emerald-400/50 to-transparent"></div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="public-umrah-packages"
                className="px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  background: theme.colors.primary,
                  color: "white",
                  boxShadow: "0 10px 20px -5px rgba(16,185,129,0.3)",
                }}
              >
                Explore Umrah Packages →
              </Link>
            </div>
          </div>

          {/* RIGHT - Hero Video */}
          <div
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="aspect-video relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              >
                <source src={heroVid} type="video/mp4" />
              </video>

              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-purple-400 text-xs font-bold tracking-wider uppercase mb-1">
                  Cinematic Heritage
                </p>
                <h3 className="text-white text-xl font-bold">
                  Explore Our Premium Umrah Packages
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Group Cards Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Popular Umrah Packages and Group Tickets
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Discover our curated collection of premium packages
              </p>
            </div>
            <Link
              to="/groups"
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-semibold flex items-center gap-1 group"
            >
              View All
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>

          {/* SIDE-BY-SIDE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {groupTypes.map((group) => (
              <Link
                key={group.value}
                to={`/${group.path}`}
                className="group flex flex-row items-center rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-[#131622]"
                style={{
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* LEFT SIDE: Text Label */}
                <div className="w-1/2 p-5 flex flex-col justify-center items-start text-left z-10">
                  <span className="text-white font-extrabold text-lg sm:text-xl tracking-wide uppercase leading-tight">
                    {group.label}
                  </span>
                  <span className="text-purple-400 font-semibold text-xs mt-2 flex items-center gap-1">
                    Explore{" "}
                    <span className="text-sm group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </span>
                </div>

                {/* RIGHT SIDE: Image */}
                <div className="w-1/2 h-36 relative overflow-hidden">
                  <img
                    src={groupImages[group.label]}
                    alt={group.label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  {/* Subtle clean gradient shadow onto image from left side */}
                  <div className="absolute inset-0 bg-linear-to-r from-[#131622] via-transparent to-transparent w-1/4"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/20 to-transparent pointer-events-none"></div>
    </section>
  );
}
