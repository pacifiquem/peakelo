const THEME_PHRASES: Array<{ theme: string; pattern: RegExp }> = [
  { theme: 'hanging piece', pattern: /\bhanging pieces?\b/i },
  { theme: 'king hunt', pattern: /\bking hunt\b/i },
  { theme: 'back rank', pattern: /\bback[- ]rank\b/i },
  { theme: 'discovered attack', pattern: /\bdiscovered attack\b/i },
  { theme: 'discovered check', pattern: /\bdiscovered check\b/i },
  { theme: 'double check', pattern: /\bdouble check\b/i },
  { theme: 'zwischenzug', pattern: /\bzwischenzug\b/i },
  { theme: 'intermezzo', pattern: /\bintermezzo\b/i },
  { theme: 'passed pawn', pattern: /\bpassed pawns?\b/i },
  { theme: 'isolated pawn', pattern: /\bisolated pawns?\b/i },
  { theme: 'doubled pawn', pattern: /\bdoubled pawns?\b/i },
  { theme: 'backward pawn', pattern: /\bbackward pawns?\b/i },
  { theme: 'hanging pawns', pattern: /\bhanging pawns\b/i },
  { theme: 'en passant', pattern: /\ben passant\b/i },
  { theme: 'checkmate', pattern: /\bcheckmates?\b/i },
  { theme: 'stalemate', pattern: /\bstalemates?\b/i },
  { theme: 'zugzwang', pattern: /\bzugzwang\b/i },
  { theme: 'bad bishop', pattern: /\bbad bishops?\b/i },
  { theme: 'opposite-colored bishops', pattern: /\bopposite[- ]colou?red bishops\b/i },
  { theme: 'sacrifice', pattern: /\b(?:a |the |piece )?sacrifices?\b/i },
  { theme: 'the pin', pattern: /\b(?:the |a )pin(?:ned|ning)?\b/i },
  { theme: 'a fork', pattern: /\b(?:the |a )fork(?:ed|ing|s)?\b/i },
  { theme: 'a skewer', pattern: /\b(?:the |a )skewer(?:ed|ing|s)?\b/i },
];

export function extractThemes(quote: string): string[] | undefined {
  const found: string[] = [];
  for (const { theme, pattern } of THEME_PHRASES) {
    if (pattern.test(quote)) found.push(theme);
  }
  return found.length > 0 ? found : undefined;
}
