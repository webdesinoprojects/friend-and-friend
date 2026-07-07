import { getBookings, getPayments, getReviews } from "../../utils/userFlowStorage";

const fallbackImage =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=160&auto=format&fit=crop";

export function getAdminOrders() {
  const payments = getPayments();

  return getBookings().map((booking, index) => {
    const payment = payments.find((item) => item.bookingId === booking.id) || {};
    const quantity = Number(booking.quantity || booking.durationHours || 1);
    const price = Number(booking.amount || payment.amount || 0);

    return {
      id: booking.id || `ORDER-${index + 1}`,
      image: booking.providerImage || booking.image || fallbackImage,
      name: booking.service || booking.activity || "BuddyBOOK booking",
      customerName: booking.userName || getStoredUser()?.fullName || "Customer",
      customerEmail: booking.userEmail || getStoredUser()?.email || "Not added",
      customerPhone: booking.userPhone || getStoredUser()?.phone || "Not added",
      providerName: booking.providerName || "Provider",
      quantity,
      price,
      date: booking.date || booking.createdAt || payment.createdAt,
      status: String(booking.status || payment.status || "PENDING").toUpperCase(),
      paymentStatus: String(booking.paymentStatus || payment.status || "PENDING").toUpperCase(),
      paymentMethod: booking.paymentMethod || payment.method || "Online",
    };
  });
}

export function getReturnRefundOrders() {
  const returnStatuses = new Set([
    "RETURNED",
    "RETURN_REQUESTED",
    "REFUNDED",
    "REFUND_REQUESTED",
    "REPLACED",
    "CANCELLED",
  ]);

  return getAdminOrders().filter((order) => returnStatuses.has(order.status) || order.paymentStatus === "REFUNDED");
}

export function getAdminCustomers() {
  const orders = getAdminOrders();
  const reviews = getReviews();
  const users = new Map();

  const storedUser = getStoredUser();
  if (storedUser?.id || storedUser?.phone || storedUser?.email) {
    users.set(customerKey(storedUser), {
      id: customerKey(storedUser),
      name: storedUser.fullName || "Customer",
      email: storedUser.email || "Not added",
      phone: storedUser.phone || "Not added",
      orders: [],
      reviews: [],
    });
  }

  orders.forEach((order) => {
    const key = order.customerEmail !== "Not added" ? order.customerEmail : order.customerPhone;
    if (!users.has(key)) {
      users.set(key, {
        id: key,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        orders: [],
        reviews: [],
      });
    }
    users.get(key).orders.push(order);
  });

  reviews
    .filter((review) => review.reviewerRole === "USER")
    .forEach((review) => {
      const key = storedUser?.email || storedUser?.phone || "local-customer";
      if (!users.has(key)) {
        users.set(key, {
          id: key,
          name: storedUser?.fullName || "Customer",
          email: storedUser?.email || "Not added",
          phone: storedUser?.phone || "Not added",
          orders: [],
          reviews: [],
        });
      }
      users.get(key).reviews.push(review);
    });

  return Array.from(users.values()).map((customer) => {
    const returned = customer.orders.filter((order) => ["RETURNED", "REFUNDED", "CANCELLED"].includes(order.status)).length;
    const replaced = customer.orders.filter((order) => order.status === "REPLACED").length;
    const averageRating = customer.reviews.length
      ? (
          customer.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          customer.reviews.length
        ).toFixed(1)
      : "New";

    return {
      ...customer,
      totalBooked: customer.orders.length,
      returned,
      replaced,
      averageRating,
      productReviews: customer.reviews.map((review) => ({
        product: review.service || review.targetName || "Booking",
        rating: review.rating || 0,
        review: review.description || "No description",
      })),
    };
  });
}

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

export function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function customerKey(user) {
  return user.email || user.phone || user.id || "local-customer";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddybook_auth_user") || "null");
  } catch {
    return null;
  }
}
