import Joi from "joi";
import { UserDocument } from "@models/user.model";

const passwordComplexityRules = {
  password: Joi.string()
    .min(8)
    .max(255)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must be less than 256 characters.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      "any.required": "Password is required.",
    }),
};

export function validateUser(
  user: Pick<UserDocument, "username" | "email" | "password" | "isAdmin">,
) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    ...passwordComplexityRules,
    isAdmin: Joi.boolean().required(),
  });

  return schema.validate(user);
}

export function validateLoginInput(
  input: Pick<UserDocument, "username" | "password">,
) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(input);
}

export function validateRegisterInput(
  input: Pick<UserDocument, "username" | "email" | "password">,
) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    ...passwordComplexityRules,
    email: Joi.string().min(5).max(255).required().email(),
  });

  return schema.validate(input);
}

export function validateEmail(input: Pick<UserDocument, "email">) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });

  return schema.validate(input);
}

export function validatePassword(input: Pick<UserDocument, "password">) {
  const schema = Joi.object({
    ...passwordComplexityRules,
  });
  return schema.validate(input);
}
