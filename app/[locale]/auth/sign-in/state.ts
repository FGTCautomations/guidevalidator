export type SignInState = {
  status: "idle" | "error";
  message?: string;
};

export const SIGN_IN_DEFAULT_STATE: SignInState = { status: "idle" };
