import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SkeletonRows } from "../components/common/Feedback";
import { UserWorkspaceRoute } from "../components/users/UserAppLayout";
import { ProviderWorkspaceRoute } from "../components/layout/AppShell";
import MyReports from "../pages/common/MyReports";
import UserDashboard from "../pages/user/UserDashboard";
import UserBookingPayment from "../pages/user/UserBookingPayment";
import UserBookings from "../pages/user/UserBookings";
import UserPayments from "../pages/user/UserPayments";
import UserWatchlist from "../pages/user/UserWatchlist";
import UserActiveMeet from "../pages/user/UserActiveMeet";
import UserProfile from "../pages/user/UserProfile";
import UserReviews from "../pages/user/UserReviews";
import UserSettings from "../pages/user/UserSettings";
import UserChats from "../pages/user/UserChats";
import ProviderDashboard from "../pages/provider/ProviderDashboard";
import ProviderCreate from "../pages/provider/ProviderCreate";
import ProviderReviews from "../pages/provider/ProviderReviews";
import ProviderSettings from "../pages/provider/ProviderSettings";
import ProviderChats from "../pages/provider/ProviderChats";
import ProviderUserProfile from "../pages/provider/ProviderUserProfile";
import ProviderProfile from "../pages/provider/ProviderProfile";
import {
  ProviderAvailability,
  ProviderBookings,
  ProviderEarnings,
  ProviderServices,
} from "../pages/provider/ProviderWorkspacePages";

/* PUBLIC */
const Home = lazy(() => import("../pages/public/Home"));
const Activities = lazy(() => import("../pages/public/Activities"));
const HowItWorks = lazy(() => import("../pages/public/HowItWorks"));
const Safety = lazy(() => import("../pages/public/Safety"));
const Contact = lazy(() => import("../pages/public/Contact"));
const EarnWithBuddyBook = lazy(() => import("../pages/public/EarnWithBuddyBook"));
const TrustAndSafety = lazy(() => import("../pages/public/TrustAndSafety"));
const PublicProviderProfile = lazy(() => import("../pages/public/PublicProviderProfile"));
const NotFound = lazy(() => import("../pages/public/NotFound"));

/* AUTH */
const Login=lazy(()=>import("../pages/auth/Login")); const Register=lazy(()=>import("../pages/auth/Register")); const ChooseRole=lazy(()=>import("../pages/auth/ChooseRole"));
const ApplicationReview=lazy(()=>import("../pages/auth/ApplicationReview"));

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
      <Route path="/application-review" element={<ApplicationReview />} />

      {/* USER ROUTES */}
      <Route path="/app/user" element={userOnly(<UserWorkspaceRoute />)}>
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="search" element={<Navigate to="/app/user/dashboard" replace />} />
        <Route path="watchlist" element={<UserWatchlist />} />
        <Route path="provider/:providerId/book" element={<UserBookingPayment />} />
        <Route path="bookings" element={<UserBookings />} />
        <Route path="chat" element={<UserChats />} />
        <Route path="payments" element={<UserPayments />} />
        <Route path="wallet" element={<UserPayments />} />
        <Route path="active-meet/:bookingId" element={<UserActiveMeet />} />
        <Route path="reviews" element={<UserReviews />} />
        <Route path="reports" element={<MyReports type="user" />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="profile-view" element={<ProviderUserProfile self />} />
        <Route path="settings" element={<UserSettings />} />
      </Route>
      <Route
        path="/app/user/provider/:providerId"
        element={userOnly(<PublicProviderProfile />)}
      />

      {/* PROVIDER ROUTES */}
      <Route path="/app/provider" element={providerOnly(<ProviderWorkspaceRoute />)}>
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="create" element={<ProviderCreate />} />
        <Route path="services" element={<ProviderServices />} />
        <Route path="availability" element={<ProviderAvailability />} />
        <Route path="bookings" element={<ProviderBookings />} />
        <Route path="chat" element={<ProviderChats />} />
        <Route path="users/:userId" element={<ProviderUserProfile />} />
        <Route path="earnings" element={<ProviderEarnings />} />
        <Route path="reviews" element={<ProviderReviews />} />
        <Route path="reports" element={<MyReports type="provider" />} />
        <Route path="profile" element={<ProviderProfile />} />
        <Route path="settings" element={<ProviderSettings />} />
      </Route>

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
