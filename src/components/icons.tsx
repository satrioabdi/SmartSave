/** Inline stroke icons — 16px grid, currentColor. */
import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

type P = SVGProps<SVGSVGElement>;

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconBox = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </svg>
);

export const IconBarcode = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6v12M7.5 6v12M11 6v9M14.5 6v12M18 6v12M20.5 6v9" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5z" />
    <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const IconGift = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11h16v9H4z" />
    <path d="M3 7.5h18V11H3zM12 7.5V20" />
    <path d="M12 7.5S10.5 4 8.5 4a2 2 0 0 0 0 3.5zM12 7.5S13.5 4 15.5 4a2 2 0 0 1 0 3.5z" />
  </svg>
);

export const IconHistory = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4h4" />
    <path d="M12 8v4.5l3 1.8" />
  </svg>
);

export const IconHand = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.6a5 5 0 0 1-4-2l-2.6-3.4a1.6 1.6 0 0 1 2.3-2.2L8 13.5" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
  </svg>
);

export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
  </svg>
);

export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 8.5 4.5L12 12 3.5 7.5z" />
    <path d="m4 12.5 8 4.2 8-4.2M4 16.8l8 4.2 8-4.2" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 16v-4M12.5 16V7.5M17 16v-6" />
  </svg>
);

export const IconLeaf = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 19c0-8 5-13 14-14 1 9-3.5 14-10 14H5z" />
    <path d="M5 19c3-4 6-6.5 10-8" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.5 21 19H3z" />
    <path d="M12 10v4M12 16.6h.01" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8.4h.01" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const IconPrint = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8.5V4h10v4.5" />
    <path d="M5 8.5h14a2 2 0 0 1 2 2V16h-4v4H7v-4H3v-5.5a2 2 0 0 1 2-2z" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10" />
    <path d="m8 11 4 4 4-4" />
    <path d="M5 19h14" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19c1-3 3-4.5 5.5-4.5S13.5 16 14.5 19" />
    <path d="M16 6.2a3.2 3.2 0 0 1 0 6M17.5 14.8c2 .7 3.3 2.1 4 4.2" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
    <path d="M20 4v4.5h-4.5" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
    <path d="M4 20v-4.5h4.5" />
  </svg>
);

export const IconFile = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 3.5h7L18 8v12.5H6.5z" />
    <path d="M13.5 3.5V8H18" />
  </svg>
);
