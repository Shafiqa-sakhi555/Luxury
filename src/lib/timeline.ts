export type TimelineImagePlacement = "before" | "after";

export type TimelineEntry = {
  year: string;
  title: string;
  description: string;
  image?: string;
  imagePlacement?: TimelineImagePlacement;
};

const timelinePhoto = (filename: string) =>
  `/images/timeline/${filename}`;

/** Homepage milestone timeline */
export const homeTimeline: TimelineEntry[] = [
  {
    year: "2005",
    title: "Jalal Carpets Founded",
    description:
      "First independent venture in Kashrot, Gilgit — specializing in rugs and carpets.",
    image: timelinePhoto("Jalal Carpets Founded.jpeg"),
    imagePlacement: "after",
  },
  {
    year: "2010s",
    title: "Pak Turk Carpets",
    description:
      "Expanded to Jutial with premium Turkish rugs and international partnerships.",
    image: timelinePhoto("Pak Turk Carpets.jpeg"),
    imagePlacement: "before",
  },
  {
    year: "2020",
    title: "Jalal Home Solution",
    description:
      "Flagship showroom opened in Gilgit — full home furnishing range.",
    image: timelinePhoto("Jalal Home Solution.jpeg"),
    imagePlacement: "after",
  },
  {
    year: "2026",
    title: "Digital Storefront",
    description:
      "1,000+ products across 13 categories with online customization.",
  },
];

/** Resolve timeline photo + placement for about-page milestone titles */
export function resolveTimelineMedia(title: string, index: number): {
  image?: string;
  imagePlacement?: TimelineImagePlacement;
} {
  if (title.includes("Jalal Carpets Founded")) {
    return { image: timelinePhoto("Jalal Carpets Founded.jpeg"), imagePlacement: "after" };
  }
  if (title.includes("Pak Turk")) {
    return { image: timelinePhoto("Pak Turk Carpets.jpeg"), imagePlacement: "before" };
  }
  if (title.includes("Jalal Home Solution")) {
    return { image: timelinePhoto("Jalal Home Solution.jpeg"), imagePlacement: "after" };
  }
  return {};
}
