// src/modules/inventory/location/routes/locationRoutes.ts
import { Router } from 'express';
import { createLocation, getLocations } from '../controllers/locationController';

const router = Router();

router.post('/', createLocation);
router.get('/', getLocations);

export default router;
