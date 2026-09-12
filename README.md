# Tierlist Gen

Gerador de tierlists em SVG a partir de parâmetros na URL.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra <http://localhost:3000> para usar o preview ou acesse diretamente:

```text
/tierlist?tier=FF0000;Pro;python,postgres,java&tier=FFD43B;Good;javascript,typescript&theme=dark&width=1200&labels=1
```

O endpoint retorna `image/svg+xml`. Os parâmetros `tier` são repetíveis e usam
o formato `RRGGBB;Título;slug1,slug2`. `theme` aceita `light` ou `dark`,
`width` aceita valores entre 320 e 2400, `labels` aceita `0` ou `1`, e
`padding` define o padding interno comum dos títulos dos tiers, entre 4 e 32
pixels. O padrão de `padding` é 16. `fontSize` define o tamanho comum da fonte
dos títulos, entre 10 e 32 pixels, com padrão 20. O mesmo `padding` também
controla o tamanho dos quadrados dos ícones, sem adicionar espaço entre eles.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## Simple Icons

Os SVGs são embutidos a partir da versão fixada do pacote `simple-icons`, sem
requisições externas durante a renderização. As licenças dos ícones podem
variar individualmente; consulte o disclaimer do projeto antes de distribuir
as imagens em um produto.
