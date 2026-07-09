import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import { getAccountBannedMessage } from "../utils/accountStatusMessages.js";

/**
 * Chat auth: accepts user token (`token`) or doctor token (`token` / `dtoken`).
 * Sets req.body.userId and req.body.userModel for shared chat controller routes.
 */
const authAny = async (req, res, next) => {
  try {
    const authToken = req.headers.token || req.headers.dtoken;

    if (!authToken) {
      return res.json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }

    if (!req.body) req.body = {};

    const token_decode = jwt.verify(authToken, process.env.JWT_SECRET);

    const user = await userModel
      .findById(token_decode.id)
      .select("accountStatus");

    if (user) {
      if (user.accountStatus === "blocked") {
        return res.json({
          success: false,
          accountBanned: true,
          message: getAccountBannedMessage(),
        });
      }

      req.body.userId = token_decode.id;
      req.body.userModel = "user";
      if (req.query) req.query.userModel = "user";
      return next();
    }

    const doctor = await doctorModel.findById(token_decode.id).select("_id");

    if (doctor) {
      req.body.userId = token_decode.id;
      req.body.userModel = "doctor";
      if (req.query) req.query.userModel = "doctor";
      return next();
    }

    return res.json({
      success: false,
      message: "Not Authorized Login Again",
    });
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

export default authAny;
