// src/schemas/userRoutes.ts
import express from 'express';
import {
    getUsers,
    updateUserStatus,
    createUser,
    deactivateUser
} from '../controllers/userController';

const router = express.Router();

router.get('/', getUsers);
router.put('/:id', updateUserStatus);
router.post('/', createUser);
router.put('/:id/deactivate', deactivateUser);


export default router;
