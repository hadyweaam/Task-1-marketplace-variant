import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// ---- Validation schemas (README section 2) ----

// POST: title + price are required, everything else optional.
const createSchema = Joi.object({
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().max(2000).allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
});

// PATCH: same fields, none required (you send only what you want to change).
const updateSchema = Joi.object({
  title: Joi.string().min(1).max(120),
  description: Joi.string().max(2000).allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
}).min(1); // reject an empty PATCH body

// GET /api/listings
// Hides 'removed' by default. Pass ?includeRemoved=true to see them.
export async function getAllListings(req, res, next) {
  try {
    const filter = {};
    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }
    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email')
      .lean();
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id  --> SOFT DELETE (README section 4)
// Does NOT remove the document. Sets status = 'removed'.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing removed', listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold  --> stretch goal (README section 5)
// Flips status to 'sold' directly, skipping the generic update rules.
export async function markSold(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'sold' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing marked as sold', listing });
  } catch (err) { next(err); }
}
