// Project images and videos. Put the file in public/ (for example public/projects/my-app.png),
// then set its path in src/lib/site.ts: media: { key: "projects/my-app.png", kind: "image", alt: "..." }.

/** A path inside public/: letters, digits, dots, dashes, underscores and slashes, with an image or video extension. */
const KEY = /^(?!\/)(?!.*\.\.)[\w./-]+\.(png|jpe?g|gif|webp|avif|svg|mp4|webm)$/i;

export const isMediaKey = (key: string) => KEY.test(key);

export const isVideoKey = (key: string) => /\.(mp4|webm)$/i.test(key);

/** The URL of a file in public/, under the site's base path ("/" or "/<repo>/"). */
export const mediaUrl = (key: string, base: string = import.meta.env.BASE_URL ?? "/") => `${base.replace(/\/?$/, "/")}${key}`;
