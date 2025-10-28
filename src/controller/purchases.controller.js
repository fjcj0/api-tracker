import express, { response, request } from 'express';
import { db } from '../config/db.js';
import { losses, products, purchases, users } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';
export const create_purchase = async (request, response) => {
    try {
        const { product_id, user_id, percent, quantity, new_salary, available } = request.body;
        if (!product_id || !user_id || !percent || !quantity || !new_salary || !available) {
            return response.status(400).json({
                error: 'All fields are required!!'
            });
        }
        const [user] = await db.select().from(users).where(eq(users.id, user_id));
        const [product] = await db.select().from(products).where(eq(products.id, product_id));
        if (!user) {
            return response.status(404).json({
                error: 'User not found!!'
            });
        }
        if (!product) {
            return response.status(404).json({
                error: 'Product not found!!'
            });
        }
        const userMoney = parseFloat(user.money);
        const productSalary = parseFloat(product.salary);
        const totalCost = productSalary * quantity;
        const existing_purchase = await db.select()
            .from(purchases)
            .where(and(
                eq(purchases.product_id, product_id),
                eq(purchases.user_id, user_id)
            ));
        if (existing_purchase.length > 0) {
            if (existing_purchase[0].available === 0) {
                if (userMoney < totalCost) {
                    return response.status(400).json({
                        error: 'You dont have enough money!!'
                    });
                }
                const newMoney = (userMoney - totalCost).toFixed(2);
                await db.update(users)
                    .set({
                        money: newMoney,
                        updated_at: new Date()
                    })
                    .where(eq(users.id, user_id));
                const updated_purchase = await db.update(purchases)
                    .set({
                        percent,
                        quantity,
                        new_salary,
                        available,
                        updated_at: new Date()
                    })
                    .where(and(
                        eq(purchases.product_id, product_id),
                        eq(purchases.user_id, user_id)
                    ))
                    .returning();
                const loss = await db.insert(losses).values({
                    user_id: user_id,
                    title: `Purchase of ${product.title}`,
                    icon_company: product.company_icon,
                    loss: totalCost.toFixed(2),
                }).returning();
                return response.status(200).json({
                    message: 'Purchase updated successfully!!',
                    purchase: updated_purchase[0],
                    loss: loss[0]
                });
            }
            return response.status(400).json({
                error: 'There is one on your purchases!!'
            });
        }
        if (userMoney < totalCost) {
            return response.status(400).json({
                error: 'You dont have enough money!!'
            });
        }
        const newMoney = (userMoney - totalCost).toFixed(2);
        await db.update(users)
            .set({
                money: newMoney,
                updated_at: new Date()
            })
            .where(eq(users.id, user_id));
        const created_purchase = await db.insert(purchases)
            .values({
                product_id,
                user_id,
                percent,
                quantity,
                new_salary,
                available,
            })
            .returning();
        const loss = await db.insert(losses).values({
            user_id: user_id,
            title: `Purchase of ${product.title}`,
            icon_company: product.company_icon,
            loss: totalCost.toFixed(2),
        }).returning();
        return response.status(201).json({
            message: 'Purchase created successfully!!',
            purchase: created_purchase[0],
            loss: loss[0]
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const delete_purchase = async (request, response) => {
    try {
        const { purchaseId } = request.params;
        if (!purchaseId) {
            return response.status(400).json({
                error: 'purchaseId is required!!'
            });
        }
        const purchaseIdNum = parseInt(purchaseId);
        if (isNaN(purchaseIdNum)) {
            return response.status(400).json({
                error: 'purchaseId must be a valid number!!'
            });
        }
        const existingPurchase = await db.select()
            .from(purchases)
            .where(eq(purchases.id, purchaseIdNum));
        if (existingPurchase.length === 0) {
            return response.status(404).json({
                error: `Purchase with ID ${purchaseIdNum} not found!!`
            });
        }
        const deleted_purchase = await db.delete(purchases)
            .where(eq(purchases.id, purchaseIdNum))
            .returning();

        if (deleted_purchase.length > 0) {
            return response.status(200).json({
                message: 'Deleted successfully!!',
                deleted_purchase: deleted_purchase[0]
            });
        }
        return response.status(404).json({
            error: 'Purchase not found after deletion attempt'
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const get_purchases = async (request, response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({
                error: 'userId is required!!'
            });
        }
        const userPurchases = await db.select({
            id: purchases.id,
            product_id: purchases.product_id,
            user_id: purchases.user_id,
            percent: purchases.percent,
            quantity: purchases.quantity,
            new_salary: purchases.new_salary,
            available: purchases.available,
            created_at: purchases.created_at,
            updated_at: purchases.updated_at,
            title: products.title,
            image: products.image,
            icon: products.company_icon
        })
            .from(purchases)
            .leftJoin(products, eq(purchases.product_id, products.id))
            .where(eq(purchases.user_id, parseInt(userId)));
        return response.status(200).json({
            purchases: userPurchases
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};