import express, { request, response } from 'express';
import { db } from '../config/db.js';
import { incomes, products, purchases, transactions, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
export const create_transaction = async (request, response) => {
    try {
        const { purchaseId, productId, userId, sentToUserId, sentByUserId, backgroundColor, textColor, quantity } = request.body;
        if (!productId || !purchaseId || !userId || !sentToUserId || !sentByUserId || !backgroundColor || !textColor || !quantity) {
            return response.status(400).json({
                error: 'All fields are required!!'
            });
        }
        const [purchase] = await db.select().from(purchases).where(eq(purchases.id, parseInt(purchaseId)));
        if (!purchase) {
            return response.status(404).json({
                error: 'Purchase not found!!'
            });
        }
        const [receiverUser] = await db.select().from(users).where(eq(users.id, parseInt(sentToUserId)));
        if (!receiverUser) {
            return response.status(404).json({
                error: 'Receiver user not found!!'
            });
        }
        const [senderUser] = await db.select().from(users).where(eq(users.id, parseInt(sentByUserId)));
        if (!senderUser) {
            return response.status(404).json({
                error: 'Sender user not found!!'
            });
        }
        const [product] = await db.select().from(products).where(eq(products.id, parseInt(productId)));
        if (!product) {
            return response.status(404).json({
                error: 'Product not found!!'
            });
        }
        const [currentUser] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
        if (!currentUser) {
            return response.status(404).json({
                error: 'Current user not found!!'
            });
        }
        if (purchase.quantity < quantity) {
            return response.status(400).json({
                error: `Not enough quantity available! Only ${purchase.quantity} left.`
            });
        }
        if (purchase.available === 0) {
            return response.status(400).json({
                error: 'This purchase is not available for transactions!'
            });
        }
        const currentMoney = parseFloat(receiverUser.money);
        const newSalary = parseFloat(purchase.new_salary);
        const totalCost = quantity * newSalary;
        const newMoney = (currentMoney + totalCost).toFixed(2);
        const newQuantity = purchase.quantity - quantity;
        const newPercent = ((newQuantity / purchase.quantity) * 100).toFixed(2) + '%';
        const newAvailable = newQuantity > 0 ? 1 : 0;
        const created_transaction = await db.insert(transactions).values({
            purchase_id: purchaseId,
            product_id: productId,
            user_id: userId,
            sent_to_user_id: sentToUserId,
            sent_by_user_id: sentByUserId,
            background_color: backgroundColor,
            text_color: textColor,
        }).returning();
        await db.update(users)
            .set({
                money: newMoney,
                updated_at: new Date(),
            })
            .where(eq(users.id, parseInt(sentToUserId)));

        await db.update(purchases)
            .set({
                percent: newPercent,
                available: newAvailable,
                updated_at: new Date(),
            })
            .where(eq(purchases.id, parseInt(purchaseId)));
        const income = await db.insert(incomes).values({
            user_id: userId,
            title: `Sale of ${product.title}`,
            icon_company: product.company_icon,
            profit: totalCost.toFixed(2),
        }).returning();
        return response.status(201).json({
            message: 'Transaction created successfully!!',
            transaction: created_transaction[0],
            income: income[0],
            money_added: totalCost,
            new_quantity: newQuantity,
            new_percent: newPercent,
            receiver_updated_money: newMoney
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const get_transactions = async (request, response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({
                error: 'userId is required!!'
            });
        }

        const userIdNumber = parseInt(userId);
        if (isNaN(userIdNumber)) {
            return response.status(400).json({
                error: 'userId must be a valid number!!'
            });
        }
        const userTransactions = await db.select()
            .from(transactions)
            .where(eq(transactions.user_id, userIdNumber));
        const enrichedTransactions = await Promise.all(
            userTransactions.map(async (transaction) => {
                const [product] = await db.select({
                    title: products.title,
                    company_icon: products.company_icon
                })
                    .from(products)
                    .where(eq(products.id, transaction.product_id));
                const [purchase] = await db.select({
                    percent: purchases.percent
                })
                    .from(purchases)
                    .where(eq(purchases.id, transaction.purchase_id));
                const [sender] = await db.select({
                    name: users.name,
                    profile_picture: users.profile_picture
                })
                    .from(users)
                    .where(eq(users.id, transaction.sent_by_user_id));
                const [receiver] = await db.select({
                    name: users.name,
                    profile_picture: users.profile_picture
                })
                    .from(users)
                    .where(eq(users.id, transaction.sent_to_user_id));
                return {
                    ...transaction,
                    product_title: product?.title || null,
                    product_icon: product?.company_icon || null,
                    purchase_percent: purchase?.percent || null,
                    sender_name: sender?.name || null,
                    sender_profile_picture: sender?.profile_picture || null,
                    receiver_name: receiver?.name || null,
                    receiver_profile_picture: receiver?.profile_picture || null
                };
            })
        );
        return response.status(200).json({
            transactions: enrichedTransactions
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};