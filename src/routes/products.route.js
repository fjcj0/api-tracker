import express from 'express';
import { get_products } from '../controller/products.controller.js';
const route = express.Router();
route.get('/', get_products);
export default route;