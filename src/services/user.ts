import { logger } from "@/config/logger";
import { IUser, User } from "@/models/user";
import { Types } from "mongoose";


export const createUser = async (user: IUser) => {
  try {
    const newUser = await User.create(user);

    return newUser
  } catch (error) {
    logger.error(error, "Error creating new User")
  }
}

export const getUser = async (userId: Types.ObjectId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    logger.error(error, "Error getting user with id")
  }
}
