# stacktier

This is a small Next.js app for making technology tier lists from URL
parameters. I made it mainly for putting a simple skills snapshot in a GitHub
README. The deployed preview is at
<https://stacktier-production.up.railway.app/>.

## Quick start

### Requirements

- Node.js 22 or a compatible Node.js runtime.
- npm.

### Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000> for the interactive preview. The SVG endpoint is
available at:

```text
http://localhost:3000/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&tier=FFD43B%3BGood%3Bjavascript%2Ctypescript&theme=dark&width=1200&labels=1
```

### Run with Docker

The Dockerfile uses a multi-stage build and Next.js standalone output. The
final image contains the production runtime and the files needed to serve the
application.

```bash
docker build -t stacktier .
docker run --rm -p 3000:3000 stacktier
```

Then open <http://localhost:3000> or request an SVG from
<http://localhost:3000/tierlist?tier=FF0000%3BPro%3Bpython>.

## API

### `GET /tierlist`

The `tier` parameter is required and repeatable. Each value follows this
format:

```text
RRGGBB;Title;slug1,slug2,slug3
```

For example:

```text
/tierlist?tier=FF0000;Pro;python,postgres,java&tier=FFD43B;Good;javascript,typescript&theme=dark&labels=1
```

For real links, URL-encode reserved characters:

```text
/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&tier=FFD43B%3BGood%3Bjavascript%2Ctypescript
```

#### Tier rules

- `RRGGBB` must contain exactly six hexadecimal digits, without `#`.
- Titles must contain between 1 and 48 characters.
- `;` separates the three tier fields and `,` separates icon slugs; both are
  reserved inside a title.
- Spaces and Unicode characters are supported through URL encoding, such as
  `Muito%20bom%20%E2%9C%A8`.
- The order of repeated `tier` parameters determines the visual tier order.
- The order of slugs determines the visual icon order.
- A request can contain up to 20 tiers and 64 icons per tier.

#### Optional parameters

| Parameter | Default | Accepted values | Description |
| --- | ---: | --- | --- |
| `theme` | `light` | `light`, `dark` | Background and auxiliary colors. |
| `width` | `1200` | `320`–`2400` | Horizontal layout budget used to choose wrapping. |
| `labels` | `1` | `0`, `1` | Show or hide icon names. |
| `maxIconsPerRow` | `9` | `1`–`64` | Maximum number of icons in a row. |
| `iconPadding` | `0` | `0`–`10` | Padding inside each icon viewBox; the drawing scales down to fit. |
| `iconSize` | `48` | `16`–`128` | Rendered side length of each icon square, in SVG pixels. |
| `iconFontSize` | `11` | `6`–`24` | Font size of the names below icons. |

`height`, `fontSize`, and `padding` are not URL parameters. The image height is
calculated from the number of rows and label lines. Tier title font sizes are
also calculated automatically so titles fit without distorting their glyphs.

`width` controls how many columns can fit when the layout is calculated. The
final SVG reserves `maxIconsPerRow` icon slots per row, even when the last row
contains fewer icons. This keeps the output width stable and avoids phantom
spacing caused by partial rows.

#### Icon slugs and aliases

Icons use canonical [Simple Icons](https://simpleicons.org) slugs. The aliases
currently supported are:

| Alias | Resolved slug |
| --- | --- |
| `postgres` | `postgresql` |
| `js` | `javascript` |
| `ts` | `typescript` |
| `py` | `python` |
| `golang` | `go` |
| `csharp` | `csharp` |
| `cpp` | `cplusplus` |

Unknown or malformed slugs are rejected before rendering. The endpoint does
not return a partially generated image.

#### Responses

Successful requests return:

```text
200 OK
Content-Type: image/svg+xml; charset=utf-8
```

Invalid input returns `400` with JSON:

```json
{
  "error": "validation_error",
  "message": "request contains 2 validation errors",
  "field": "theme",
  "errors": [
    {
      "error": "invalid_theme",
      "message": "theme must be either light or dark",
      "field": "theme"
    },
    {
      "error": "unknown_icon",
      "message": "unknown Simple Icons slug: does-not-exist",
      "field": "tier[0].icons[1]"
    }
  ]
}
```

The `errors` array contains every validation problem found in the request. The
top-level `field` points to the first one. For a single problem, the top-level
`error` and `message` use that problem directly. Unexpected failures return
`500` with `error: "internal_error"`.

## Embed stacktier in a GitHub README

The deployed endpoint is:

```text
https://stacktier-production.up.railway.app/tierlist
```

Use it as a remote Markdown image:

```md
![My technology proficiency](https://stacktier-production.up.railway.app/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&tier=FFD43B%3BGood%3Bjavascript%2Ctypescript&theme=dark&labels=0)
```

To make the image link back to stacktier:

```md
[![My technology proficiency](https://stacktier-production.up.railway.app/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&theme=dark&labels=0)](https://stacktier-production.up.railway.app/)
```

To follow the viewer's GitHub color scheme, use `<picture>`:

```html
<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://stacktier-production.up.railway.app/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&amp;theme=dark&amp;labels=0"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://stacktier-production.up.railway.app/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&amp;theme=light&amp;labels=0"
  />
  <img
    alt="My technology proficiency"
    src="https://stacktier-production.up.railway.app/tierlist?tier=FF0000%3BPro%3Bpython%2Cpostgres%2Cjava&amp;theme=light&amp;labels=0"
  />
</picture>
```

The endpoint must be publicly reachable over HTTPS for GitHub to load it.

## Add or update icons

Icons included in the pinned Simple Icons package can be used directly with
their canonical slug. Add a local icon when the upstream catalog does not have
the artwork you need or when an existing slug should be overridden.

Custom icons live in [lib/custom-icons.ts](lib/custom-icons.ts) and take
precedence over Simple Icons when they use the same slug. The Java icon is the
current example: it is maintained locally instead of relying on `openjdk`.

### Single-color icon

```ts
{
  title: "My Technology",
  slug: "my-technology",
  source: "local:custom-icons",
  path: "M...",
  hex: "336791",
}
```

### Multi-color icon

```ts
{
  title: "My Technology",
  slug: "my-technology",
  source: "local:custom-icons",
  paths: [
    { path: "M...", hex: "336791" },
    { path: "M...", hex: "F58219" },
  ],
}
```

### Custom viewBox

The default coordinate system is `0 0 24 24`. If the source artwork uses a
different coordinate system, declare it explicitly:

```ts
viewBox: { width: 32, height: 32 },
```

The `svg` field is generated automatically from the paths and colors. Do not
add a prebuilt SVG string. Every path must use coordinates compatible with the
declared viewBox, otherwise the artwork can appear clipped or misaligned.

### Adding an alias

If a short or commonly used name should resolve to an existing canonical slug,
add it to the `aliases` map in [lib/tierlist.ts](lib/tierlist.ts) and add a
parser test covering it. Avoid aliases that make two unrelated icons
ambiguous.

## Contributing

There is no separate contribution workflow yet. Make changes in a branch and
open a pull request.

1. Create a branch for the change.
2. Add or update the icon in `lib/custom-icons.ts`.
3. Add a test in `tests/tierlist.test.ts` for the slug, colors, viewBox, or
   rendering behavior that changed.
4. Update the README when the public URL contract changes.
5. Run the [development checks](#development-checks) before opening a pull
   request.

When adding artwork from a third-party source, verify its license and
attribution requirements before committing it. Keep paths local and avoid
adding external CDN dependencies to the renderer.

## Development checks

The parser validates every tier before rendering. The renderer is independent
of React and embeds SVG paths locally, so the generated image does not request
assets from a CDN or another external resource.

```bash
npm run typecheck
npm test
npm run build
```

The test suite covers parsing, aliases, validation errors, tier and icon order,
themes, labels, wrapping, dimensions, halos, custom viewBoxes, self-contained
SVG output, and layout calculations.

## Deployment

The current deployment runs on Railway. The public URL is listed in the
[GitHub README embedding section](#embed-stacktier-in-a-github-readme).

For another Node.js host, build the project and start the production server:

```bash
npm ci
npm run build
npm run start
```

The Dockerfile can be used on hosts that support container deployments.

## Licensing and third-party notices

SVGs from the catalog are embedded from the pinned `simple-icons` package, with
no external requests during rendering. See [NOTICE.md](NOTICE.md) for the
third-party notice.

Before distributing generated images commercially, review the icon metadata and
the [official Simple Icons disclaimer](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md),
because license and trademark requirements can vary between icons. The license
for stacktier itself should be defined separately before an official release.
