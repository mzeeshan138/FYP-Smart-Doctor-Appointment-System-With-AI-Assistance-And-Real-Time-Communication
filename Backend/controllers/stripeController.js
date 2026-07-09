import Stripe from "stripe";
import paymentModel from "../models/paymentModel.js";
import appointmentModel from "../models/appointmentModel.js";
import {
  calculateDepositAmount,
  calculateBalanceAmount,
  finalizeAppointmentAfterPayment,
  validateBookingEligibility,
} from "../services/appointmentBookingService.js";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getCurrency = () =>
  process.env.STRIPE_CURRENCY.toLowerCase();

const toStripeAmount = (amount) => Math.round(amount * 100);

const fromStripeAmount = (amount) => amount / 100;

/** Doctor fees are in Rs; Stripe sandbox typically uses USD */
const getStripeCharge = (amountInRs) => {
  const currency = getCurrency();

  if (currency === "pkr") {
    return {
      currency,
      stripeAmount: toStripeAmount(amountInRs),
      displayAmount: amountInRs,
      displayCurrency: "Rs",
    };
  }

  const rate = Number(process.env.STRIPE_PKR_TO_USD_RATE);
  const usdAmount = Math.round((amountInRs / rate) * 100) / 100;

  return {
    currency,
    stripeAmount: Math.max(toStripeAmount(usdAmount), 50),
    displayAmount: usdAmount,
    displayCurrency: "USD",
  };
};

const frontendUrl = () =>
  process.env.FRONTEND_URL;

const waitForCompletedPayment = async (stripeSessionId, maxWaitMs = 15000) => {
  const intervalMs = 300;
  const attempts = Math.ceil(maxWaitMs / intervalMs);

  for (let i = 0; i < attempts; i++) {
    const payment = await paymentModel.findOne({
      stripeSessionId,
      status: "completed",
    });

    if (payment) {
      return payment;
    }

    const current = await paymentModel.findOne({ stripeSessionId });

    if (!current) {
      throw new Error("Payment record not found for session");
    }

    if (current.status === "failed") {
      throw new Error("Payment processing failed");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Payment is still being processed. Please refresh shortly.");
};

/** Atomically claim a pending payment so webhook + verify-session cannot both book. */
const claimPaymentForProcessing = async (stripeSessionId) => {
  const completedPayment = await paymentModel.findOne({
    stripeSessionId,
    status: "completed",
  });

  if (completedPayment) {
    return { claimed: false, alreadyProcessed: true, payment: completedPayment };
  }

  const claimedPayment = await paymentModel.findOneAndUpdate(
    { stripeSessionId, status: "pending" },
    { $set: { status: "processing" } },
    { new: true }
  );

  if (claimedPayment) {
    return { claimed: true, payment: claimedPayment };
  }

  const existingPayment = await paymentModel.findOne({ stripeSessionId });

  if (!existingPayment) {
    throw new Error("Payment record not found for session");
  }

  if (existingPayment.status === "completed") {
    return {
      claimed: false,
      alreadyProcessed: true,
      payment: existingPayment,
    };
  }

  if (existingPayment.status === "processing") {
    const payment = await waitForCompletedPayment(stripeSessionId);
    return { claimed: false, alreadyProcessed: true, payment };
  }

  throw new Error("Payment cannot be processed in its current state");
};

const releasePaymentClaim = async (stripeSessionId) => {
  await paymentModel.findOneAndUpdate(
    { stripeSessionId, status: "processing" },
    { $set: { status: "pending" } }
  );
};

const processCompletedCheckout = async (session) => {
  const claim = await claimPaymentForProcessing(session.id);

  if (!claim.claimed) {
    return { alreadyProcessed: true, payment: claim.payment };
  }

  const paymentRecord = claim.payment;
  const paymentType = session.metadata?.paymentType;
  const userId = session.metadata?.userId;

  if (!paymentType || !userId) {
    await releasePaymentClaim(session.id);
    throw new Error("Invalid session metadata");
  }

  const amount = session.metadata?.amountInRs
    ? Number(session.metadata.amountInRs)
    : fromStripeAmount(session.amount_total);
  const currency = session.currency;

  try {
    if (paymentType === "deposit") {
      const { docId, slotDate, slotTime } = session.metadata;

      const appointment = await finalizeAppointmentAfterPayment({
        userId,
        docId,
        slotDate,
        slotTime,
        depositAmount: amount,
      });

      paymentRecord.status = "completed";
      paymentRecord.stripePaymentIntentId = session.payment_intent;
      paymentRecord.paidAt = new Date();
      paymentRecord.appointmentId = appointment._id.toString();
      await paymentRecord.save();

      return { paymentType, appointment };
    }

    if (paymentType === "balance") {
      const { appointmentId } = session.metadata;
      const appointment = await appointmentModel.findById(appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (appointment.userId !== userId) {
        throw new Error("Unauthorized payment");
      }

      appointment.balancePaid = true;
      appointment.payment = true;
      await appointment.save();

      paymentRecord.status = "completed";
      paymentRecord.stripePaymentIntentId = session.payment_intent;
      paymentRecord.paidAt = new Date();
      paymentRecord.appointmentId = appointmentId;
      await paymentRecord.save();

      return { paymentType, appointment };
    }

    throw new Error("Unknown payment type");
  } catch (error) {
    await releasePaymentClaim(session.id);
    throw error;
  }
};

export const createDepositSession = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { docId, slotDate, slotTime } = req.body;

    // ========== ALL CHECKS BEFORE PAYMENT (same as old bookAppointment) ==========
    const eligibility = await validateBookingEligibility(
      userId,
      docId,
      slotDate,
      slotTime
    );

    if (!eligibility.eligible) {
      return res.json({ success: false, message: eligibility.message });
    }

    const stripe = getStripe();
    const depositAmount = eligibility.depositAmount;
    const charge = getStripeCharge(depositAmount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: charge.currency,
            product_data: {
              name: "Appointment deposit (10%)",
              description: `Deposit for Dr. ${eligibility.docData.name} — ${slotDate} ${slotTime}`,
            },
            unit_amount: charge.stripeAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        docId,
        slotDate,
        slotTime,
        paymentType: "deposit",
        amountInRs: String(depositAmount),
      },
      success_url: `${frontendUrl()}/my-appointments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl()}/appointment/${docId}?payment=cancelled`,
    });

    await paymentModel.create({
      userId,
      docId,
      stripeSessionId: session.id,
      amount: depositAmount,
      currency: charge.currency,
      paymentType: "deposit",
      status: "pending",
      slotDate,
      slotTime,
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      depositAmountRs: depositAmount,
      stripeAmount: charge.displayAmount,
      stripeCurrency: charge.displayCurrency,
    });
  } catch (error) {
    console.log("createDepositSession error:", error);
    let message = error.message || "Failed to create checkout session";
    if (message.toLowerCase().includes("currency")) {
      message =
        "Stripe currency is not supported on your account. Try STRIPE_CURRENCY=usd in config.env";
    }
    if (message.includes("STRIPE_SECRET_KEY")) {
      message = "Stripe is not configured. Add STRIPE_SECRET_KEY to config.env";
    }
    res.json({ success: false, message });
  }
};

export const createBalanceSession = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.json({ success: false, message: "Appointment ID is required" });
    }

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointment.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    if (appointment.cancelled) {
      return res.json({
        success: false,
        message: "Cannot pay for a cancelled appointment",
      });
    }

    if (!appointment.depositPaid) {
      return res.json({
        success: false,
        message: "Deposit must be paid before paying the balance",
      });
    }

    if (appointment.balancePaid || appointment.payment) {
      return res.json({
        success: false,
        message: "Remaining balance is already paid",
      });
    }

    const balanceAmount =
      appointment.balanceAmount ||
      calculateBalanceAmount(appointment.amount, appointment.depositAmount);

    const stripe = getStripe();
    const charge = getStripeCharge(balanceAmount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: charge.currency,
            product_data: {
              name: "Appointment remaining balance (90%)",
              description: `Balance for Dr. ${appointment.docData?.name}`,
            },
            unit_amount: charge.stripeAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        docId: appointment.docId,
        appointmentId: appointment._id.toString(),
        paymentType: "balance",
        amountInRs: String(balanceAmount),
      },
      success_url: `${frontendUrl()}/my-appointments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl()}/my-appointments?payment=cancelled`,
    });

    await paymentModel.create({
      userId,
      appointmentId: appointment._id.toString(),
      docId: appointment.docId,
      stripeSessionId: session.id,
      amount: balanceAmount,
      currency: charge.currency,
      paymentType: "balance",
      status: "pending",
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      balanceAmountRs: balanceAmount,
      stripeAmount: charge.displayAmount,
      stripeCurrency: charge.displayCurrency,
    });
  } catch (error) {
    console.log("createBalanceSession error:", error);
    res.json({
      success: false,
      message: error.message || "Failed to create checkout session",
    });
  }
};

export const verifyStripeSession = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.json({ success: false, message: "Session ID is required" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    if (session.metadata?.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized session" });
    }

    const result = await processCompletedCheckout(session);

    res.json({
      success: true,
      message:
        session.metadata.paymentType === "deposit"
          ? "Deposit paid and appointment booked successfully"
          : "Remaining balance paid successfully",
      alreadyProcessed: result.alreadyProcessed || false,
    });
  } catch (error) {
    console.log("verifyStripeSession error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (webhookSecret) {
      const signature = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (error) {
    console.log("Webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.payment_status === "paid") {
        await processCompletedCheckout(session);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.log("Webhook handler error:", error);
    res.status(500).json({ error: error.message });
  }
};
