import { Navigate, Route, Routes } from "react-router-dom";

/* PUBLIC */
import Home from "../pages/public/Home";
import HowItWorks from "../pages/public/HowItWorks";
import Activities from "../pages/public/Activities";
import Safety from "../pages/public/Safety";
import Contact from "../pages/public/Contact";
import EarnWithBuddyBook from "../pages/public/EarnWithBuddyBook";
import TrustAndSafety from "../pages/public/TrustAndSafety";
import PublicProviderProfile from "../pages/public/PublicProviderProfile";

/* AUTH */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ChooseRole from "../pages/auth/ChooseRole";

/* USER */
import UserDashboard from "../pages/user/UserDashboard";
import UserProviderProfile from "../pages/user/UserProviderProfile";
import UserBookingPayment from "../pages/user/UserBookingPayment";
import UserBookings from "../pages/user/UserBookings";
import UserPayments from "../pages/user/UserPayments";
import UserWatchlist from "../pages/user/UserWatchlist";
import UserActiveMeet from "../pages/user/UserActiveMeet";
import UserProfile from "../pages/user/UserProfile";
import UserReviews from "../pages/user/UserReviews";
import UserSettings from "../pages/user/UserSettings";
import UserChats from "../pages/user/UserChats";

/* PROVIDER */
import ProviderDashboard from "../pages/provider/ProviderDashboard";
import ProviderCreate from "../pages/provider/ProviderCreate";
import ProviderReviews from "../pages/provider/ProviderReviews";
import ProviderSettings from "../pages/provider/ProviderSettings";
import ProviderChats from "../pages/provider/ProviderChats";
import {
  ProviderBookings,
  ProviderEarnings,
} from "../pages/provider/ProviderWorkspacePages";

/* ADMIN */
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminComingSoon from "../pages/admin/AdminComingSoon";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminReturns from "../pages/admin/AdminReturns";
import AdminCustomers from "../pages/admin/AdminCustomers";
import AdminContent from "../pages/admin/AdminContent";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUserProfile from "../pages/admin/AdminUserProfile";
import AdminProviders from "../pages/admin/AdminProviders";
import AdminBookings from "../pages/admin/AdminBookings";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminSettings from "../pages/admin/AdminSettings";
import ProtectedAdminRoute from "../components/layout/ProtectedAdminRoute";
import ProtectedRoleRoute from "../components/layout/ProtectedRoleRoute";

export default function AppRoutes() {
  const userOnly = (element) => <ProtectedRoleRoute role="USER">{element}</ProtectedRoleRoute>;
  const providerOnly = (element) => <ProtectedRoleRoute role="PROVIDER">{element}</ProtectedRoleRoute>;

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/activities" element={<Activities />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/earn-with-buddybook" element={<EarnWithBuddyBook />} />
      <Route path="/trust-safety" element={<TrustAndSafety />} />
      <Route path="/providers/:providerId" element={<PublicProviderProfile />} />

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
        element={userOnly(<UserProviderProfile />)}
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
        element={providerOnly(<Navigate to="/app/provider/profile" replace />)}
      />
      <Route
        path="/app/provider/availability"
        element={providerOnly(<ProviderCreate />)}
      />
      <Route
        path="/app/provider/bookings"
        element={providerOnly(<ProviderBookings />)}
      />
      <Route path="/app/provider/chat" element={providerOnly(<ProviderChats />)} />
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
          <ProtectedAdminRoute><AdminComingSoon title="KYC Approvals" /></ProtectedAdminRoute>
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
          <ProtectedAdminRoute><AdminComingSoon title="Reports & Disputes" /></ProtectedAdminRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
