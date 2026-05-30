import { Link } from "react-router-dom";
import heroVid from "../../assets/videos/masjid-nabvi.mp4";
// import ukImg from "../../assets/images/uk.webp";
// import qatarImg from "../../assets/images/qatar.jpg";
// import mascatImg from "../../assets/images/mascat.webp";
// import uaeImg from "../../assets/images/uae.webp";
// import bahrainImg from "../../assets/images/bahrain.webp";
// import jeddahImg from "../../assets/images/jeddah.webp";
import madinaImg from "../../assets/images/madina.jpg";
import { theme } from "../../theme/theme";
import { toast } from "react-toastify";

export const groupTypes = [
    {
        label: "Group Tickets",
        value: "UK ONE WAY GROUP",
        path: "all-groups",
        ownGroupType: "UK Groups",
    },
    {
        label: "Umrah Packages",
        value: "UMRAH Packages",
        path: "umrah-packages",
        ownGroupType: "Umrah Groups",
    },
];

const groupImages = {
    "Group Tickets":
        "https://images-konectbus.passenger-website.com/2024-12/Group%20Tickets.png",
    "Umrah Packages": madinaImg,
};

export default function HeroSection({ user }) {
    const isLoggedIn = (user && user?._id) ? true : false;

    return (
        <section className="relative mt-20 overflow-hidden bg-[#181818]">
            {/* Background Video */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover opacity-35"
            >
                <source src={heroVid} type="video/mp4" />
            </video>

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
                <div className="max-w-3xl">
                    <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                        Premium Travel & Umrah Services
                    </span>

                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                        ZEB Travels & Traders
                        <span
                            className="block text-[#D92B2B]"
                            style={{
                                textShadow: `
                                    0 0 10px rgba(217,43,43,0.7),
                                    0 0 20px rgba(217,43,43,0.5),
                                    0 0 40px rgba(255,108,108,0.3)
                                `
                            }}
                        >
                            Pvt Ltd.
                        </span>
                    </h1>

                    <p className="mt-4 sm:mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                        Discover carefully planned Umrah packages and group tickets with
                        reliable service, comfortable travel arrangements, and professional
                        support from start to finish.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to={isLoggedIn ? "/dashboard/umrah-packages" : "#"}
                            className="w-full text-center sm:w-fit rounded-full px-7! py-3! sm:py-4! text-sm font-bold text-white shadow-lg transition hover:-translate-y-1"
                            style={{ background: theme.colors.primary }}
                            onClick={(e) => {
                                if (!isLoggedIn) {
                                    e.preventDefault();
                                    toast.info("Please sign in to explore Umrah Packages.");
                                }
                            }}
                        >
                            Explore Umrah Packages
                        </Link>

                        <Link
                            to={isLoggedIn ? "/dashboard/all-groups" : "#"}
                            className="w-full text-center sm:w-fit rounded-full border border-white/20 bg-white/10 px-7! py-3! sm:py-4! text-sm font-bold text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/20"
                            onClick={(e) => {
                                if (!isLoggedIn) {
                                    e.preventDefault();
                                    toast.info("Please sign in to view Group Tickets.");
                                }
                            }}
                        >
                            View Group Tickets
                        </Link>
                    </div>
                </div>

                {/* Professional Cards */}
                <div className="mt-10 sm:mt-16 grid gap-5 sm:grid-cols-2 lg:max-w-4xl">
                    {groupTypes.map((group) => (
                        <Link
                            key={group.value}
                            to={isLoggedIn ? `/dashboard/${group.path}` : "#"}
                            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/10 p-3 sm:p-5 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                            onClick={(e) => {
                                if (!isLoggedIn) {
                                    e.preventDefault();
                                    toast.info("Please sign in to view this section.");
                                }
                            }}
                        >
                            <div className="flex items-center gap-5">
                                <div className="h-24! w-28! shrink-0 overflow-hidden rounded-2xl">
                                    <img
                                        src={groupImages[group.label]}
                                        alt={group.label}
                                        className="h-full! w-full! object-cover transition duration-500 group-hover:scale-110"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-xl font-extrabold text-white">
                                        {group.label}
                                    </h3>
                                    <p className="mt-2 text-sm text-white/65">
                                        Browse available options
                                    </p>
                                    <span className="mt-4 inline-flex text-sm font-bold text-white">
                                        Explore →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}