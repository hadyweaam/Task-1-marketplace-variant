import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markSold
} from '../controllers/listingController.js';

const router = Router();

router.get('/', getAllListings);           // list all (hides removed)
router.get('/:id', getListing);            // read one
router.post('/', createListing);           // create
router.patch('/:id', updateListing);       // update
router.patch('/:id/sold', markSold);       // stretch: mark sold
router.delete('/:id', deleteListing);      // soft delete

export default router;
