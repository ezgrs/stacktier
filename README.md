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
`width` aceita valores entre 320 e 2400 e controla a quebra de linhas. A largura
final do SVG reserva sempre `maxIconsPerRow` posições por linha, mesmo quando a
última linha tem menos ícones. `labels` aceita `0` ou `1`. O padding e o tamanho
da fonte dos títulos são calculados internamente; títulos longos reduzem a fonte
automaticamente para caber no rótulo. O padding interno dos ícones é controlado
separadamente por `iconPadding`, entre 0 e 10, com padrão 0.
`maxIconsPerRow` limita a quantidade de ícones por linha, com padrão 9 e
limite máximo de 64. `iconFontSize` define o tamanho dos nomes abaixo dos
ícones, entre 6 e 24 pixels, com padrão 11; o wrapping dos nomes acompanha esse
valor. `iconSize` define o lado do quadrado renderizado de cada ícone, entre 16
e 128 pixels, com padrão 48. O `viewBox` interno continua sendo `0 0 24 24`.

O rótulo colorido de cada tier acompanha a altura do próprio bloco de ícones.
Sua largura é compartilhada entre os tiers e os títulos reduzem a fonte quando
necessário para caber no espaço disponível; os ícones continuam sendo
quadrados.
Quando `labels=1`, os nomes dos ícones também ficam limitados à largura da
célula e quebram em linhas para não invadir o item vizinho.

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
