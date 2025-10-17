export type GuideApplicationState = {
  status: "idle" | "error";
  message?: string;
};

export const GUIDE_APPLICATION_INITIAL_STATE: GuideApplicationState = { status: "idle" };
