import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Error } from "../components";
import {
  attemptRegister,
  attemptResendConfirmation,
  attemptResetRegister,
} from "../store/thunks/auth";
import { User } from "src/store/actions/user";
import { useAppDispatch } from "src/store/hooks";
import { useServerError } from "src/hooks/useServerError";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";

type RegisterFormValues = User;

enum RegisterFormStep {
  Register,
  Resend,
  Reset,
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const checkPasswordStrength = (password: string): PasswordStrength => {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    isValid: password.length >= 8 && passwordRegex.test(password),
  };
};

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  const requirements = [
    {
      key: "length",
      label: "At least 8 characters",
      met: strength.hasMinLength,
    },
    {
      key: "uppercase",
      label: "Contains uppercase letter (A-Z)",
      met: strength.hasUppercase,
    },
    {
      key: "lowercase",
      label: "Contains lowercase letter (a-z)",
      met: strength.hasLowercase,
    },
    { key: "number", label: "Contains number (0-9)", met: strength.hasNumber },
  ];

  if (!password) {
    return (
      <div className="password-requirements">
        <p className="requirements-title">Password Requirements:</p>
        {requirements.map((req) => (
          <div key={req.key} className="requirement-item neutral">
            <span className="icon">○</span>
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="password-requirements">
      <p className="requirements-title">Password Requirements:</p>
      {requirements.map((req) => (
        <div
          key={req.key}
          className={`requirement-item ${req.met ? "met" : "unmet"}`}
        >
          <span className="icon">{req.met ? "✓" : "✗"}</span>
          <span>{req.label}</span>
        </div>
      ))}
      {strength.isValid && (
        <div className="password-valid">
          <span className="icon valid-icon">✓</span>
          <span>Password is strong!</span>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { serverError, handleServerError } = useServerError();
  const [email, setEmail] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState<RegisterFormStep>(
    RegisterFormStep.Register,
  );

  const initialValues: RegisterFormValues = {
    email: "",
    username: "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string().min(5).max(255).email().required("Required"),
    username: Yup.string().min(3).max(50).required("Required"),
    password: Yup.string()
      .min(8)
      .max(255)
      .matches(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      )
      .required("Required"),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: initialValues,
    resolver: yupResolver(validationSchema),
  });

  const passwordValue = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  const onSubmit = (values: RegisterFormValues) => {
    dispatch(attemptRegister(values))
      .then(() => {
        setEmail(values.email);
        setRegisterStep(RegisterFormStep.Resend);
      })
      .catch(handleServerError);
  };

  const handleResendEmail = () => {
    if (!email) return;

    dispatch(attemptResendConfirmation(email, navigate))
      .then(() => {
        setRegisterStep(RegisterFormStep.Reset);
      })
      .catch(handleServerError);
  };

  const handleResetRegister = () => {
    if (!email) return;

    dispatch(attemptResetRegister(email, navigate))
      .then(() => {
        setRegisterStep(RegisterFormStep.Register);
      })
      .catch(handleServerError);
  };

  function renderSwitch() {
    switch (registerStep) {
      case RegisterFormStep.Register:
        return (
          <div className="container">
            <form className="form" onSubmit={handleSubmit(onSubmit)}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="Email"
                />
                {errors.email && <Error>{errors.email.message}</Error>}
              </div>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  {...register("username")}
                  id="username"
                  type="text"
                  placeholder="Username"
                />
                {errors.username && <Error>{errors.username.message}</Error>}
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  {...register("password")}
                  id="password"
                  type="password"
                  placeholder="Password"
                />
                <PasswordStrengthIndicator password={passwordValue} />
                {errors.password && <Error>{errors.password.message}</Error>}
              </div>

              <button type="submit">Signup</button>
              {serverError && <Error>{serverError}</Error>}
            </form>
          </div>
        );

      case RegisterFormStep.Resend:
        return (
          <div className="container">
            <p>A verification email has been sent.</p>
            <p>Check you mailbox : {email}.</p>
            <p>
              You have 12 hours to activate your account. It can take up to 15
              min to receive our email.
            </p>

            <button onClick={handleResendEmail}>
              Did not receive the email? Click here to send again.
            </button>
            {serverError && <Error>{serverError}</Error>}
          </div>
        );

      case RegisterFormStep.Reset:
        return (
          <div className="container">
            <p>Still not received an email? </p>
            <p>Try to register again. You may have given the wrong email. </p>
            <p>
              If you want to be able to use the same username, reset the
              registration :
            </p>

            <button onClick={handleResetRegister}>
              Click here to reset the registration
            </button>
            {serverError && <Error>{serverError}</Error>}
          </div>
        );
      default:
        return <Navigate to="/home" replace />;
    }
  }

  return <>{renderSwitch()}</>;
}
