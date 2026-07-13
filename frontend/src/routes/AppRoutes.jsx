import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SkeletonRows } from "../components/common/Feedback";

/* PUBLIC */
const Home = lazy(() => import("../pages/public/Home"));
const HowItWorks = lazy(() => import("../pages/public/HowItWorks"));
const Activities = lazy(() => import("../pages/public/Activities"));
const Safety = lazy(() => import("../pages/public/Safety"));
const Contact = lazy(() => import("../pages/public/Contact"));
const EarnWithBuddyBook = lazy(() => import("../pages/public/EarnWithBuddyBook"));
const TrustAndSafety = lazy(() => import("../pages/public/TrustAndSafety"));
const PublicProviderProfile = lazy(() => import("../pages/public/PublicProviderProfile"));
const NotFound = lazy(() => import("../pages/public/NotFound"));

/* AUTH */
const Login=lazy(()=>import("../pages/auth/Login")); const Register=lazy(()=>import("../pages/auth/Register")); const ChooseRole=lazy(()=>import("../pages/auth/ChooseRole"));

/* USER */
const UserDashboard=lazy(()=>import("../pages/user/UserDashboard")); const UserBookingPayment=lazy(()=>import("../pages/user/UserBookingPayment")); const UserBookings=lazy(()=>import("../pages/user/UserBookings")); const UserPayments=lazy(()=>import("../pages/user/UserPayments")); const UserWatchlist=lazy(()=>import("../pages/user/UserWatchlist")); const UserActiveMeet=lazy(()=>import("../pages/user/UserActiveMeet")); const UserProfile=lazy(()=>import("../pages/user/UserProfile")); const UserReviews=lazy(()=>import("../pages/user/UserReviews")); const UserSettings=lazy(()=>import("../pages/user/UserSettings")); const UserChats=lazy(()=>import("../pages/user/UserChats"));

/* PROVIDER */
const ProviderDashboard=lazy(()=>import("../pages/provider/ProviderDashboard")); const ProviderCreate=lazy(()=>import("../pages/provider/ProviderCreate")); const ProviderReviews=lazy(()=>import("../pages/provider/ProviderReviews")); const ProviderSettings=lazy(()=>import("../pages/provider/ProviderSettings")); const ProviderChats=lazy(()=>import("../pages/provider/ProviderChats")); const ProviderUserProfile=lazy(()=>import("../pages/provider/ProviderUserProfile"));
const ProviderBookings=lazy(()=>import("../pages/provider/ProviderWorkspacePages").then(m=>({default:m.ProviderBookings}))); const ProviderEarnings=lazy(()=>import("../pages/provider/ProviderWorkspacePages").then(m=>({default:m.ProviderEarnings}))); const ProviderServices=lazy(()=>import("../pages/provider/ProviderWorkspacePages").then(m=>({default:m.ProviderServices}))); const ProviderAvailability=lazy(()=>import("../pages/provider/ProviderWorkspacePages").then(m=>({default:m.ProviderAvailability})));

/* ADMIN */
const AdminLogin=lazy(()=>import("../pages/admin/AdminLogin")); const AdminDashboard=lazy(()=>import("../pages/admin/AdminDashboard"));
const AdminKyc = lazy(() => import("../pages/admin/AdminKyc"));
const AdminOrders=lazy(()=>import("../pages/admin/AdminOrders")); const AdminReturns=lazy(()=>import("../pages/admin/AdminReturns")); const AdminContent=lazy(()=>import("../pages/admin/AdminContent")); const AdminUsers=lazy(()=>import("../pages/admin/AdminUsers")); const AdminUserProfile=lazy(()=>import("../pages/admin/AdminUserProfile")); const AdminProviders=lazy(()=>import("../pages/admin/AdminProviders")); const AdminBookings=lazy(()=>import("../pages/admin/AdminBookings")); const AdminPayments=lazy(()=>import("../pages/admin/AdminPayments")); const AdminSettings=lazy(()=>import("../pages/admin/AdminSettings")); const AdminReports=lazy(()=>import("../pages/admin/AdminReports"));
import ProtectedAdminRoute from "../components/layout/ProtectedAdminRoute";
import ProtectedRoleRoute from "../components/layout/ProtectedRoleRoute";

export default function AppRoutes() {
  const userOnly = (element) => <ProtectedRoleRoute role="USER">{element}</ProtectedRoleRoute>;
  const providerOnly = (element) => <ProtectedRoleRoute role="PROVIDER">{element}</ProtectedRoleRoute>;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffaf3] p-8 pt-28"><SkeletonRows count={7} /></div>}><Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/activities" element={<Activities />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/earn-with-buddybook" element={<EarnWithBuddyBook />} />
      <Route path="/trust-safety" element={<TrustAndSafety />} />
      <Route path="/providers/:providerId" element={<PublicProviderProfile />} />
      <Route path="/404" element={<NotFound />} />

      {/* AUTH ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-role" element={<ChooseRole />} />

      {/* USER ROUTES */}
      <Route path="/app/user/dashboard" element={userOnly(<UserDashboard />)} />
      <Route path="/app/user/search" element={userOnly(<Navigate to="/app/user/dashboard" replace />)} />
      <Route path="/app/user/watchlist" element={userOnly(<UserWatchlist />)} />

      <Route
        path="/app/user/provider/:providerId"
        element={userOnly(<PublicProviderProfile />)}
      />

      <Route
        path="/app/user/provider/:providerId/book"
        element={userOnly(<UserBookingPayment />)}
      />

      <Route path="/app/user/bookings" element={userOnly(<UserBookings />)} />
      <Route path="/app/user/chat" element={userOnly(<UserChats />)} />
      <Route path="/app/user/payments" element={userOnly(<UserPayments />)} />
      <Route path="/app/user/wallet" element={userOnly(<UserPayments />)} />

      <Route
        path="/app/user/active-meet/:bookingId"
        element={userOnly(<UserActiveMeet />)}
      />

      <Route path="/app/user/reviews" element={userOnly(<UserReviews />)} />
      <Route path="/app/user/profile" element={userOnly(<UserProfile />)} />
      <Route path="/app/user/settings" element={userOnly(<UserSettings />)} />

      {/* PROVIDER ROUTES */}
      <Route
        path="/app/provider/dashboard"
        element={providerOnly(<ProviderDashboard />)}
      />
      <Route path="/app/provider/create" element={providerOnly(<ProviderCreate />)} />
      <Route
        path="/app/provider/services"
        element={providerOnly(<ProviderServices />)}
      />
      <Route
        path="/app/provider/availability"
        element={providerOnly(<ProviderAvailability />)}
      />
      <Route
        path="/app/provider/bookings"
        element={providerOnly(<ProviderBookings />)}
      />
      <Route path="/app/provider/chat" element={providerOnly(<ProviderChats />)} />
      <Route path="/app/provider/users/:userId" element={providerOnly(<ProviderUserProfile />)} />
      <Route
        path="/app/provider/earnings"
        element={providerOnly(<ProviderEarnings />)}
      />
      <Route path="/app/provider/reviews" element={providerOnly(<ProviderReviews />)} />
      <Route path="/app/provider/profile" element={providerOnly(<ProviderCreate />)} />
      <Route path="/app/provider/settings" element={providerOnly(<ProviderSettings />)} />

      {/* ADMIN ROUTES */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
      } />
      <Route path="/admin/content" element={
        <ProtectedAdminRoute><AdminContent /></ProtectedAdminRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>
      } />
      <Route path="/admin/returns" element={
        <ProtectedAdminRoute><AdminReturns /></ProtectedAdminRoute>
      } />
      <Route
        path="/admin/users"
        element={
          <ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedAdminRoute><AdminUserProfile /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/providers"
        element={
          <ProtectedAdminRoute><AdminProviders /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/kyc"
        element={
          <ProtectedAdminRoute><AdminKyc /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedAdminRoute><AdminPayments /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense>
  );
}
