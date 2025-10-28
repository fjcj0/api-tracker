import express from 'express';
import { create_transaction, get_transactions } from '../controller/transactions.controller.js';
const route = express.Router();
route.post('/', create_transaction);
route.get('/:userId', get_transactions);
export default route;