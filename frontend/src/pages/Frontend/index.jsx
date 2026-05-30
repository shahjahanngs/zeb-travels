import { useEffect, useState } from "react";
import {
  Route,
  Routes,
  Navigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import Header from "../../components/Header";
import Home from "./Home";
import AllGroups from "./AllGroups";
import BookingForm from "../../components/BookingForm";
import Bank from "./Bank";
import Footer from "../../components/Footer";
import NoPage from "../../components/NoPage";
import Register from "../Auth/Register";
import ForgotPassword from "../Auth/ForgotPassword";
import Payment from "./Payment";
import DashboardLayout from "../../components/Dashboard/DashboardLayout";
import Dashboard from "./Dashboard";
import Ledger from "./Ledger";
import ChangePassword from "../../components/ChangePassword/ChnagePassword";
import Profile from "../../components/Profile/Profile";
import MyBookings from "../MyBookings";
import BookingDetail from "../BookingDetail";
// import { groupTypes } from "../../data/groupTypes";
import { getUserProfile } from "../../api/profileApi";
import UmrahBooking from "./UmrahPackagebooking/UmrahPackageBooking";
import UmrahPackageBooking from "./UmrahPackagebooking/UmrahPackageBooking";
import DetailPage from "./AllGroups/DetailPage";
import AllGroupsPackages from "./AllGroups/Allgroups";
import UmrahBookingPage from "../UmrahBookingPage";
import Login from "../Auth/Login";
import PublicUmrahPackages from "./AllGroups/PublicUmrahPackages";
import UmrahPackageCalculator from "./UmrahCalculator";
import MyUmrahCalculator from "./MyUmrahCalculator/MyUmrahCalculator";
import UmrahCalculatorDetail from "./UmrahCalculatorDetail/UmrahCalculator";

export const groupTypes = [
  {
    label: "All Groups",
    value: "",
    path: "all-groups",
    ownGroupType: "",
  },
  {
    label: "UAE Groups",
    value: "UAE ONE WAY GROUP",
    path: "all-groups?group_type=UAE ONE WAY GROUP",
    ownGroupType: "UAE Groups",
  },
  {
    label: "KSA Groups",
    value: "ONE WAY GROUP",
    path: "all-groups?group_type=ONE WAY GROUP",
    ownGroupType: "KSA Groups",
  },
  {
    label: "Bahrain Groups",
    value: "BAHRAIN ONE WAY GROUP",
    path: "all-groups?group_type=BAHRAIN ONE WAY GROUP",
    ownGroupType: "Bahrain Groups",
  },
  {
    label: "Muscat Groups",
    value: "OMAN ONE WAY GROUP",
    path: "all-groups?group_type=OMAN ONE WAY GROUP",
    ownGroupType: "Mascat Groups",
  },
  {
    label: "Qatar Groups",
    value: "QATAR ONE WAY GROUP",
    path: "all-groups?group_type=QATAR ONE WAY GROUP",
    ownGroupType: "Qatar Groups",
  },
  {
    label: "UK Groups",
    value: "UK ONE WAY GROUP",
    path: "all-groups?group_type=UK ONE WAY GROUP",
    ownGroupType: "UK Groups",
  },
  {
    label: "Umrah Groups",
    value: "UMRAH GROUPS",
    path: "all-groups?group_type=UMRAH ONE WAY GROUP",
    ownGroupType: "Umrah Groups",
  },
];

export default function Frontend() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile();
        const userData = response.data; // ← Make sure this is correct

        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogin = (userData) => {
    console.log("Login handler called with:", userData);
    setUser(userData);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("frontend_token");
    localStorage.removeItem("frontend_user");
    window.location.href = "/";
    setUser(null);
  };

  const normalizeParams = (str) => {
    return decodeURIComponent(str.replace(/\+/g, " "));
  };

  const handleGroupTypeChange = (groupType) => {
    if (groupType) {
      setSearchParams({ group_type: groupType });
    } else {
      setSearchParams({});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes with Header and Footer */}
      <Route
        path="/"
        element={
          <>
            <Header user={user} handleLogout={handleLogout} />
            <Home user={user} onLogin={handleLogin} />
            <Footer user={user} />
          </>
        }
      />
      <Route
        path="/home"
        element={
          <>
            <Header user={user} handleLogout={handleLogout} />
            <Home user={user} onLogin={handleLogin} />
            <Footer user={user} />
          </>
        }
      />
      <Route
        path="/auth/register"
        element={
          !user ? (
            <>
              <Header user={user} handleLogout={handleLogout} />
              <Register />
              <Footer user={user} />
            </>
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <>
            <ForgotPassword />
          </>
        }
      />

      {/* Original Routes with Header and Footer - Protected */}
      <Route
        path="/all-groups"
        element={
          user ? (
            <>
              <Header user={user} handleLogout={handleLogout} />
              <div className="bg-gray-50">
                <div className="w-full min-h-screen mx-auto pt-22 px-3 sm:px-8 md:px-12">
                  <AllGroupsPackages
                    user={user}
                    headerType="frontend"
                    header={
                      <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900">
                          Search Groups
                        </h1>
                        {/* <p className="text-sm sm:text-base text-gray-600">
                          Browse and book available flight groups
                        </p> */}
                      </div>
                    }
                    searchParams={searchParams}
                  />
                </div>
              </div>
              <Footer user={user} />
            </>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/public-groups"
        element={
          <>
            <Header user={user} handleLogout={handleLogout} />
            <div className="bg-gray-50">
              <div className="w-full min-h-screen mx-auto pt-22 px-3 sm:px-8 md:px-12">
                <AllGroupsPackages
                  user={user}
                  headerType="frontend"
                  header={
                    <div>
                      <h1 className="text-lg md:text-xl font-bold text-gray-900">
                        Search Groups
                      </h1>
                    </div>
                  }
                  searchParams={searchParams}
                />
              </div>
            </div>
            <Footer user={user} />
          </>
        }
      />

      <Route
        path="/public-umrah-packages"
        element={
          <>
            <Header user={user} handleLogout={handleLogout} />
            <div className="mt-30">
              <PublicUmrahPackages
                user={user}
                headerType="frontend"
                searchParams={searchParams}
              />
            </div>
            <Footer user={user} />
          </>
        }
      />
      <Route
        path="/login"
        element={
          <>
            <Login onLogin={handleLogin} />
          </>
        }
      />

      <Route
        path="/banks"
        element={
          user ? (
            <>
              <Header user={user} handleLogout={handleLogout} />
              <Bank />
              <Footer user={user} />
            </>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/payment"
        element={
          user ? (
            <>
              <Header user={user} handleLogout={handleLogout} />
              <Payment user={user} />
              <Footer user={user} />
            </>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Dashboard Routes - Protected */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <DashboardLayout user={user} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="umrah-packages"
          element={
            <AllGroups
              user={user}
              headerType="dashboard"
              searchParams={searchParams}
            />
          }
        />

        <Route
          path="all-groups"
          element={
            <AllGroupsPackages
              user={user}
              headerType="dashboard"
              header={
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {groupTypes.map((type) => (
                    <Link
                      to={`/dashboard/${type.path}`}
                      key={type.value}
                      onClick={() => handleGroupTypeChange(type.value)}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                        (normalizeParams(searchParams.toString()) || "") ===
                        normalizeParams(type.path.split("?")[1] || "")
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {type.label}
                    </Link>
                  ))}
                </div>
              }
              searchParams={searchParams}
            />
          }
        />
        {/* Umrah Calculator */}
        <Route
          path="umrah-calculator"
          element={
            <>
              {/* <Header user={user} /> */}
              <UmrahPackageCalculator user={user} />
              {/* <Footer /> */}
            </>
          }
        />

        <Route path="my-umrah-calculator" element={<MyUmrahCalculator />} />
        <Route
          path="my-umrah-calculator-detail/:id"
          element={<UmrahCalculatorDetail />}
        />
        <Route path="booking" element={<BookingForm user={user} />} />
        <Route path="umrah-pkgs" element={<BookingForm user={user} />} />
        <Route path="pkg-detail" element={<DetailPage user={user} />} />
        <Route path="umrah-pkg-booking" element={<UmrahPackageBooking />} />
        <Route path="umrah-booking" element={<UmrahBooking />} />
        <Route path="banks" element={<Bank />} />
        <Route path="payment" element={<Payment user={user} />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="book-umrah" element={<UmrahBookingPage user={user} />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="booking-detail/:id" element={<BookingDetail />} />
        <Route path="edit-booking/:id" element={<BookingForm />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Profile Route - Standalone Protected */}
      <Route
        path="/profile"
        element={
          user ? (
            <>
              <Header user={user} handleLogout={handleLogout} />
              <Profile />
              <Footer user={user} />
            </>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 404 Page */}
      <Route
        path="*"
        element={
          <>
            <Header user={user} handleLogout={handleLogout} />
            <NoPage />
            <Footer user={user} />
          </>
        }
      />
    </Routes>
  );
}
