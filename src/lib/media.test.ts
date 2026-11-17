import { describe, expect, it } from "vitest";
import { isMediaKey, isVideoKey, mediaUrl } from "./media";

describe("isMediaKey", () => {
  it("takes an image or video path inside public/", () => {
    expect(isMediaKey("projects/app.png")).toBe(true);
    expect(isMediaKey("demo.webm")).toBe(true);
    expect(isMediaKey("a/b/c-1_2.JPG")).toBe(true);
  });

  it("refuses an absolute path, a parent path or another file type", () => {
    expect(isMediaKey("/projects/app.png")).toBe(false);
    expect(isMediaKey("../secret.png")).toBe(false);
    expect(isMediaKey("projects/app.html")).toBe(false);
    expect(isMediaKey("https://example.com/a.png")).toBe(false);
  });
});

describe("isVideoKey", () => {
  it("knows a video by its extension", () => {
    expect(isVideoKey("a.mp4")).toBe(true);
    expect(isVideoKey("a.webm")).toBe(true);
    expect(isVideoKey("a.png")).toBe(false);
  });
});

describe("mediaUrl", () => {
  it("puts the path under the base of a user site or a project site", () => {
    expect(mediaUrl("projects/app.png", "/")).toBe("/projects/app.png");
    expect(mediaUrl("projects/app.png", "/my-site")).toBe("/my-site/projects/app.png");
    expect(mediaUrl("projects/app.png", "/my-site/")).toBe("/my-site/projects/app.png");
  });
});
