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
      { src: "/icon",       sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
