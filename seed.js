/**
 * seed.js — Seeds MongoDB with Bahrain wedding venues + photos
 *
 * Usage:
 *   node seed.js           → seed venues only
 *   node seed.js --fresh   → drop existing venues first, then seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const Venue = require('./models/Venue');
const { TimeSlot } = require('./models/Booking');

// ── Load assets ───────────────────────────────────────────────────────────

const assetsDir = path.join(__dirname, 'assets');

function loadJSON(filename) {
  const filePath = path.join(assetsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Asset not found: ${filename}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ── Map venues + embed their photos ──────────────────────────────────────

function buildVenueDocs(venues, photos) {
  // Group photos by venueId for O(1) lookup
  const photosByVenue = {};
  for (const photo of photos) {
    if (!photosByVenue[photo.venueId]) photosByVenue[photo.venueId] = [];
    photosByVenue[photo.venueId].push({
      id: photo.id,
      url: photo.url,
      caption: photo.caption || null,
      captionAr: photo.captionAr || null,
      isPrimary: photo.isPrimary || false,
      sortOrder: photo.sortOrder || 0,
    });
  }

  return venues.map((v) => ({
    _id: v.id,
    name: v.name,
    nameAr: v.nameAr,
    description: v.description,
    descriptionAr: v.descriptionAr,
    address: v.address,
    addressAr: v.addressAr,
    city: v.city,
    cityAr: v.cityAr,
    latitude: v.latitude || null,
    longitude: v.longitude || null,
    capacity: v.capacity || 0,
    minCapacity: v.minCapacity || 50,
    pricePerPerson: v.pricePerPerson || 0,
    basePrice: v.basePrice || 0,
    rating: v.rating || 0,
    reviewCount: v.reviewCount || 0,
    amenities: v.amenities || [],
    type: v.type || 'HOTEL',
    pricingModel: v.pricingModel || null,
    photos: (photosByVenue[v.id] || []).sort((a, b) => a.sortOrder - b.sortOrder),
    subVenues: v.subVenues || [],
    contacts: v.contacts || null,
    parking: v.parking || null,
    accessibility: v.accessibility || null,
    vendorId: v.vendorId || 'seed-vendor',
    isActive: v.isActive !== false,
    isFeatured: v.isFeatured || false,
    luxuryRank: v.luxuryRank || 999,
    createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
    updatedAt: v.updatedAt ? new Date(v.updatedAt) : new Date(),
  }));
}

// ── Default Time Slots ────────────────────────────────────────────────────

const DEFAULT_TIME_SLOTS = [
  { name: 'Morning',   nameAr: 'الصباح',   startTime: '08:00', endTime: '12:00' },
  { name: 'Afternoon', nameAr: 'بعد الظهر', startTime: '12:00', endTime: '17:00' },
  { name: 'Evening',   nameAr: 'المساء',   startTime: '17:00', endTime: '22:00' },
  { name: 'Night',     nameAr: 'الليل',    startTime: '20:00', endTime: '02:00' },
];

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const isFresh = process.argv.includes('--fresh');

  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected\n');

  // ── Optional: wipe collections ─────────────────────────────────────────
  if (isFresh) {
    console.log('🗑️   Dropping existing venues and time slots…');
    await Venue.deleteMany({});
    await TimeSlot.deleteMany({});
  }

  // ── Time Slots ─────────────────────────────────────────────────────────
  const existingSlots = await TimeSlot.countDocuments();
  if (existingSlots === 0) {
    await TimeSlot.insertMany(DEFAULT_TIME_SLOTS);
    console.log(`✅  Inserted ${DEFAULT_TIME_SLOTS.length} time slots`);
  } else {
    console.log(`ℹ️   Time slots already exist (${existingSlots}), skipping.`);
  }

  // ── Venues ─────────────────────────────────────────────────────────────
  const venues = loadJSON('venues.json');
  const photos = loadJSON('venue_photos.json');

  if (!venues || !photos) {
    console.error('❌  Could not load venue/photo assets.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`📦  Loaded ${venues.length} venues, ${photos.length} photos`);

  const venueDocs = buildVenueDocs(venues, photos);

  // Upsert so re-running the seeder is safe (no duplicate key errors)
  let inserted = 0;
  let updated = 0;

  for (const doc of venueDocs) {
    const result = await Venue.updateOne(
      { _id: doc._id },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0) inserted++;
    else updated++;
  }

  console.log(`✅  Venues seeded: ${inserted} inserted, ${updated} updated`);

  // ── Verify ─────────────────────────────────────────────────────────────
  const totalVenues = await Venue.countDocuments();
  const venuesWithPhotos = await Venue.countDocuments({ 'photos.0': { $exists: true } });

  console.log(`\n📊  Database summary:`);
  console.log(`    Total venues      : ${totalVenues}`);
  console.log(`    Venues with photos: ${venuesWithPhotos}`);
  console.log(`    Time slots        : ${await TimeSlot.countDocuments()}`);

  await mongoose.disconnect();
  console.log('\n🎉  Seeding complete! Run: node server.js');
}

main().catch((err) => {
  console.error('❌  Seeding failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
