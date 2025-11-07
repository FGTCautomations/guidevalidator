/**
 * Homepage Content
 * Centralized content for the new global homepage
 * Brand-compliant copy following the approved guidelines
 */

export const homeContent = {
  // Hero Section
  hero: {
    title: "Connecting Verified Tour Guides, DMCs & Travel Companies Worldwide",
    subtitle: "Discover verified tour guides, travel agencies, DMCs, and transportation partners — all in one place.",
    primaryCta: {
      text: "Explore Verified Partners",
      href: "/en/directory",
    },
  },

  // About Section
  about: {
    title: "The World's Trusted Marketplace for Verified Travel Professionals",
    description:
      "Guide Validator connects travel professionals through a global verification system that ensures safety, compliance, and quality standards. Every partner undergoes rigorous identity verification, credential validation, and compliance checks before joining our marketplace.",
    features: [
      {
        icon: "shield-check",
        title: "Verified Identity",
        description: "Multi-factor identity verification",
      },
      {
        icon: "award",
        title: "Credential Validation",
        description: "License and certification checks",
      },
      {
        icon: "globe",
        title: "Global Standards",
        description: "Compliance with local regulations",
      },
      {
        icon: "users",
        title: "Community Trust",
        description: "Peer reviews and ratings",
      },
    ],
  },

  // Stakeholder Cards
  stakeholders: [
    {
      id: "tour-guides",
      icon: "compass",
      title: "Tour Guides",
      benefits: [
        "Get discovered by global travel agencies and DMCs",
        "Showcase verified credentials and specialties",
        "Connect directly with potential clients",
      ],
      cta: {
        text: "Join as a Tour Guide",
        href: "/en/auth/sign-up/guide",
      },
    },
    {
      id: "travel-agencies",
      icon: "building-2",
      title: "Travel Agencies",
      benefits: [
        "Access vetted tour guides and local partners worldwide",
        "Streamline supplier verification processes",
        "Build trusted partnerships at scale",
      ],
      cta: {
        text: "Register Your Agency",
        href: "/en/auth/sign-up/agency",
      },
    },
    {
      id: "dmcs",
      icon: "map-pin",
      title: "DMCs",
      benefits: [
        "Expand your network of verified local experts",
        "Ensure compliance across all destinations",
        "Connect with agencies seeking ground services",
      ],
      cta: {
        text: "Partner as a DMC",
        href: "/en/auth/sign-up/dmc",
      },
    },
    {
      id: "transport",
      icon: "bus",
      title: "Transport Providers",
      benefits: [
        "List your fleet with verified credentials",
        "Connect with tour operators and agencies",
        "Demonstrate safety and licensing compliance",
      ],
      cta: {
        text: "Add Your Transport Company",
        href: "/en/auth/sign-up/transport",
      },
    },
  ],

  // How It Works
  howItWorks: {
    title: "How It Works",
    steps: [
      {
        number: 1,
        title: "Create Profile",
        description:
          "Sign up and create your professional profile with your credentials, services, and expertise.",
      },
      {
        number: 2,
        title: "Get Verified",
        description:
          "Complete our verification process including identity checks, credential validation, and compliance review.",
      },
      {
        number: 3,
        title: "Connect & Grow",
        description:
          "Start connecting with verified partners, showcase your services, and grow your travel business.",
      },
    ],
  },

  // Global CTA
  globalCta: {
    title: "Ready to Grow Your Travel Business — the Verified Way?",
    subtitle: "Join the world's fastest-growing network of trusted travel professionals.",
    buttons: [
      {
        text: "Join as a Tour Guide",
        href: "/en/auth/sign-up/guide",
        primary: true,
      },
      {
        text: "Register Your Travel Agency",
        href: "/en/auth/sign-up/agency",
        primary: true,
      },
      {
        text: "Add Your Transport Company",
        href: "/en/auth/sign-up/transport",
        primary: true,
      },
      {
        text: "Partner as a DMC",
        href: "/en/auth/sign-up/dmc",
        primary: true,
      },
    ],
  },

  // GEO Footer
  geoFooter: {
    text: "Connecting verified travel professionals in",
    countries: [
      "United States",
      "United Kingdom",
      "France",
      "Germany",
      "Spain",
      "Italy",
      "Japan",
      "Australia",
      "Thailand",
      "Vietnam",
      "India",
      "Brazil",
      "Mexico",
      "Canada",
      "South Africa",
      "United Arab Emirates",
      "Singapore",
      "Malaysia",
      "Philippines",
      "Indonesia",
      "Turkey",
      "Greece",
      "Portugal",
      "Netherlands",
      "Switzerland",
      "Austria",
      "Belgium",
      "Sweden",
      "Norway",
      "Denmark",
      "Finland",
      "Poland",
      "Czech Republic",
      "Hungary",
      "Romania",
      "Croatia",
      "Egypt",
      "Morocco",
      "Kenya",
      "Tanzania",
      "South Korea",
      "China",
      "Hong Kong",
      "Taiwan",
      "New Zealand",
      "Argentina",
      "Chile",
      "Peru",
      "Colombia",
      "Costa Rica",
    ],
  },
} as const;
