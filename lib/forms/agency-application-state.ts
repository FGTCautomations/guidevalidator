export type AgencyApplicationState = {
  status: "idle" | "error";
  message?: string;
};

export const AGENCY_APPLICATION_INITIAL_STATE: AgencyApplicationState = { status: "idle" };
