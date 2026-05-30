import Stripe from "stripe";
import paymentModel from "../models/paymentModel.js";
import appointmentModel from "../models/appointmentModel.js";
import {
  calculateDepositAmount,
  calculateBalanceAmount,
  createAppointmentAfterDeposit,
  validateSlotForBooking,
} from "../services/appointmentBookingService.js";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getCurrency = () =>
  (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

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

  const rate = Number(process.env.STRIPE_PKR_TO_USD_RATE) || 280;
  const usdAmount = Math.round((amountInRs / rate) * 100) / 100;

  return {
    currency,
    stripeAmount: Math.max(toStripeAmount(usdAmount), 50),
    displayAmount: usdAmount,
    displayCurrency: "USD",
  };
};

const frontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:3000";

const processCompletedCheckout = async (session) => {
  const existingPayment = await paymentModel.findOne({
    stripeSessionId: session.id,
    status: "completed",
  });

  if (existingPayment) {
    return { alreadyProcessed: true, payment: existingPayment };
  }

  const paymentType = session.metadata?.paymentType;
  const userId = session.metadata?.userId;

  if (!paymentType || !userId) {
    throw new Error("Invalid session metadata");
  }

  const amount = session.metadata?.amountInRs
    ? Number(session.metadata.amountInRs)
    : fromStripeAmount(session.amount_total);
  const currency = session.currency;

  let paymentRecord = await paymentModel.findOne({
    stripeSessionId: session.id,
  });

  if (paymentType === "deposit") {
    const { docId, slotDate, slotTime } = session.metadata;

    const slotCheck = await validateSlotForBooking(docId, slotDate, slotTime);
    if (!slotCheck.valid) {
      throw new Error(slotCheck.message || "Slot no longer available");
    }

    const appointment = await createAppointmentAfterDeposit({
      userId,
      docId,
      slotDate,
      slotTime,
      depositAmount: amount,
    });

    if (!paymentRecord) {
      paymentRecord = await paymentModel.create({
        userId,
        docId,
        appointmentId: appointment._id.toString(),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        amount,
        currency,
        paymentType: "deposit",
        status: "completed",
        slotDate,
        slotTime,
        paidAt: new Date(),
      });
    } else {
      paymentRecord.status = "completed";
      paymentRecord.stripePaymentIntentId = session.payment_intent;
      paymentRecord.paidAt = new Date();
      paymentRecord.appointmentId = appointment._id.toString();
      await paymentRecord.save();
    }

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

    if (!paymentRecord) {
      paymentRecord = await paymentModel.create({
        userId,
        docId: session.metadata.docId,
        appointmentId,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        amount,
        currency,
        paymentType: "balance",
        status: "completed",
        paidAt: new Date(),
      });
    } else {
      paymentRecord.status = "completed";
      paymentRecord.stripePaymentIntentId = session.payment_intent;
      paymentRecord.paidAt = new Date();
      paymentRecord.appointmentId = appointmentId;
      await paymentRecord.save();
    }

    return { paymentType, appointment };
  }

  throw new Error("Unknown payment type");
};

export const createDepositSession = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { docId, slotDate, slotTime } = req.body;

    if (!docId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing booking details" });
    }

    const slotCheck = await validateSlotForBooking(docId, slotDate, slotTime);
    if (!slotCheck.valid) {
      return res.json({ success: false, message: slotCheck.message });
    }

    const existingAppointment = await appointmentModel.findOne({
      userId,
      cancelled: false,
      isCompleted: false,
    });

    if (existingAppointment) {
      return res.json({
        success: false,
        message:
          "You already have an active appointment. Complete or cancel it before booking a new one.",
      });
    }

    const stripe = getStripe();
    const totalFees = slotCheck.docData.fees;
    const depositAmount = calculateDepositAmount(totalFees);
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
              description: `Deposit for Dr. ${slotCheck.docData.name} — ${slotDate} ${slotTime}`,
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
