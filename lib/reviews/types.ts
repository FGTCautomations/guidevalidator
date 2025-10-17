export type ReviewStatus = "pending" | "approved" | "rejected" | "reported";

export type ReviewerType = "guide" | "agency" | "dmc" | "transport";
export type RevieweeType = "guide" | "agency" | "dmc" | "transport";

export type Review = {
  id: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: ReviewerType;
  revieweeType: RevieweeType;

  // Ratings (1-5)
  // For agencies rating guides
  serviceRating?: number;
  communicationRating?: number;
  valueRating?: number;
  professionalismRating?: number;

  // For guides rating agencies
  paymentSpeedRating?: number;
  trustRating?: number;
  clarityRating?: number;
  supportRating?: number;

  // Overall
  overallRating: number;

  // Content
  title: string;
  comment: string;

  // Moderation
  status: ReviewStatus;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: string;

  // Report
  reportedAt?: string;
  reportedBy?: string;
  reportReason?: string;

  // Metadata
  jobReference?: string;
  bookingReference?: string;
  locale: string;

  createdAt: string;
  updatedAt: string;
};

export type ReviewWithProfiles = Review & {
  reviewerName: string;
  reviewerAvatarUrl?: string;
  revieweeName: string;
  revieweeAvatarUrl?: string;
};

export type ProfileRatings = {
  revieweeId: string;
  totalReviews: number;
  avgOverallRating: number;

  // For guides
  avgServiceRating?: number | null;
  avgCommunicationRating?: number | null;
  avgValueRating?: number | null;
  avgProfessionalismRating?: number | null;

  // For agencies
  avgPaymentSpeedRating?: number | null;
  avgTrustRating?: number | null;
  avgClarityRating?: number | null;
  avgSupportRating?: number | null;

  latestReviewDate?: string;
};

export type ReviewSubmission = {
  revieweeId: string;
  revieweeType: RevieweeType;

  // Ratings based on reviewer type
  serviceRating?: number;
  communicationRating?: number;
  valueRating?: number;
  professionalismRating?: number;

  paymentSpeedRating?: number;
  trustRating?: number;
  clarityRating?: number;
  supportRating?: number;

  overallRating: number;

  title: string;
  comment: string;

  jobReference?: string;
  bookingReference?: string;
  locale?: string;
};

export type ReviewFilters = {
  revieweeId?: string;
  reviewerId?: string;
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  offset?: number;
};


export type ReviewResponse = {
  id: string;
  reviewId: string;
  responderId: string;
  response: string;
  createdAt: string;
  updatedAt?: string;
};
