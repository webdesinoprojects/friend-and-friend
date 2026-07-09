const prisma = require("../config/prisma");

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

function serializeBooking(booking) {
  const provider = booking.provider;
  return {
    id: booking.id,
    code: booking.code,
    userId: booking.userId,
    userName: booking.user?.fullName || "BuddyBOOK user",
    providerId: booking.providerId,
    providerUserId: booking.providerUserId,
    providerName: provider?.user?.fullName || "BuddyBOOK provider",
    providerImage: getImageUrl(provider),
    service: booking.service,
    activity: booking.service,
    date: booking.date,
    time: booking.time,
    durationHours: booking.durationHours,
    duration: `${booking.durationHours} Hour${booking.durationHours > 1 ? "s" : ""}`,
    amount: booking.amount,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    status: booking.status,
    cancelReason: booking.cancelReason,
    cancelledAt: booking.cancelledAt,
    createdAt: booking.createdAt,
  };
}

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP function (mock implementation - in production, integrate with SMS/email service)
async function sendOtp(userId, otp, type) {
  // In a real app, you would send this via SMS or email
  // For now, we'll just log it and store it in the database
  console.log(`Sending ${type} OTP ${otp} to user ${userId}`);

  // Store OTP in database
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

  await prisma.otpToken.create({
    data: {
      userId,
      otp,
      type,
      expiresAt,
    },
  });

  return { success: true };
}

// Verify OTP function
async function verifyOtp(userId, otp, type) {
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      userId,
      otp,
      type,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    return { success: false, message: "Invalid or expired OTP" };
  }

  // Mark OTP as verified
  await prisma.otpToken.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  return { success: true, message: "OTP verified successfully" };
}

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP function (mock implementation - in production, integrate with SMS/email service)
async function sendOtp(userId, otp, type) {
  // In a real app, you would send this via SMS or email
  // For now, we'll just log it and store it in the database
  console.log(`Sending ${type} OTP ${otp} to user ${userId}`);

  // Store OTP in database
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

  await prisma.otpToken.create({
    data: {
      userId,
      otp,
      type,
      expiresAt,
    },
  });

  return { success: true };
}

// Verify OTP function
async function verifyOtp(userId, otp, type) {
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      userId,
      otp,
      type,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    return { success: false, message: "Invalid or expired OTP" };
  }

  // Mark OTP as verified
  await prisma.otpToken.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  return { success: true, message: "OTP verified successfully" };
}

exports.createBooking = async (req, res) => {
  try {
    const {
      providerId,
      service,
      date,
      time,
      durationHours,
      duration,
      amount,
      paymentMethod,
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

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found. Demo providers cannot create real chats.",
      });
    }

    const hours = toInt(durationHours || duration, 1) || 1;
    const price = toInt(provider.hourlyPrice, 0);
    const finalAmount = toInt(amount, price * hours);
    const code = `BBK-${Date.now()}`;

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
          status: "CONFIRMED",
        },
        include: {
          user: true,
          provider: { include: { user: true } },
        },
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
              text: "Booking confirmed. You can now chat about meetup details.",
            },
          },
        },
        include: { messages: true },
      });

      // Generate and send first OTP to provider after booking is created
      const otp = generateOtp();
      await sendOtp(provider.userId, otp, "START");

      return { booking, thread, otp: process.env.NODE_ENV === "development" ? otp : undefined };
    });

    return res.status(201).json({
      success: true,
      booking: serializeBooking(result.booking),
      chat: result.thread,
      // Include OTP in response for development/testing purposes
      otp: result.otp,
    });
  } catch (error) {
    console.error("CREATE_BOOKING_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not create booking.",
    });
  }
};

exports.listMyBookings = async (req, res) => {
  try {
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          providerProfile ? { providerId: providerProfile.id } : { providerUserId: req.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        provider: { include: { user: true } },
      },
    });

    return res.json({ success: true, data: bookings.map(serializeBooking) });
  } catch (error) {
    console.error("LIST_BOOKINGS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load bookings." });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { chatThread: true },
    });

    if (!booking || (booking.userId !== req.user.id && booking.providerUserId !== req.user.id)) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelReason: String(reason || "").trim(),
          cancelledAt: new Date(),
        },
        include: { user: true, provider: { include: { user: true } } },
      });

      if (booking.chatThread) {
        await tx.chatThread.update({
          where: { id: booking.chatThread.id },
          data: { closed: true, closedReason: String(reason || "").trim() || "Booking cancelled" },
        });
        await tx.chatMessage.create({
          data: {
            threadId: booking.chatThread.id,
            senderRole: "SYSTEM",
            system: true,
            text: `Booking cancelled${reason ? `: ${reason}` : "."}`,
          },
        });
      }

      return nextBooking;
    });

    return res.json({ success: true, booking: serializeBooking(updated) });
  } catch (error) {
    console.error("CANCEL_BOOKING_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not cancel booking." });
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

    // Determine recipient (provider for end OTP)
    const recipientId = booking.providerUserId;

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
