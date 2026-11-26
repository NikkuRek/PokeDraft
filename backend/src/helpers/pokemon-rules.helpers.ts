export function isMegaPokemonName(name: string): boolean {
  const n = (name || '').toLowerCase().trim();
  if (!n) return false;
  return /(^|[\s-])mega($|[\s-])/.test(n) || /(^|[\s-])primal($|[\s-])/.test(n);
}

export function formatShowdownSpeciesName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  if (isMegaPokemonName(trimmed)) {
    return trimmed.replace(/\s+/g, '-');
  }
  return trimmed;
}

export function validateRosterSpecialLimits(
  entries: Array<{ is_mega?: boolean; is_z_user?: boolean; is_tera_captain?: boolean }>,
  league: { max_megas?: number; max_z_crystals?: number; max_tera_captains?: number }
): void {
  const maxMegas = league.max_megas ?? 1;
  const maxZCrystals = league.max_z_crystals ?? 1;
  const maxTera = league.max_tera_captains ?? 0;

  let megaCount = 0;
  let zCount = 0;
  let teraCount = 0;

  for (const e of entries) {
    if (e.is_mega) megaCount += 1;
    if (e.is_z_user) zCount += 1;
    if (e.is_tera_captain) teraCount += 1;
  }

  if (megaCount > maxMegas) {
    throw {
      statusCode: 400,
      message: `Límite de Mega Evoluciones excedido (${megaCount}/${maxMegas} permitidas en esta liga).`
    };
  }
  if (zCount > maxZCrystals) {
    throw {
      statusCode: 400,
      message: `Límite de Cristales Z excedido (${zCount}/${maxZCrystals} permitidos en esta liga).`
    };
  }
  if (teraCount > maxTera) {
    throw {
      statusCode: 400,
      message: `Límite de Tera Captains excedido (${teraCount}/${maxTera} permitidos en esta liga).`
    };
  }
}
