import mongoose from 'mongoose';

// ── Package Item (embedded) ────────────────────────────────────────────────

const packageItemSchema = new mongoose.Schema({
  _id: false,
  id: { type: String },
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  description: { type: String, default: null },
  descriptionAr: { type: String, default: null },
  quantity: { type: Number, default: 1 },
});

// ── Package ────────────────────────────────────────────────────────────────

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameAr: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    tier: {
      type: String,
      enum: ['SILVER', 'GOLD', 'DIAMOND'],
      default: 'SILVER',
    },
    category: {
      type: String,
      enum: ['VENUE', 'DECORATION', 'CATERING', 'PHOTOGRAPHY', 'MUSIC'],
      default: 'VENUE',
    },
    basePrice: { type: Number, default: 0 },
    pricePerPerson: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    venueId: { type: String, default: null },

    // Embedded items (formerly package_items table)
    items: [packageItemSchema],
  },
  { timestamps: true }
);

packageSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// ── Addon ──────────────────────────────────────────────────────────────────

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    description: { type: String, required: true },
    descriptionAr: { type: String, required: true },
    category: {
      type: String,
      enum: ['STAGE', 'FLOWERS', 'DECORATION', 'CATERING', 'CAKE', 'PHOTOGRAPHY', 'MUSIC'],
      required: true,
    },
    price: { type: Number, required: true },
    priceType: {
      type: String,
      enum: ['FIXED', 'PER_PERSON', 'PER_HOUR'],
      default: 'FIXED',
    },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

addonSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Package = mongoose.model('Package', packageSchema);
export const Addon = mongoose.model('Addon', addonSchema);
