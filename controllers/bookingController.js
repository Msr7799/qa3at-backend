import { Booking, TimeSlot } from '../models/Booking.js';
import Venue from '../models/Venue.js';
import { Package, Addon } from '../models/Package.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ── POST /api/bookings (Protected) ────────────────────────────────────────

export const createBooking = catchAsync(async (req, res, next) => {
  const {
    venueId,
    slotId,
    date,
    guestCount,
    packageIds = [],
    addonIds = [],
    notes,
  } = req.body;

  if (!venueId || !slotId || !date || !guestCount) {
    return next(
      new AppError('venueId, slotId, date, and guestCount are required.', 400)
    );
  }

  // ── Fetch venue ──────────────────────────────────────────────────────────
  const venue = await Venue.findById(venueId).lean();
  if (!venue || !venue.isActive) {
    return next(new AppError('Venue not found or unavailable.', 404));
  }

  // ── Fetch time slot ──────────────────────────────────────────────────────
  const slot = await TimeSlot.findById(slotId).lean();
  if (!slot || !slot.isActive) {
    return next(new AppError('Time slot not found or unavailable.', 404));
  }

  // ── Build booking items & calculate pricing ──────────────────────────────
  const items = [];
  let subtotal = 0;

  // Venue item
  const venuePrice =
    venue.basePrice > 0
      ? venue.basePrice
      : venue.pricePerPerson * guestCount;

  subtotal += venuePrice;
  items.push({
    type: 'VENUE',
    name: venue.name,
    nameAr: venue.nameAr,
    quantity: 1,
    unitPrice: venuePrice,
    totalPrice: venuePrice,
  });

  // Package items
  if (packageIds.length > 0) {
    const packages = await Package.find({
      _id: { $in: packageIds },
      isActive: true,
    }).lean();

    for (const pkg of packages) {
      const pkgPrice =
        pkg.basePrice + pkg.pricePerPerson * guestCount;
      subtotal += pkgPrice;
      items.push({
        type: 'PACKAGE',
        name: pkg.name,
        nameAr: pkg.nameAr || pkg.name,
        quantity: 1,
        unitPrice: pkgPrice,
        totalPrice: pkgPrice,
        packageId: pkg._id,
      });
    }
  }

  // Addon items
  if (addonIds.length > 0) {
    const addons = await Addon.find({
      _id: { $in: addonIds },
      isActive: true,
    }).lean();

    for (const addon of addons) {
      const addonPrice =
        addon.priceType === 'PER_PERSON'
          ? addon.price * guestCount
          : addon.price;
      subtotal += addonPrice;
      items.push({
        type: 'ADDON',
        name: addon.name,
        nameAr: addon.nameAr,
        quantity: 1,
        unitPrice: addonPrice,
        totalPrice: addonPrice,
        addonId: addon._id,
      });
    }
  }

  const TAX_RATE = 0.1; // 10 %
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(3));
  const total = parseFloat((subtotal + tax).toFixed(3));

  // ── Persist booking ──────────────────────────────────────────────────────
  const booking = await Booking.create({
    date: new Date(date),
    guestCount,
    notes,
    subtotal,
    tax,
    total,
    userId: req.user._id,
    venueId: venue._id,
    slot: {
      id: slot._id,
      name: slot.name,
      nameAr: slot.nameAr,
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
    items,
  });

  // Populate venue & user for the response
  const populated = await Booking.findById(booking._id)
    .populate({
      path: 'venueId',
      model: 'Venue',
      select: 'name nameAr photos city address',
    })
    .lean();

  res.status(201).json({
    success: true,
    data: formatBooking(populated),
  });
});

// ── GET /api/bookings (Protected) ─────────────────────────────────────────

export const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id })
    .populate({
      path: 'venueId',
      model: 'Venue',
      select: 'name nameAr photos city address',
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: bookings.map(formatBooking),
  });
});

// ── PATCH /api/bookings/:id/cancel (Protected) ────────────────────────────

export const cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found.', 404));
  }

  // Ensure the booking belongs to this user (unless ADMIN)
  if (
    booking.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'ADMIN'
  ) {
    return next(new AppError('You are not authorised to cancel this booking.', 403));
  }

  if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
    return next(
      new AppError(`Booking is already ${booking.status.toLowerCase()}.`, 400)
    );
  }

  booking.status = 'CANCELLED';
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking.toJSON(),
    message: 'Booking cancelled successfully.',
  });
});

// ── Helper ────────────────────────────────────────────────────────────────

function formatBooking(b) {
  const venue = b.venueId; // populated doc
  return {
    id: b._id,
    date: b.date,
    guestCount: b.guestCount,
    status: b.status,
    notes: b.notes,
    subtotal: b.subtotal,
    tax: b.tax,
    total: b.total,
    createdAt: b.createdAt,
    venue: venue
      ? {
          id: venue._id,
          name: venue.name,
          nameAr: venue.nameAr,
          city: venue.city,
          address: venue.address,
          photos: venue.photos || [],
        }
      : null,
    slot: b.slot || null,
    items: b.items || [],
  };
}
