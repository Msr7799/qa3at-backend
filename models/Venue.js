import mongoose from 'mongoose';

// ── Embedded sub-schemas ───────────────────────────────────────────────────

const venuePhotoSchema = new mongoose.Schema(
  {
    _id: false, // no auto _id for embedded docs
    id: { type: String },
    url: { type: String, required: true },
    caption: { type: String, default: null },
    captionAr: { type: String, default: null },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  }
);

const subVenueCapacitySchema = new mongoose.Schema(
  {
    _id: false,
    banquet: { type: Number, default: null },
    theatre: { type: Number, default: null },
    reception: { type: Number, default: null },
    classroom: { type: Number, default: null },
    minGuests: { type: Number, default: null },
    maxGuests: { type: Number, default: null },
  }
);

const subVenueSchema = new mongoose.Schema(
  {
    _id: false,
    venueName: { type: String },
    venueType: { type: String },
    indoorOutdoor: { type: String },
    areaSqm: { type: Number, default: null },
    capacity: { type: subVenueCapacitySchema, default: null },
    features: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: null },
  }
);

// ── Main Venue schema ──────────────────────────────────────────────────────

const venueSchema = new mongoose.Schema(
  {
    // Keep the original string ID from the seed data for compatibility
    _id: { type: String },

    name: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    descriptionAr: { type: String, required: true },
    address: { type: String, required: true },
    addressAr: { type: String, required: true },
    city: { type: String, required: true, index: true },
    cityAr: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    capacity: { type: Number, required: true, default: 0, index: true },
    minCapacity: { type: Number, default: 50 },
    pricePerPerson: { type: Number, required: true, default: 0 },
    basePrice: { type: Number, required: true, default: 0 },

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    amenities: [{ type: String }],

    type: {
      type: String,
      enum: ['HOTEL', 'HALL', 'RESORT'],
      default: 'HOTEL',
      index: true,
    },
    pricingModel: { type: String, default: null },

    // ✅ Photos embedded directly (NoSQL advantage)
    photos: [venuePhotoSchema],

    subVenues: [subVenueSchema],
    contacts: { type: mongoose.Schema.Types.Mixed, default: null },
    parking: { type: mongoose.Schema.Types.Mixed, default: null },
    accessibility: { type: mongoose.Schema.Types.Mixed, default: null },

    vendorId: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    luxuryRank: { type: Number, default: 999 },
  },
  {
    timestamps: true,
    _id: false, // we manage _id ourselves (string)
  }
);

// Text search index
venueSchema.index({ name: 'text', nameAr: 'text', description: 'text' });
// Compound index for featured list
venueSchema.index({ isFeatured: 1, luxuryRank: 1 });

// Virtual: expose _id as id for JSON output
venueSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    return ret;
  },
});

export default mongoose.model('Venue', venueSchema);
