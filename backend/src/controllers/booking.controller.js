const prisma = require("../config/prisma");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const crypto = require("crypto");
const { isAccountDisabled } = require("../utils/accountLifecycle");
const Razorpay = require("razorpay");

function toInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function getImageUrl(provider) {
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  const first = images[0];
  if (!first) return provider?.user?.profileImage || "";
  if (typeof first === "string") return first;
  return first.thumbnailUrl || first.url || "";
}

const bookingInclude = { user: true, provider: { include: { user: true } }, extensions: { orderBy: { sequence: "asc" } } };

function addHours(date, hours) {
  return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

function extensionPrice(booking) {
  const previous = Number(booking.lastHourlyPrice || Math.max(1, Math.round(Number(booking.amount || 0) / Math.max(1, Number(booking.durationHours || 1)))));
  return Math.max(1, Math.round(previous * 0.9));
}

function serializeBooking(booking, viewerId) {
  const provider = booking.provider;
  const userUnavailable = booking.user?.isBlocked || isAccountDisabled(booking.user);
  const providerUnavailable = provider?.user?.isBlocked || isAccountDisabled(provider?.user);
  const isUser = booking.userId === viewerId;
  const isProvider = booking.providerUserId === viewerId;
  const startPinAvailable = Boolean(booking.startPin && !booking.startPinUsedAt && booking.startPinExpiresAt && booking.startPinExpiresAt > new Date());
  return {
    id: booking.id,
    code: booking.code,
    userId: booking.userId,
    userName: userUnavailable ? "Account unavailable" : booking.user?.fullName || "BuddyBOOK user",
    userImage: userUnavailable ? "" : booking.user?.profileImage || "",
    providerId: booking.providerId,
    providerUserId: booking.providerUserId,
    providerName: providerUnavailable ? "Account unavailable" : provider?.user?.fullName || "BuddyBOOK provider",
    providerPhone: providerUnavailable ? "" : provider?.user?.phone || "",
    providerImage: providerUnavailable ? "" : getImageUrl(provider),
    userUnavailable,
    providerUnavailable,
    service: booking.service,
    activity: booking.service,
    date: booking.date,
    time: booking.time,
    durationHours: booking.durationHours,
    duration: `${booking.durationHours} Hour${booking.durationHours > 1 ? "s" : ""}`,
    amount: booking.amount,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    transactionId: booking.razorpayPaymentId || null,
    razorpayOrderId: booking.razorpayOrderId || null,
    status: booking.status,
    cancelReason: booking.cancelReason,
    cancelCategory: booking.cancelCategory,
    cancellationFee: booking.cancellationFee,
    refundAmount: booking.refundAmount,
    cancelledAt: booking.cancelledAt,
    startPin: isUser && startPinAvailable ? booking.startPin : null,
    startPinExpiresAt: booking.startPinExpiresAt,
    startPinUsedAt: booking.startPinUsedAt,
    meetingStartedAt: booking.meetingStartedAt,
    scheduledEndAt: booking.scheduledEndAt,
    meetingEndedAt: booking.meetingEndedAt,
    endOtp: isProvider && booking.status === "ACTIVE" && !booking.endOtpVerifiedAt ? booking.endOtp : null,
    endOtpCreatedAt: booking.endOtpCreatedAt,
    endOtpVerified: Boolean(booking.endOtpVerifiedAt),
    extensionCount: booking.extensionCount || 0,
    nextExtensionAmount: booking.status === "ACTIVE" && booking.endOtpVerifiedAt ? extensionPrice(booking) : null,
    extensions: Array.isArray(booking.extensions) ? booking.extensions.map((item) => ({ id: item.id, sequence: item.sequence, hours: item.hours, discountPercent: item.discountPercent, amount: item.amount, status: item.status, paidAt: item.paidAt })) : [],
    lifecycleRole: isUser ? "USER" : isProvider ? "PROVIDER" : null,
    createdAt: booking.createdAt,
  };
}

// Generate a 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

exports.createBooking = async (req, res) => {
  try {
    if (!req.razorpayVerified) {
      return res.status(402).json({ success: false, message: "Complete and verify the Razorpay payment first." });
    }
    const {
      providerId,
      service,
      date,
      time,
      durationHours,
      duration,
      amount,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!providerId || !service || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Provider, activity, date and time are required.",
      });
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: { user: true },
    });

    if (!provider || provider.user?.isBlocked || isAccountDisabled(provider.user)) {
      return res.status(404).json({
        success: false,
        message: "This provider profile is currently unavailable.",
      });
    }

    const hours = toInt(durationHours || duration, 1) || 1;
    const price = toInt(provider.hourlyPrice, 0);
    const finalAmount = price * hours;
    const code = `BBK-${Date.now()}`;
    const startPin = generateOtp();
    const startPinExpiresAt = addDays(new Date(), 14);

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          code,
          userId: req.user.id,
          providerId: provider.id,
          providerUserId: provider.userId,
          service: String(service),
          date: String(date),
          time: String(time),
          durationHours: hours,
          amount: finalAmount,
          paymentMethod: paymentMethod || "UPI",
          paymentStatus: "PAID",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          status: "CONFIRMED",
          startPin,
          startPinExpiresAt,
          lastHourlyPrice: price,
        },
        include: bookingInclude,
      });

      const thread = await tx.chatThread.create({
        data: {
          bookingId: booking.id,
          userId: req.user.id,
          providerId: provider.id,
          providerUserId: provider.userId,
          messages: {
            create: {
              senderRole: "SYSTEM",
              system: true,
              text: `New booking confirmed: ${service} (${code}). You can continue chatting here.`,
            },
          },
        },
        include: { messages: true },
      });

      return { booking, thread };
    });
    try {
      await prisma.$executeRawUnsafe('INSERT INTO "Notification" ("id","userId","type","title","message","link","createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW()),($7,$8,$9,$10,$11,$12,NOW())', crypto.randomUUID(), req.user.id, "BOOKING", "Booking confirmed", `${service} with ${provider.user.fullName} is confirmed.`, "/app/user/bookings", crypto.randomUUID(), provider.userId, "BOOKING", "New booking received", `${req.user.fullName} booked ${service}.`, "/app/provider/bookings");
    } catch {}

    return res.status(201).json({
      success: true,
      booking: serializeBooking(result.booking, req.user.id),
      chat: result.thread,
    });
  } catch (error) {
    console.error("CREATE_BOOKING_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not create booking.",
    });
  }
};

exports.createBookingRequest = async (req, res) => {
  try {
    const { providerId, service, date, time, durationHours, duration } = req.body;
    if (!providerId || !service || !date || !time) return res.status(400).json({ success: false, message: "Provider, activity, date and time are required." });
    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId }, include: { user: true } });
    if (!provider || provider.user?.isBlocked || isAccountDisabled(provider.user)) return res.status(404).json({ success: false, message: "This provider profile is currently unavailable." });
    const hours = Math.min(6, Math.max(1, toInt(durationHours || duration, 1)));
    const amount = toInt(provider.hourlyPrice, 0) * hours;
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: { code: `BBK-${Date.now()}`, userId: req.user.id, providerId, providerUserId: provider.userId, service: String(service), date: String(date), time: String(time), durationHours: hours, amount, paymentStatus: "PENDING", status: "PENDING", lastHourlyPrice: toInt(provider.hourlyPrice, 0) },
        include: bookingInclude,
      });
      await tx.chatThread.create({ data: { bookingId: created.id, userId: req.user.id, providerId, providerUserId: provider.userId, messages: { create: { senderRole: "SYSTEM", system: true, text: `Booking request sent for ${service}. Payment opens after the provider accepts.` } } } });
      return created;
    });
    return res.status(201).json({ success: true, booking: serializeBooking(booking, req.user.id) });
  } catch (error) {
    console.error("CREATE_BOOKING_REQUEST_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not send booking request." });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { ...bookingInclude, chatThread: true } });
    if (!booking || booking.providerUserId !== req.user.id) return res.status(404).json({ success: false, message: "Booking request not found." });
    if (booking.status !== "PENDING") return res.status(400).json({ success: false, message: "Only pending booking requests can be accepted." });
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.booking.update({ where: { id: booking.id }, data: { status: "ACCEPTED" }, include: bookingInclude });
      if (booking.chatThread) await tx.chatMessage.create({ data: { threadId: booking.chatThread.id, senderRole: "SYSTEM", system: true, text: "Provider accepted this request. The user can now complete payment." } });
      return next;
    });
    return res.json({ success: true, booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not accept booking." });
  }
};

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

exports.createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: "Razorpay test credentials are not configured." });
    const { providerId, service, date, time, durationHours, duration, bookingId } = req.body;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { provider: { include: { user: true } } } });
      if (!booking || booking.userId !== req.user.id) return res.status(404).json({ success: false, message: "Booking request not found." });
      if (booking.status !== "ACCEPTED" || booking.paymentStatus !== "PENDING") return res.status(400).json({ success: false, message: "Payment opens only after the provider accepts." });
      const order = await razorpay.orders.create({ amount: booking.amount * 100, currency: "INR", receipt: `bbk_${Date.now()}`, notes: { userId: req.user.id, bookingId: booking.id, providerId: booking.providerId, service: booking.service, date: booking.date, time: booking.time, durationHours: String(booking.durationHours) } });
      return res.status(201).json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order: { id: order.id, amount: order.amount, currency: order.currency }, providerName: booking.provider.user.fullName });
    }
    if (!providerId || !service || !date || !time) return res.status(400).json({ success: false, message: "Provider, activity, date and time are required." });
    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId }, include: { user: true } });
    if (!provider || provider.user?.isBlocked || isAccountDisabled(provider.user)) return res.status(404).json({ success: false, message: "This provider profile is currently unavailable." });
    const hours = Math.min(6, Math.max(1, toInt(durationHours || duration, 1)));
    const amount = toInt(provider.hourlyPrice, 0) * hours;
    if (amount < 1) return res.status(400).json({ success: false, message: "This provider does not have a valid booking price." });
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `bbk_${Date.now()}`,
      notes: { userId: req.user.id, providerId, service: String(service).slice(0, 200), date: String(date), time: String(time), durationHours: String(hours) },
    });
    return res.status(201).json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order: { id: order.id, amount: order.amount, currency: order.currency }, providerName: provider.user.fullName });
  } catch (error) {
    console.error("CREATE_RAZORPAY_ORDER_ERROR:", error);
    return res.status(500).json({ success: false, message: error.error?.description || error.message || "Could not start Razorpay checkout." });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: "Razorpay test credentials are not configured." });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: "Razorpay payment details are incomplete." });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const valid = expected.length === razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    if (!valid) return res.status(400).json({ success: false, message: "Payment signature verification failed." });
    const [order, payment] = await Promise.all([razorpay.orders.fetch(razorpay_order_id), razorpay.payments.fetch(razorpay_payment_id)]);
    if (String(order.notes?.userId) !== String(req.user.id) || payment.order_id !== razorpay_order_id || !["authorized", "captured"].includes(payment.status)) {
      return res.status(400).json({ success: false, message: "The Razorpay payment could not be validated." });
    }
    if (order.notes?.bookingId) {
      const pending = await prisma.booking.findUnique({ where: { id: order.notes.bookingId }, include: bookingInclude });
      if (!pending || pending.userId !== req.user.id || pending.status !== "ACCEPTED") return res.status(409).json({ success: false, message: "This booking is no longer payable." });
      const startPin = generateOtp();
      const updated = await prisma.booking.update({ where: { id: pending.id }, data: { status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "RAZORPAY", razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, startPin, startPinExpiresAt: addDays(new Date(), 14) }, include: bookingInclude });
      return res.json({ success: true, booking: serializeBooking(updated, req.user.id) });
    }
    const duplicate = await prisma.booking.findFirst({ where: { OR: [{ razorpayOrderId: razorpay_order_id }, { razorpayPaymentId: razorpay_payment_id }] }, include: bookingInclude });
    if (duplicate) return res.json({ success: true, booking: serializeBooking(duplicate, req.user.id) });
    req.razorpayVerified = true;
    req.body = { providerId: order.notes.providerId, service: order.notes.service, date: order.notes.date, time: order.notes.time, durationHours: Number(order.notes.durationHours), paymentMethod: "RAZORPAY", razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature };
    return exports.createBooking(req, res);
  } catch (error) {
    console.error("VERIFY_RAZORPAY_PAYMENT_ERROR:", error);
    return res.status(500).json({ success: false, message: error.error?.description || error.message || "Could not verify Razorpay payment." });
  }
};

exports.listMyBookings = async (req, res) => {
  try {
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    const where = {
      OR: [
        { userId: req.user.id },
        providerProfile ? { providerId: providerProfile.id } : { providerUserId: req.user.id },
      ],
    };
    const pagination = parsePagination(req.query, { defaultPageSize: 50 });
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: bookingInclude,
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data: bookings.map((booking) => serializeBooking(booking, req.user.id)),
      pagination: paginationMeta({ ...pagination, total }),
    });
  } catch (error) {
    console.error("LIST_BOOKINGS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load bookings." });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { reason, category } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { chatThread: true },
    });

    if (!booking || (booking.userId !== req.user.id && booking.providerUserId !== req.user.id)) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (["ACTIVE", "COMPLETED"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "An active or completed meeting cannot be cancelled." });
    }
    const scheduledAt = new Date(`${booking.date}T${booking.time}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Bookings can only be cancelled at least 2 hours before the meeting." });
    }
    const cleanCategory = String(category || "").trim();
    const cleanReason = String(reason || "").trim();
    if (!cleanCategory || !cleanReason) {
      return res.status(400).json({ success: false, message: "Choose a cancellation reason and add a description." });
    }
    const cancellationFee = Math.round(Number(booking.amount || 0) * 0.2);
    const refundAmount = Math.max(0, Number(booking.amount || 0) - cancellationFee);
    if (booking.paymentStatus === "PAID" && booking.razorpayPaymentId && refundAmount > 0) {
      const razorpay = getRazorpay();
      if (!razorpay) return res.status(503).json({ success: false, message: "Refund service is temporarily unavailable." });
      try {
        await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: refundAmount * 100,
          notes: { bookingId: booking.id, cancellationFee: String(cancellationFee) },
        });
      } catch (refundError) {
        return res.status(502).json({ success: false, message: refundError.error?.description || "The refund could not be created. The booking was not cancelled." });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelCategory: cleanCategory,
          cancelReason: cleanReason,
          cancellationFee,
          refundAmount,
          paymentStatus: booking.paymentStatus === "PAID" ? "PARTIALLY_REFUNDED" : booking.paymentStatus,
          cancelledAt: new Date(),
        },
        include: bookingInclude,
      });

      if (booking.chatThread) {
        await tx.chatThread.update({
          where: { id: booking.chatThread.id },
          data: { closed: true, closedReason: `${cleanCategory}: ${cleanReason}` },
        });
        await tx.chatMessage.create({
          data: {
            threadId: booking.chatThread.id,
            senderRole: "SYSTEM",
            system: true,
            text: `Booking cancelled — ${cleanCategory}: ${cleanReason}. A 20% cancellation fee was deducted and ₹${refundAmount} is refundable.`,
          },
        });
      }

      return nextBooking;
    });

    return res.json({ success: true, booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    console.error("CANCEL_BOOKING_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not cancel booking." });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingInclude,
    });

    if (!booking || (booking.userId !== req.user.id && booking.providerUserId !== req.user.id)) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Cancelled bookings cannot be completed." });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
      include: bookingInclude,
    });

    return res.json({ success: true, booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    console.error("COMPLETE_BOOKING_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not complete booking." });
  }
};

// Generate and send start OTP for a booking
exports.generateStartOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, provider: { include: { user: true } } },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify that the user making the request is either the user or provider of the booking
    if (booking.userId !== req.user.id && booking.providerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this booking",
      });
    }

    // Generate OTP
    const otp = generateOtp();

    // Determine recipient (provider for start OTP)
    const recipientId = booking.providerUserId;

    // Send OTP
    await sendOtp(recipientId, otp, "START");

    return res.json({
      success: true,
      message: "Start OTP sent to provider",
      // In a real app, you might not return the OTP for security reasons
      // For development/testing purposes, we're returning it
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("GENERATE_START_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate start OTP",
    });
  }
};

// Validate start OTP (entered by provider)
exports.validateStartOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, provider: { include: { user: true } } },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify that the user making the request is the provider
    if (booking.providerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the provider can validate the start OTP",
      });
    }

    // Verify OTP
    const result = await verifyOtp(req.user.id, otp, "START");

    if (!result.success) {
      return res.status(400).json(result);
    }

    // OTP validated successfully
    // In a real app, you might want to update the booking status or start a timer
    // For now, we'll just return success

    return res.json({
      success: true,
      message: "Start OTP validated successfully",
    });
  } catch (error) {
    console.error("VALIDATE_START_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate start OTP",
    });
  }
};

// Generate and send end OTP for a booking (after time expires)
exports.generateEndOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, provider: { include: { user: true } } },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify that the user making the request is either the user or provider of the booking
    if (booking.userId !== req.user.id && booking.providerUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this booking",
      });
    }

    // Generate OTP
    const otp = generateOtp();

    // The user validates the end OTP, so the OTP must belong to the user.
    const recipientId = booking.userId;

    // Send OTP
    await sendOtp(recipientId, otp, "END");

    return res.json({
      success: true,
      message: "End OTP sent to provider",
      // In a real app, you might not return the OTP for security reasons
      // For development/testing purposes, we're returning it
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("GENERATE_END_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate end OTP",
    });
  }
};

// Validate end OTP (entered by user)
exports.validateEndOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, provider: { include: { user: true } } },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify that the user making the request is the user
    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the user can validate the end OTP",
      });
    }

    // Verify OTP
    const result = await verifyOtp(req.user.id, otp, "END");

    if (!result.success) {
      return res.status(400).json(result);
    }

    // OTP validated successfully
    // In a real app, you might want to update the booking status to completed
    // and trigger payment processing

    return res.json({
      success: true,
      message: "End OTP validated successfully",
      // Indicate that payment can now be processed
      paymentReady: true,
    });
  } catch (error) {
    console.error("VALIDATE_END_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate end OTP",
    });
  }
};

async function bookingForLifecycle(id) {
  return prisma.booking.findUnique({ where: { id }, include: { ...bookingInclude, chatThread: true } });
}

async function addLifecycleMessage(tx, booking, text) {
  if (booking.chatThread) await tx.chatMessage.create({ data: { threadId: booking.chatThread.id, senderRole: "SYSTEM", system: true, text } });
}

exports.revealStartPin = async (req, res) => {
  try {
    const booking = await bookingForLifecycle(req.params.id);
    if (!booking || booking.userId !== req.user.id) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PAID") return res.status(400).json({ success: false, message: "The start PIN is only available for a paid upcoming booking." });
    if (booking.startPinUsedAt) return res.status(400).json({ success: false, message: "This start PIN has already been used." });
    if (!booking.startPin || !booking.startPinExpiresAt || booking.startPinExpiresAt <= new Date()) return res.status(410).json({ success: false, message: "This start PIN has expired. Contact support to review the booking." });
    return res.json({ success: true, booking: serializeBooking(booking, req.user.id) });
  } catch (error) {
    console.error("REVEAL_START_PIN_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load the meeting PIN." });
  }
};

exports.startMeetingWithPin = async (req, res) => {
  try {
    const pin = String(req.body?.pin || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(pin)) return res.status(400).json({ success: false, message: "Enter the complete six-digit start PIN." });
    const booking = await bookingForLifecycle(req.params.id);
    if (!booking || booking.providerUserId !== req.user.id) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status === "ACTIVE") return res.json({ success: true, message: "Meeting is already active.", booking: serializeBooking(booking, req.user.id) });
    if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PAID") return res.status(400).json({ success: false, message: "Only a paid confirmed booking can be started." });
    if (booking.startPinUsedAt) return res.status(400).json({ success: false, message: "This start PIN has already been used." });
    if (!booking.startPinExpiresAt || booking.startPinExpiresAt <= new Date()) return res.status(410).json({ success: false, message: "The start PIN expired after 14 days." });
    if (booking.startPin !== pin) return res.status(400).json({ success: false, message: "The start PIN is incorrect." });
    const now = new Date();
    const endOtp = generateOtp();
    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.booking.updateMany({ where: { id: booking.id, status: "CONFIRMED", startPin: pin, startPinUsedAt: null, startPinExpiresAt: { gt: now } }, data: { status: "ACTIVE", startPinUsedAt: now, meetingStartedAt: now, scheduledEndAt: addHours(now, booking.durationHours), endOtp, endOtpCreatedAt: now, endOtpVerifiedAt: null } });
      if (claimed.count !== 1) throw new Error("The PIN was already used or expired.");
      await addLifecycleMessage(tx, booking, `Meeting started for ${booking.durationHours} hour${booking.durationHours === 1 ? "" : "s"}.`);
      return tx.booking.findUnique({ where: { id: booking.id }, include: bookingInclude });
    });
    return res.json({ success: true, message: "Meeting started. Share the end code with the user when ready.", booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    console.error("START_MEETING_WITH_PIN_ERROR:", error);
    const conflict = /already used|expired/i.test(error.message || "");
    return res.status(conflict ? 409 : 500).json({ success: false, message: conflict ? error.message : "Could not start the meeting." });
  }
};

exports.getProviderEndOtp = async (req, res) => {
  try {
    const booking = await bookingForLifecycle(req.params.id);
    if (!booking || booking.providerUserId !== req.user.id) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status !== "ACTIVE") return res.status(400).json({ success: false, message: "The meeting is not active." });
    return res.json({ success: true, booking: serializeBooking(booking, req.user.id) });
  } catch (error) {
    console.error("GET_PROVIDER_END_OTP_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load the end code." });
  }
};

exports.verifyMeetingEndOtp = async (req, res) => {
  try {
    const otp = String(req.body?.otp || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: "Enter the complete six-digit end code." });
    const booking = await bookingForLifecycle(req.params.id);
    if (!booking || booking.userId !== req.user.id) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status !== "ACTIVE") return res.status(400).json({ success: false, message: "The meeting is not active." });
    if (!booking.endOtp || booking.endOtp !== otp) return res.status(400).json({ success: false, message: "The end code is incorrect." });
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { endOtpVerifiedAt: new Date() }, include: bookingInclude });
    return res.json({ success: true, message: "Code verified. End the meeting or extend it for another discounted hour.", booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    console.error("VERIFY_MEETING_END_OTP_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not verify the end code." });
  }
};

exports.endMeeting = async (req, res) => {
  try {
    const booking = await bookingForLifecycle(req.params.id);
    if (!booking || booking.userId !== req.user.id) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status === "COMPLETED") return res.json({ success: true, booking: serializeBooking(booking, req.user.id) });
    if (booking.status !== "ACTIVE" || !booking.endOtpVerifiedAt) return res.status(400).json({ success: false, message: "Verify the provider's end code before ending the meeting." });
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", meetingEndedAt: new Date(), endOtp: null }, include: bookingInclude });
      await addLifecycleMessage(tx, booking, "Meeting completed and securely closed by the user.");
      return next;
    });
    return res.json({ success: true, message: "Meeting completed successfully.", booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    console.error("END_MEETING_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not end the meeting." });
  }
};

exports.createExtensionOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: "Razorpay credentials are not configured." });
    const booking = await bookingForLifecycle(req.params.id);
    if (!booking || booking.userId !== req.user.id) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status !== "ACTIVE" || !booking.endOtpVerifiedAt) return res.status(400).json({ success: false, message: "Verify the end code before extending the meeting." });
    const sequence = Number(booking.extensionCount || 0) + 1;
    const pending = booking.extensions?.find((item) => item.sequence === sequence && item.status === "PENDING");
    if (pending) return res.json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, extension: { id: pending.id, sequence, amount: pending.amount }, order: { id: pending.razorpayOrderId, amount: pending.amount * 100, currency: "INR" } });
    const amount = extensionPrice(booking);
    const order = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: `ext_${booking.id.slice(-8)}_${sequence}`, notes: { kind: "BOOKING_EXTENSION", bookingId: booking.id, userId: req.user.id, sequence: String(sequence), hours: "1" } });
    const extension = await prisma.bookingExtension.create({ data: { bookingId: booking.id, sequence, amount, discountPercent: 10, razorpayOrderId: order.id } });
    return res.status(201).json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, extension: { id: extension.id, sequence, amount }, order: { id: order.id, amount: order.amount, currency: order.currency } });
  } catch (error) {
    console.error("CREATE_EXTENSION_ORDER_ERROR:", error);
    return res.status(500).json({ success: false, message: error.error?.description || error.message || "Could not start extension payment." });
  }
};

exports.verifyExtensionPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: "Razorpay credentials are not configured." });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: "Extension payment details are incomplete." });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const valid = expected.length === razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    if (!valid) return res.status(400).json({ success: false, message: "Extension payment signature verification failed." });
    const extension = await prisma.bookingExtension.findUnique({ where: { razorpayOrderId: razorpay_order_id }, include: { booking: { include: { ...bookingInclude, chatThread: true } } } });
    if (!extension || extension.bookingId !== req.params.id || extension.booking.userId !== req.user.id) return res.status(404).json({ success: false, message: "Extension order not found." });
    if (extension.status === "PAID") return res.json({ success: true, booking: serializeBooking(extension.booking, req.user.id) });
    const [order, payment] = await Promise.all([razorpay.orders.fetch(razorpay_order_id), razorpay.payments.fetch(razorpay_payment_id)]);
    if (order.notes?.kind !== "BOOKING_EXTENSION" || order.notes?.bookingId !== extension.bookingId || payment.order_id !== razorpay_order_id || !["authorized", "captured"].includes(payment.status)) return res.status(400).json({ success: false, message: "The extension payment could not be validated." });
    if (extension.booking.status !== "ACTIVE" || !extension.booking.endOtpVerifiedAt) return res.status(409).json({ success: false, message: "This meeting can no longer be extended." });
    const now = new Date();
    const nextEndOtp = generateOtp();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.bookingExtension.update({ where: { id: extension.id }, data: { status: "PAID", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, paidAt: now } });
      const next = await tx.booking.update({ where: { id: extension.bookingId }, data: { durationHours: { increment: 1 }, amount: { increment: extension.amount }, extensionCount: extension.sequence, lastHourlyPrice: extension.amount, scheduledEndAt: addHours(extension.booking.scheduledEndAt || now, 1), endOtp: nextEndOtp, endOtpCreatedAt: now, endOtpVerifiedAt: null }, include: bookingInclude });
      await addLifecycleMessage(tx, extension.booking, `Meeting extended by one hour for ₹${extension.amount} after a 10% repeat-extension discount.`);
      return next;
    });
    return res.json({ success: true, message: "Payment verified. One hour was added and a new end code is ready for the provider.", booking: serializeBooking(updated, req.user.id) });
  } catch (error) {
    console.error("VERIFY_EXTENSION_PAYMENT_ERROR:", error);
    return res.status(500).json({ success: false, message: error.error?.description || error.message || "Could not verify extension payment." });
  }
};

exports.__test = { addDays, addHours, extensionPrice };
