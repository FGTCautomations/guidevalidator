export type DirectorySegment = "guides" | "agencies" | "dmcs" | "transport";

export type DirectoryListing = {
  id: string;
  name: string;
  headline?: string;
  location: string;
  countryCode?: string | null;
  regionId?: string | null;
  cityId?: string | null;
  city?: string | null;
  rating?: number;
  reviewsCount?: number;
  languages?: string[];
  specialties?: string[];
  tags?: string[];
  verified?: boolean;
  licenseVerified?: boolean;
  licenseRequired?: boolean;
  licenseAuthorityUrl?: string;
  hasLiabilityInsurance?: boolean;
  childFriendly?: boolean;
  gender?: string | null;
  hourlyRateCents?: number | null;
  hourlyRate?: number | null;
  currency?: string | null;
  responseTimeMinutes?: number | null;
  featuredScore?: number;
  isFeatured?: boolean;
  isActivated?: boolean;
  href: string;
  avatarUrl?: string;
  role?: string; // guide, transport, etc.
  // Review system fields
  avgOverallRating?: number | null;
  totalReviews?: number;
  // Profile completion tracking
  profileCompleted?: boolean;
  profileCompletionPercentage?: number;
};

export type DirectorySortKey = "featured" | "rating" | "response_time";

export type DirectoryFilters = {
  country?: string;
  region?: string;
  regionId?: string;
  city?: string;
  cityId?: string;
  languages?: string[];
  specialties?: string[];
  genders?: string[];
  verifiedOnly?: boolean;
  licenseVerifiedOnly?: boolean;
  insuredOnly?: boolean;
  childFriendlyOnly?: boolean;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  sort?: DirectorySortKey;
  availableFrom?: string; // Date string in YYYY-MM-DD format
  availableTo?: string; // Date string in YYYY-MM-DD format
  search?: string; // Text search for name or license number
  letter?: string; // Filter by first letter of name (A-Z)
};
