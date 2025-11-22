import express from 'express';
import {
    getStockBalances,
    getStockMovements,
    receiveStock,
    issueStock,
    transferStock,
    adjustStock,
} from '../controllers/stockController';

const router = express.Router();

// --------------------------------------------------------
// READ Endpoints (Data for UI Tabs)
// --------------------------------------------------------
router.get('/balances', getStockBalances); // For Overview/Products tabs
router.get('/movements', getStockMovements); // For Movements tab




// --------------------------------------------------------
// WRITE Endpoints (Core Inventory Transactions)
// --------------------------------------------------------
router.post('/receive', receiveStock);     // Handles incoming stock (e.g., PO Receipts, Production)
router.post('/issue', issueStock);         // Handles outgoing stock (e.g., POS Sales, Wastage)
router.post('/transfer', transferStock);   // Handles stock movement between two internal locations
router.post('/adjust', adjustStock);       // Handles manual inventory corrections (Adjustments tab)

export default router;