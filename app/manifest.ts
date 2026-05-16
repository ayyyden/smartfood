import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Smartfood",
    short_name:       "Smartfood",
    description:      "Smart calorie tracking, naturally",
    start_url:        "/",
    display:          "standalone",
    orientation:      "portrait",
    background_color: "#0a0a0a",
    theme_color:      "#00d2ff",
    icons: [
      {
        src:     "/apple-icon",
        sizes:   "180x180",
        type:    "image/png",
        purpose: "any",
      },
      {
        src:     "/icon/favicon",
        sizes:   "64x64",
        type:    "image/png",
        purpose: "any",
      },
      {
        src:     "/icon/w192",
        sizes:   "192x192",
        type:    "image/png",
        purpose: "maskable",
      },
      {
        src:     "/icon/w512",
        sizes:   "512x512",
        type:    "image/png",
        purpose: "maskable",
      },
    ],
  };
}
