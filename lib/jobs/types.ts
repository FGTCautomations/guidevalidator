export type JobStatus = "open" | "draft" | "closed" | "filled" | "cancelled";

export type JobLocation = {
  countryCode?: string | null;
  countryName?: string | null;
  regionId?: string | null;
  regionName?: string | null;
  cityId?: string | null;
  cityName?: string | null;
};

export type JobBudget = {
  minCents?: number | null;
  maxCents?: number | null;
  currency: string;
};

export type JobListItem = {
  id: string;
  title: string;
  description: string;
  agencyId: string;
  agencyName: string;
  location: JobLocation;
  specialties: string[];
  languages: string[];
  startDate?: string | null;
  endDate?: string | null;
  budget: JobBudget;
  contactEmail?: string | null;
  status: JobStatus | string;
  createdAt: string;
  href: string;
};

export type JobDetail = JobListItem & {
  applicationDeadline?: string | null;
};

export type JobApplicationSummary = {
  id: string;
  jobId: string;
  guideId: string;
  guideName?: string | null;
  guideHeadline?: string | null;
  status: "pending" | "accepted" | "rejected";
  coverLetter?: string | null;
  submittedAt: string;
  budgetExpectationCents?: number | null;
  availabilityStart?: string | null;
  availabilityEnd?: string | null;
  languages: string[];
  specialties: string[];
};

export type JobFilters = {
  country?: string;
  regionId?: string;
  cityId?: string;
  languages?: string[];
  specialties?: string[];
  status?: JobStatus | "open";
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
};
