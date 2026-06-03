import { Package, Addon } from '../models/Package.js';
import { TimeSlot } from '../models/Booking.js';
import { catchAsync } from '../middleware/errorHandler.js';

// ── GET /api/packages ─────────────────────────────────────────────────────

export const getPackages = catchAsync(async (req, res) => {
  const { category, tier, venueId } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category.toUpperCase();
  if (tier) filter.tier = tier.toUpperCase();
  if (venueId) filter.venueId = venueId;

  const packages = await Package.find(filter).sort({ basePrice: 1 }).lean();

  res.status(200).json({ success: true, data: packages });
});

// ── GET /api/packages/addons ──────────────────────────────────────────────

export const getAddons = catchAsync(async (req, res) => {
  const { category } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category.toUpperCase();

  const addons = await Addon.find(filter).sort({ price: 1 }).lean();

  res.status(200).json({ success: true, data: addons });
});

// ── GET /api/packages/time-slots ─────────────────────────────────────────

export const getTimeSlots = catchAsync(async (req, res) => {
  const slots = await TimeSlot.find({ isActive: true }).sort({ startTime: 1 }).lean();

  // Normalise _id → id
  const data = slots.map((s) => ({ ...s, id: s._id }));

  res.status(200).json({ success: true, data });
});
