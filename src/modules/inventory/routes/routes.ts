import { Router } from "express";
import { auditStock } from "../controllers/stockAuditController";

const router = Router();

// ... your existing inventory routes
router.get("/stock/audit", auditStock);

export default router;
