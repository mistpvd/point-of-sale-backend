import express from 'express';
import {
    createStore,
    getStores,
    updateStore,
    deleteStore,
} from '../controllers/storeController';

const router = express.Router();

router.post('/', createStore);
router.get('/', getStores);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;
