import mongoose from 'mongoose';

// ── Booking Item (embedded) ────────────────────────────────────────────────

const bookingItemSchema = new mongoose.Schema({
  _id: false,
  id: { type: String },
  type: {
    type: String,
    enum: ['VENUE', 'PACKAGE', 'ADDON'],
    required: true,
  },
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  packageId: { type: String, default: null },
  addonId: { type: String, default: null },
});

// ── Time Slot ─────────────────────────────────────────────────────────────

const timeSlotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

timeSlotSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// ── Booking ────────────────────────────────────────────────────────────────

const bookingSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    guestCount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    notes: { type: String, default: null },

    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    venueId: { type: String, ref: 'Venue', required: true, index: true },

    // Embedded slot snapshot (denormalized for history)
    slot: {
      id: { type: String },
      name: { type: String },
      nameAr: { type: String },
      startTime: { type: String },
      endTime: { type: String },
    },

    // Embedded booking items (formerly booking_items table)
    items: [bookingItemSchema],
  },
  { timestamps: true }
);

bookingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Booking = mongoose.model('Booking', bookingSchema);
export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
