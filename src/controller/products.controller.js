import express, { request, response } from 'express';
import { db } from '../config/db.js';
import { products } from '../db/schema.js';
export const get_products = async (request, response) => {
    try {
        const all_products = await db.select().from(products);
        return response.status(200).json({
            products: all_products
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};