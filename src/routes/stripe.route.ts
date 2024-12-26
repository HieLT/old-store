import express from "express";
import stripeController from "../controllers/stripe.controller";
import authentication from "../middlewares/authentication";

const stripeRouter = express.Router();



stripeRouter.get('/account-list', authentication, stripeController.getStripeAccount)
stripeRouter.post('/create-account', authentication, stripeController.createStripeAccount);
stripeRouter.get('/account-link/:account_id/:user_id', stripeController.accountLink)
stripeRouter.get('/login-link', authentication, stripeController.loginLinks);
stripeRouter.post('/checkout', authentication, stripeController.checkOut);
stripeRouter.get('/check-linked-account/:stripe_id',stripeController.checkPayoutEnable);
//route to get payment-intent_id if checkout successful
stripeRouter.get('/payment-success', stripeController.getPaymentIntentId);

export default stripeRouter;