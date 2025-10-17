export type DmcApplicationState = {
  status: "idle" | "error";
  message?: string;
};

export const DMC_APPLICATION_INITIAL_STATE: DmcApplicationState = { status: "idle" };
