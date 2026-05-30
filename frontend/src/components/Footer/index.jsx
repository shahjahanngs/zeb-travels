import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { CiLogin } from "react-icons/ci";
import {
    FaWhatsapp,
    FaPhoneAlt,
    FaPlaneDeparture,
    FaFacebookF,
    FaInstagram,
} from "react-icons/fa";
import { IoMail, IoLocationSharp } from "react-icons/io5";
import { MdArrowOutward } from "react-icons/md";
import dayjs from "dayjs";
import { theme } from "../../theme/theme";

export default function Footer({ user }) {
    const quickLinks = ["Home", "About", "Packages", "Contact"];
    const services = ["Umrah Groups", "UAE Groups", "KSA Groups"];

    return (
        <>
            {!user?._id && (
                <section className="relative overflow-hidden bg-white px-4 py-8 sm:py-12 lg:py-16">
                    <div className="mx-auto max-w-7xl overflow-hidden rounded-4xl px-6 py-12 shadow-2xl sm:px-10 lg:px-14"
                        style={{
                            background: theme.colors.primary,
                        }}
                    >
                        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                            <div>
                                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                                    <FaPlaneDeparture className="text-2xl" />
                                </div>

                                <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                    Your Travel Journey Starts Here
                                </h2>

                                <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">
                                    Sign up to get the best travel deals, latest Umrah packages,
                                    and exclusive group ticket offers.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/auth/register"
                                    className="w-full sm:w-fit text-center rounded-full bg-white px-8 py-4 text-sm font-bold text-[#D92B2B] shadow-lg transition hover:-translate-y-1"
                                >
                                    Signup Now
                                </Link>

                                <a
                                    href="login"
                                    className="w-full sm:w-fit justify-center inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-white hover:text-[#D92B2B]"
                                >
                                    Login <CiLogin className="text-xl" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <footer className="bg-[#f8f8f8] text-slate-700">
                <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
                    <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr]">
                        {/* Brand */}
                        <div>
                            <img
                                src={logo}
                                alt="logo"
                                className="mb-5 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-sm"
                            />

                            <h2 className="text-lg font-extrabold text-slate-950">
                                ZEB Travels & Traders Pvt Ltd.
                            </h2>

                            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
                                We make your travel dreams more beautiful and enjoyable with
                                reliable bookings, Umrah packages, and professional travel
                                support.
                            </p>

                            {/* <div className="mt-6 flex gap-3">
                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D92B2B]/10 text-[#D92B2B] transition hover:bg-[#D92B2B] hover:text-white"
                                >
                                    <FaFacebookF />
                                </a>

                                <a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D92B2B]/10 text-[#D92B2B] transition hover:bg-[#D92B2B] hover:text-white"
                                >
                                    <FaInstagram />
                                </a>
                            </div> */}
                        </div>

                        {/* Links */}
                        <div>
                            <h3 className="mb-5 text-lg font-extrabold text-slate-950">
                                Quick Links
                            </h3>

                            <div className="flex flex-col gap-3">
                                {quickLinks.map((item) => (
                                    <button
                                        key={item}
                                        className="px-0! group inline-flex items-center gap-2 text-left text-sm font-semibold text-slate-600 transition hover:text-[#D92B2B]"
                                    >
                                        <MdArrowOutward className="opacity-100 transition group-hover:opacity-100" />
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="mb-5 text-lg font-extrabold text-slate-950">
                                Services
                            </h3>

                            <div className="flex flex-col gap-3">
                                {services.map((item) => (
                                    <button
                                        key={item}
                                        className="px-0! group inline-flex items-center gap-2 text-left text-sm font-semibold text-slate-600 transition hover:text-[#D92B2B]"
                                    >
                                        <MdArrowOutward className="opacity-100 transition group-hover:opacity-100" />
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="mb-5 text-lg font-extrabold text-slate-950">
                                Contact Info
                            </h3>

                            <div className="flex flex-col gap-4">
                                <a
                                    href="https://wa.me/923135757057"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 text-sm font-semibold text-slate-600 transition hover:text-[#D92B2B]"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D92B2B]/10 text-[#D92B2B]">
                                        <FaWhatsapp size={18} />
                                    </span>
                                    03135757057
                                </a>

                                {/* <a
                                    href="tel:+92515519875"
                                    className="flex items-center gap-3 text-sm font-semibold text-slate-600 transition hover:text-[#D92B2B]"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D92B2B]/10 text-[#D92B2B]">
                                        <FaPhoneAlt />
                                    </span>
                                    051-5519875
                                </a> */}

                                <a
                                    href="mailto:Travelerwasim@gmail.com"
                                    className="flex items-center gap-3 break-all text-sm font-semibold text-slate-600 transition hover:text-[#D92B2B]"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D92B2B]/10 text-[#D92B2B]">
                                        <IoMail size={18} />
                                    </span>
                                    Travelerwasim@gmail.com
                                </a>

                                <a
                                    href="https://maps.app.goo.gl/RjPFmoQ83JAvyMbu5"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-600 transition hover:text-[#D92B2B]"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D92B2B]/10 text-[#D92B2B]">
                                        <IoLocationSharp size={18} />
                                    </span>
                                    <span>
                                        Office No: 2, Mezzanine Floor, Taimoor Chamber, Blue, Area G 6/2 Blue Area, Islamabad, 44000.
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500 md:flex-row">
                        <a href="https://www.zebtravel.com">
                            &copy; {dayjs().year()} ZEB Travels and Traders Pvt Ltd.
                        </a>

                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://nexagensolution.com/"
                            className="transition hover:text-[#D92B2B]"
                        >
                            Designed & Developed by Nexagen Solution
                        </a>
                    </div>
                </div>
            </footer>
        </>
    );
}

// import logo from "../../assets/images/logo.png";
// import { CiLogin } from "react-icons/ci";
// import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
// import { IoMail, IoLocationSharp } from "react-icons/io5";
// import dayjs from "dayjs";
// import { Link } from "react-router-dom";
// import { theme } from "../../theme/theme";
// import { Plane } from "lucide-react";

// export default function Footer({ user }) {
//   return (
//     <>
//       {/* TOP CTA */}
//       {!user?._id && (
//         <div
//           className="py-24 px-4"
//           style={{
//             background: theme.colors.primary,
//           }}
//         >
//           <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
//             <div className="flex flex-col items-center gap-3 text-white">
//               <div className="relative">
//                 <img
//                   src="https://ex-coders.com/html/turmet/assets/img/plane-shape.png"
//                   alt=""
//                   style={{ height: "150px" }}
//                 />
//                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/20 rounded-full blur-md" />
//               </div>

//               <div>
//                 <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
//                   Your Travel Journey Starts Here
//                 </h2>
//                 <p className="text-lg opacity-90 max-w-lg mx-auto">
//                   Sign up to get the best travel deals & offers and stay updated
//                   with our latest packages.
//                 </p>
//               </div>
//             </div>

//             <div className="flex flex-wrap justify-center gap-4 mt-2">
//               <Link
//                 to="/auth/register"
//                 className="px-8 py-4 rounded-md font-semibold text-lg transition-all hover:bg-opacity-90 shadow-lg"
//                 style={{
//                   background: "#fff",
//                   color: theme.colors.primary,
//                 }}
//               >
//                 Signup Now
//               </Link>

//               <a
//                 href="#login"
//                 className="flex items-center gap-2 text-white px-8 py-4 rounded-md border-2 font-semibold text-lg transition-all hover:bg-white hover:text-black hover:border-white"
//                 style={{ borderColor: "#fff" }}
//               >
//                 Login <CiLogin className="text-xl" />
//               </a>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MAIN FOOTER */}
//       <footer
//         className="relative pt-16 text-white"
//         style={{
//           backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url("https://images.pexels.com/photos/35889296/pexels-photo-35889296.jpeg")`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//         }}
//       >
//         <div className="main-container grid grid-cols-1 lg:grid-cols-2 gap-10 pb-12">
//           {/* LEFT */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Logo */}
//             <div>
//               <img
//                 src={logo}
//                 alt="logo"
//                 className="w-60 bg-white mb-4 rounded p-2"
//               />
//               <h2
//                 className="text-lg font-semibold"
//                 style={{ color: theme.colors.sidebarTextLight }}
//               >
//                 ZEB Travels & Traders Pvt Ltd.
//               </h2>
//               <p
//                 className="mt-3 text-sm leading-relaxed"
//                 style={{ color: theme.colors.sidebarText }}
//               >
//                 We make your travel dreams more beautiful and enjoyable with
//                 seamless experiences.
//               </p>
//             </div>

//             {/* Links */}
//             <div>
//               <h3
//                 className="text-xl mb-5 font-semibold"
//                 style={{ color: theme.colors.sidebarTextLight }}
//               >
//                 Links
//               </h3>
//               <div className="flex flex-col gap-3">
//                 {["Home", "About", "Packages", "Contact"].map((item) => (
//                   <button
//                     key={item}
//                     className="text-left transition-all duration-300 hover:translate-x-1"
//                     style={{ color: theme.colors.sidebarText }}
//                   >
//                     {item}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Services */}
//             <div>
//               <h3
//                 className="text-xl mb-5 font-semibold"
//                 style={{ color: theme.colors.sidebarTextLight }}
//               >
//                 Services
//               </h3>
//               <div className="flex flex-col gap-3">
//                 {["Umrah Groups", "UAE Groups", "KSA Groups"].map((item) => (
//                   <button
//                     key={item}
//                     className="text-left transition-all duration-300 hover:translate-x-1"
//                     style={{ color: theme.colors.sidebarText }}
//                   >
//                     {item}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Contact - UPDATED */}
//             <div>
//               <h3
//                 className="text-xl mb-5 font-semibold"
//                 style={{ color: theme.colors.sidebarTextLight }}
//               >
//                 Contact
//               </h3>

//               <div className="flex flex-col gap-4">
//                 <a
//                   href="https://wa.me/+923005008889"
//                   target="_blank"
//                   className="flex items-center gap-3 hover:translate-x-1 transition"
//                   style={{ color: theme.colors.sidebarText }}
//                 >
//                   <FaWhatsapp className="text-2xl" /> 0313-5757057
//                 </a>

//                 <a
//                   href="tel:+92515519875"
//                   className="flex items-center gap-3 hover:translate-x-1 transition"
//                   style={{ color: theme.colors.sidebarText }}
//                 >
//                   <FaPhoneAlt /> 051-5519875
//                 </a>

//                 <a
//                   href="tel:+92515513421"
//                   className="flex items-center gap-3 hover:translate-x-1 transition"
//                   style={{ color: theme.colors.sidebarText }}
//                 >
//                   <FaPhoneAlt /> 051-5513421
//                 </a>

//                 <a
//                   href="mailto:Travelerwasim@gmail.com"
//                   className="flex items-center gap-3 break-all hover:translate-x-1 transition"
//                   style={{ color: theme.colors.sidebarText }}
//                 >
//                   <IoMail /> Travelerwasim@gmail.com
//                 </a>

//                 <a
//                   href="https://maps.app.goo.gl/vMPsMjEUP2dkFK3v6"
//                   target="_blank"
//                   className="flex items-start gap-3 hover:translate-x-1 transition"
//                   style={{ color: theme.colors.sidebarText }}
//                 >
//                   <IoLocationSharp className="mt-1 text-3xl" />
//                   Office # 15-16, Ground Floor, Poonch House,
//                   <br />
//                   Adamjee Road, Saddar, Rawalpindi, Pakistan
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* BOTTOM */}
//         <div
//           className="main-container flex flex-col md:flex-row justify-between items-center gap-3 py-6 border-t"
//           style={{ borderColor: theme.colors.sidebarBorder }}
//         >
//           <a
//             href="https://www.zebtravel.com"
//             style={{ color: theme.colors.sidebarText }}
//           >
//             &copy; {dayjs().year()} ZEB Travels and Traders Pvt Ltd.
//           </a>

//           <a
//             target="_blank"
//             href="https://nexagensolution.com/"
//             className="text-sm"
//             style={{ color: theme.colors.sidebarText }}
//           >
//             Designed & Developed by Nexagen Solution
//           </a>
//         </div>
//       </footer>
//     </>
//   );
// }