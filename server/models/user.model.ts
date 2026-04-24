import { model, Schema, Document } from "mongoose";
import { omit } from "ramda";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dayjs from "dayjs";

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  isVerified: boolean;
  isAdmin: boolean;
  isLocked: boolean;
  lockedUntil: Date | null;
  unlockToken: string;
  unlockTokenExpires: Date | null;
  passwordHashType: "bcrypt" | "md5";
  expires?: Date;

  comparePassword(password: string): boolean;
  hidePassword(): void;
  hashPassword(): Promise<string>;
  migratePasswordIfNeeded(plainPassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  passwordResetToken: { type: String, default: "" },
  passwordResetExpires: { type: Date, default: dayjs().toDate() },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
    required: true,
  },
  lockedUntil: { type: Date, default: null },
  unlockToken: { type: String, default: "" },
  unlockTokenExpires: { type: Date, default: null },
  passwordHashType: {
    type: String,
    enum: ["bcrypt", "md5"],
    default: "bcrypt",
    required: true,
  },
  expires: { type: Date, default: dayjs().toDate(), expires: 43200 },
});

userSchema.methods.comparePassword = function (password: string) {
  if (this.passwordHashType === "md5") {
    const md5Hash = crypto.createHash("md5").update(password).digest("hex");
    return md5Hash === this.password;
  }
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.hashPassword = function () {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err1, salt) => {
      if (err1) {
        reject(err1);
        return;
      }
      bcrypt.hash(this.password, salt, (err2, hash) => {
        if (err2) {
          reject(err2);
          return;
        }
        this.password = hash;
        this.passwordHashType = "bcrypt";
        resolve(hash);
      });
    });
  });
};

userSchema.methods.migratePasswordIfNeeded = async function (
  plainPassword: string,
): Promise<boolean> {
  if (this.passwordHashType === "md5") {
    this.password = plainPassword;
    await this.hashPassword();
    return true;
  }
  return false;
};

userSchema.methods.hidePassword = function () {
  return omit(["password", "__v", "_id"], this.toObject({ virtuals: true }));
};

export const User = model<UserDocument>("User", userSchema);

export default User;
