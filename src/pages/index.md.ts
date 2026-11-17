import { homeContributions } from "@/data/contributions";
import { getContent } from "@/lib/content";
import { homeMarkdown } from "@/lib/markdown";

// The home page as markdown for readers and agents. Built once at deploy time, like the home page.
export async function GET() {
  return new Response(homeMarkdown(getContent(), await homeContributions()), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
