import { Request, Response } from "express";
import mail from "../services/mail";
const Stripe = require('stripe');
const stripe = Stripe(String(process.env.STRIPE_PRIVATE_KEY));
const base_url = process.env.BASE_URL;
const fe_url = process.env.FE_ACCESS;
import orderRepo from "../repositories/order.repository";
import userRepository from "../repositories/user.repository";
import { ORDER_STATUS } from "../utils/enum";

interface CustomRequest extends Request {
    account?: any;
}
class StripeController {
    async checkOut(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        const { order_id } = req.body;
        try {
            const order = await orderRepo.getOrder(order_id);
           
            if (!order) {
                res.status(403).send('Order không tồn tại');
                return;
            }
            if (String(order.customer_id._id) !== String(account._id)) {
                res.status(403).send('Bạn không thể thanh toán order của người khác');
                return;
            }
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'vnd',
                            product_data: {
                                name: order.post_id.title,
                                images: order.post_id.product_id.images,
                            },
                            unit_amount: order.total

                        },
                            quantity: 1
                    }
                ],
                mode: 'payment',
                payment_intent_data: {
                    capture_method: 'manual',
                    receipt_email: account.email,
                    transfer_data: {
                        destination: order.receiver_stripe_account_id,
                        amount: order.total
                    },
                    metadata: {
                        mongoose_order_id: String(order._id)
                    }
                },
                expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 1days
                success_url: `${process.env.BASE_URL}/stripe/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.BASE_URL}/stripe/cancel`,
            })
            
            res.status(200).send(session.url);
        } catch (err: any) {
            res.status(400).send(err.message);
        }
    }
    async getPaymentIntentId(req : Request, res: Response):Promise<void> {
        const session_id = req.query.session_id;
        try{
            const session = await stripe.checkout.sessions.retrieve(session_id);
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

            const order_id = paymentIntent.metadata.mongoose_order_id;
            await Promise.all([
                orderRepo.updateStripePaymentIntentId(order_id,String(paymentIntent.id)),
                orderRepo.updateStatusOrder(null, order_id, ORDER_STATUS.PROCESSING)
            ]);
        } catch(err: any){
            console.log(err.message);
        }
        res.redirect(`${fe_url}/payment/success`)
    }
    
    async getStripeAccount(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        try {
            const stripeAccounts = await stripe.accounts.list();

            const filteredAccounts = stripeAccounts.data.filter((stripeAccount: any) =>
                String(stripeAccount.metadata.user_id) === String(account._id)
            );

            res.status(200).send(filteredAccounts);
        } catch (err: any) {
            res.status(500).send(err.message);
        }
    }

    async loginLinks(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        const stripe_id = req.body.stripe_id;

        try {
            const stripeAccount = await stripe.accounts.retrieve(stripe_id);

            if (String(stripeAccount.metadata?.user_id) !== String(account._id)) {
                res.status(403).send('Tài khoản này không phải của bạn');
                return
            }

            const loginLink = await stripe.accounts.createLoginLink(stripe_id);
            return res.status(200).redirect(loginLink.url);
        } catch (err: any) {
            res.status(500).send(err.message);
        }
    }

    async createStripeAccount(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        try {
            const stripeAccount = await stripe.accounts.create({
                country: 'sg',
                email: account.email,
                controller: {
                    fees: {
                        payer: 'application',
                    },
                    losses: {
                        payments: 'application',
                    },
                    stripe_dashboard: {
                        type: 'express',
                    },

                },
                metadata: {
                    user_id: String(account._id)
                }
            });

            const email = account.email
            const web_name = process.env.WEB_NAME
            const subject = `Bạn đã tạo tài khoản thanh toán stripe trên trang web ${web_name} `
            const message = `Bạn đã tạo tài khoản stripe với mã là ${stripeAccount.id}, đây cũng là mã đăng nhập tài khoản stripe của bạn. Để có thể đăng nhập cũng như thanh toán với người dùng khác vui lòng click vào link điền thêm thông tin để có thể liên kết tài khoản stripe với website của chúng tôi. Link: ${base_url}/stripe/account-link/${stripeAccount.id}/${account._id}`

            await mail.sendMail({ email, subject, message });
            res.status(200).send(`Vui lòng check mail để thực hiện liên kết tài khoản stripe với ${web_name}`);
        } catch (err: any) {
            res.status(500).send(err.message);
        }
    }
    async accountLink(req: CustomRequest, res: Response): Promise<void> {
        const stripe_account_id = req.params.account_id;
        const user_id = req.params.user_id;
        try {
            const returnUrl = `${fe_url}/payment/connect-account-result/${stripe_account_id}`
            const refreshUrl = `${base_url}/stripe/account-link/${stripe_account_id}/${user_id}`
            const accountLink = await stripe.accountLinks.create({
                account: stripe_account_id,
                refresh_url: refreshUrl,
                return_url: returnUrl,
                type: 'account_onboarding',
            });

            if (accountLink.url === returnUrl) {
                await userRepository.updateUser(user_id, {stripe_account_id});
            }

            res.redirect(accountLink.url);
        } catch (err: any) {
            console.error('Error creating account link:', err.message);
            res.status(500).send('Failed to create a new account link. Please try again.');
        }
    };
    async checkPayoutEnable(req: Request, res: Response): Promise<void> {
        const stripe_id = req.params.stripe_id
        try{
            const account = await stripe.accounts.retrieve(stripe_id);

            if(account.payouts_enabled) res.status(200).send('Tài khoản stripe của bạn đã liên kết với nền tảng website')
            else res.status(400).send('Tài khoản stripe chưa liên kết với nền tảng website, hãy liên kết với nền tảng website ở phần chỉnh sửa thông tin của bạn')  
        } catch(err: any){
            res.status(400).send(err.message);
        }
    }

}

export default new StripeController();