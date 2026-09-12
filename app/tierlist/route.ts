import {
  parseTierlistSearchParams,
  renderTierlist,
  TierlistInputError,
} from "@/lib/tierlist";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const model = parseTierlistSearchParams(url.searchParams);
    const svg = renderTierlist(model);

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof TierlistInputError) {
      return Response.json(
        {
          error: error.code,
          message: error.message,
          field: error.field,
        },
        { status: error.status },
      );
    }

    return Response.json(
      {
        error: "internal_error",
        message: "unable to generate tierlist",
      },
      { status: 500 },
    );
  }
}
