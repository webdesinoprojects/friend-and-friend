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

      return { booking, thread };
    });

    return res.status(201).json({
      success: true,
      booking: serializeBooking(result.booking),
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
