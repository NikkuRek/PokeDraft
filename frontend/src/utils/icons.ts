export type IconName =
  | 'pokeball'
  | 'leagues'
  | 'draft'
  | 'rosters'
  | 'matches'
  | 'leaderboard'
  | 'search'
  | 'undo'
  | 'plus'
  | 'user'
  | 'copy'
  | 'swap'
  | 'bolt'
  | 'edit'
  | 'check'
  | 'clock'
  | 'alert'
  | 'close'
  | 'sliders'
  | 'info'
  | 'external'
  | 'logout'
  | 'book'
  | 'sparkle'
  | 'volume'
  | 'download'
  | 'chevronLeft'
  | 'chevronRight';

const SVG_PATHS: Record<IconName, string> = {
  pokeball:
    '<circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="3" />',
  leagues:
    '<path d="M6 4h12v5a6 6 0 0 1-12 0V4z" /><path d="M6 6H3v2a3 3 0 0 0 3 3" /><path d="M18 6h3v2a3 3 0 0 1-3 3" /><path d="M12 15v5" /><path d="M8 20h8" />',
  draft:
    '<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />',
  rosters:
    '<path d="M12 3l7 3v5c0 4.8-3 8.6-7 10-4-1.4-7-5.2-7-10V6l7-3z" /><path d="M9.5 12l2 2 3.5-4" />',
  matches:
    '<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2" />',
  leaderboard:
    '<path d="M4 20h16" /><rect x="5" y="12" width="4" height="8" rx="1" /><rect x="10" y="6" width="4" height="14" rx="1" /><rect x="15" y="10" width="4" height="10" rx="1" />',
  search:
    '<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" />',
  undo:
    '<path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 1 1 0 12h-3" />',
  plus:
    '<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />',
  user:
    '<circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" />',
  copy:
    '<rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />',
  swap:
    '<path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" />',
  bolt:
    '<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2" />',
  edit:
    '<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />',
  check:
    '<polyline points="20 6 9 17 4 12" />',
  clock:
    '<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />',
  alert:
    '<circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />',
  close:
    '<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />',
  sliders:
    '<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />',
  info:
    '<circle cx="12" cy="12" r="9" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />',
  external:
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />',
  book:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />',
  sparkle:
    '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />',
  volume:
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a8.5 8.5 0 0 1 0 12" />',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />',
  chevronLeft: '<polyline points="15 18 9 12 15 6" />',
  chevronRight: '<polyline points="9 18 15 12 9 6" />'
};

export function icon(name: IconName, className = 'icon-svg'): string {
  const path = SVG_PATHS[name] || SVG_PATHS.info;
  return `<svg class="${className}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
