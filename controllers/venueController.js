import Venue from '../models/Venue.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// ── GET /api/venues ───────────────────────────────────────────────────────
// Query params: city, type, capacity, search, page, limit, featured, sortBy, stars

export const getVenues = catchAsync(async (req, res) => {
  const {
    city,
    type,
    capacity,
    search,
    featured,
    stars,
    sortBy,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { isActive: true };

  if (city) filter.city = { $regex: city, $options: 'i' };
  if (type && ['HOTEL', 'HALL', 'RESORT'].includes(type.toUpperCase())) {
    filter.type = type.toUpperCase();
  }
  if (capacity) {
    filter.capacity = { $gte: parseInt(capacity, 10) };
  }
  if (featured === 'true') filter.isFeatured = true;
  if (stars) filter.stars = parseInt(stars, 10);

  // Text search across name, nameAr, description
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  // ── Determine sort order ──────────────────────────────────────────────────
  let sortStage = {};
  switch (sortBy) {
    case 'luxury':
      // luxuryRank ascending = most luxury first (rank 1 = most luxurious)
      sortStage = { luxuryRank: 1, rating: -1 };
      break;
    case 'price_asc':
      sortStage = { pricePerPerson: 1, basePrice: 1 };
      break;
    case 'price_desc':
      sortStage = { pricePerPerson: -1, basePrice: -1 };
      break;
    case 'rating':
      sortStage = { rating: -1 };
      break;
    default:
      // Default: luxury rank first, then rating
      sortStage = { isFeatured: -1, luxuryRank: 1, rating: -1 };
      break;
  }

  const [venues, total] = await Promise.all([
    Venue.find(filter)
      .sort(sortStage)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Venue.countDocuments(filter),
  ]);

  // Normalise _id → id for each venue and its photos
  const data = venues.map(normaliseVenue);

  res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// ── GET /api/venues/cities ────────────────────────────────────────────────

export const getCities = catchAsync(async (req, res) => {
  const cities = await Venue.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$city', cityAr: { $first: '$cityAr' } } },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        id: '$_id',
        name: '$_id',
        nameAr: '$cityAr',
      },
    },
  ]);

  res.status(200).json({ success: true, data: cities });
});

// ── GET /api/venues/:id ───────────────────────────────────────────────────

export const getVenueById = catchAsync(async (req, res, next) => {
  const venue = await Venue.findById(req.params.id).lean();

  if (!venue) {
    return next(new AppError('Venue not found.', 404));
  }

  res.status(200).json({ success: true, data: normaliseVenue(venue) });
});

// ── Helper ────────────────────────────────────────────────────────────────

function normaliseVenue(v) {
  const obj = { ...v };
  obj.id = obj._id;
  // Photos are already embedded; ensure they have an id field
  if (Array.isArray(obj.photos)) {
    obj.photos = obj.photos.map((p) => ({
      ...p,
      id: p.id || p._id || undefined,
    }));
  }
  return obj;
}
