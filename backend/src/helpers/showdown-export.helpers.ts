import { IRosterEntry } from '../interfaces/index.js';

export const exportToShowdownFormat = (teamName: string, roster: IRosterEntry[]): string => {
  let output = `=== [gen9draft] ${teamName} ===\n\n`;

  for (const entry of roster) {
    if (!entry.Pokemon) continue;
    const poke = entry.Pokemon;
    output += `${poke.name} @ Leftovers\n`;
    output += `Ability: Pressure\n`;
    output += `Tera Type: ${poke.type1}\n`;
    output += `EVs: 252 HP / 252 Atk / 4 Spe\n`;
    output += `Adamant Nature\n`;
    output += `- Move 1\n`;
    output += `- Move 2\n`;
    output += `- Move 3\n`;
    output += `- Move 4\n\n`;
  }

  return output.trim();
};
