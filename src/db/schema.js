import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    money: decimal("money", { precision: 10, scale: 2 }).notNull(),
    profile_picture: text("profile_picture").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    quantity: integer("quantity").notNull(),
    salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
    image: text("image").notNull(),
    company_icon: text("company_icon").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
    id: serial("id").primaryKey(),
    product_id: integer("product_id").notNull().references(() => products.id),
    user_id: integer("user_id").notNull().references(() => users.id),
    new_salary: decimal("new_salary", { precision: 10, scale: 2 }).notNull(),
    percent: text("percent"),
    quantity: integer("quantity").notNull(),
    available: integer("available").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
    id: serial("id").primaryKey(),
    purchase_id: integer("purchase_id").notNull().references(() => purchases.id),
    product_id: integer("product_id").notNull().references(() => products.id),
    user_id: integer("user_id").notNull().references(() => users.id),
    sent_to_user_id: integer("sent_to_user_id").notNull().references(() => users.id),
    sent_by_user_id: integer("sent_by_user_id").notNull().references(() => users.id),
    background_color: text("background_color").notNull(),
    text_color: text("text_color").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const incomes = pgTable("incomes", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    icon_company: text("icon_company").notNull(),
    profit: decimal("profit", { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const losses = pgTable("losses", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    icon_company: text("icon_company").notNull(),
    loss: decimal("loss", { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
    purchases: many(purchases),
    sentTransactions: many(transactions, { relationName: "sent_by_user" }),
    receivedTransactions: many(transactions, { relationName: "sent_to_user" }),
    incomes: many(incomes),
    losses: many(losses),
}));

export const productsRelations = relations(products, ({ many }) => ({
    purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
    user: one(users, {
        fields: [purchases.user_id],
        references: [users.id],
    }),
    product: one(products, {
        fields: [purchases.product_id],
        references: [products.id],
    }),
    transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    purchase: one(purchases, {
        fields: [transactions.purchase_id],
        references: [purchases.id],
    }),
    product: one(products, {
        fields: [transactions.product_id],
        references: [products.id],
    }),
    user: one(users, {
        fields: [transactions.user_id],
        references: [users.id],
    }),
    sentToUser: one(users, {
        fields: [transactions.sent_to_user_id],
        references: [users.id],
        relationName: "sent_to_user"
    }),
    sentByUser: one(users, {
        fields: [transactions.sent_by_user_id],
        references: [users.id],
        relationName: "sent_by_user"
    }),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
    user: one(users, {
        fields: [incomes.user_id],
        references: [users.id],
    }),
}));

export const lossesRelations = relations(losses, ({ one }) => ({
    user: one(users, {
        fields: [losses.user_id],
        references: [users.id],
    }),
}));