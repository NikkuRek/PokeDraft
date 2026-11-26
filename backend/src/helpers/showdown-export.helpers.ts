import { IRosterEntry } from '../interfaces/index.js';
import { formatShowdownSpeciesName } from './pokemon-rules.helpers.js';

export const exportToShowdownFormat = (
  teamName: string,
  roster: IRosterEntry[],
  league?: { format_name?: string; max_megas?: number; max_tera_captains?: number }
): string => {
  const isNatDex =
    (league?.format_name || '').toLowerCase().includes('natdex') || (league?.max_megas ?? 1) > 0;
  const formatSlug = isNatDex ? 'gen9nationaldexdraft' : 'gen9draft';
  const teraEnabled = (league?.max_tera_captains ?? 0) > 0;

  let output = `=== [${formatSlug}] ${teamName} ===\n\n`;

  for (const entry of roster) {
    if (!entry.Pokemon) continue;
    const poke = entry.Pokemon;
    const speciesName = formatShowdownSpeciesName(poke.name);
    const noteTags: string[] = [];
    if (entry.is_mega) noteTags.push('Mega');
    if (entry.is_z_user) noteTags.push('Cristal Z');
    if (entry.is_tera_captain) noteTags.push('Tera Captain');

    if (noteTags.length > 0) {
      output += `// [${noteTags.join(' · ')}]\n`;
    }
    output += `${speciesName} @ ${entry.is_z_user ? 'Normalium Z' : 'Leftovers'}\n`;
    output += `Ability: Pressure\n`;
    if (teraEnabled && entry.is_tera_captain) {
      output += `Tera Type: ${poke.type1}\n`;
    }
    output += `EVs: 252 HP / 252 Atk / 4 Spe\n`;
    output += `Adamant Nature\n`;
    output += `- Move 1\n`;
    output += `- Move 2\n`;
    output += `- Move 3\n`;
    output += `- Move 4\n\n`;
  }

  return output.trim();
};
