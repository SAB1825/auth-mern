import mongoose, { Schema } from "mongoose";


export interface IUser {
  name: {
    first: string;
    last: string;
  };
  email: string;
  photo: {
    url: string
  }
}

export const userSchema = new Schema<IUser>({
  name: {
    first: String,
    last: String,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  photo: {
    url: String
  }
})

export const User = mongoose.model("User", userSchema)
