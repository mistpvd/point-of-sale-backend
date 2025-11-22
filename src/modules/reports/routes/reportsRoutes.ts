// routes/reports.ts
import {
    getReportSummary,
    getSalesReport,
    getTopProducts,
    getInventoryStatus,
    getRecentActivity
} from '../controllers/reportController';
import express from "express";

const router = express.Router();

router.get('/summary', getReportSummary);
router.get('/sales', getSalesReport);
router.get('/top-products', getTopProducts);
router.get('/inventory-status', getInventoryStatus);
router.get('/recent-activity', getRecentActivity);

export  default  router;
