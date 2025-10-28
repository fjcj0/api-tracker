import "dotenv/config";
import job from './config/cron.js';
import authRoute from './routes/auth.route.js';
import purchaseRoute from './routes/purchases.route.js';
import transactionRoute from './routes/transactions.route.js';
import productRoute from './routes/products.route.js';
import express, { response, request } from 'express';
const app = express();
if (process.env.NODE_ENV === 'production') job.start();
app.use(express.json());
app.get(`/api/tracker`, (request, response) => {
    return response.status(200).json({
        success: true
    });
});
app.use('/api/auth', authRoute);
app.use('/api/purchase', purchaseRoute);
app.use('/api/transaction', transactionRoute);
app.use('/api/product', productRoute);
app.listen(process.env.PORT, () => {
    console.log(`Your localhost link: http://localhost:${process.env.PORT}`);
});