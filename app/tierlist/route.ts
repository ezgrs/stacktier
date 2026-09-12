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
          error: error.issues.length > 1 ? "validation_error" : error.code,
          message:
            error.issues.length > 1
              ? `request contains ${error.issues.length} validation errors`
              : error.message,
          field: error.field,
          errors: error.issues.map((issue) => ({
            error: issue.code,
            message: issue.message,
            field: issue.field,
          })),
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
