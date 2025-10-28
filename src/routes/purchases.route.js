import express from 'express';
import { create_purchase, delete_purchase, get_purchases } from '../controller/purchases.controller.js';
const route = express.Router();
route.post('/', create_purchase);
route.delete('/:purchaseId', delete_purchase);
route.get('/:userId', get_purchases);
export default route;