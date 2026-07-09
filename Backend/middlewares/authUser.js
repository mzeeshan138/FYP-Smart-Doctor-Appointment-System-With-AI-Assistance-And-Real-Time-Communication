import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { getAccountBannedMessage } from "../utils/accountStatusMessages.js";

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel
      .findById(token_decode.id)
      .select("accountStatus");

    if (!user) {
      return res.json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }

    if (user.accountStatus === "blocked") {
      return res.json({
        success: false,
        accountBanned: true,
        message: getAccountBannedMessage(),
      });
    }

    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    console.log("error:", error);
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
