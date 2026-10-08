import { ICoach } from '../interfaces/index.js';

export interface ISnakePickTurn {
  overallPick: number;
  round: number;
  pickInRound: number;
  coachId: number;
  coachName: string;
  teamName: string;
  isCompleted: boolean;
}

export const calculateSnakeTurn = (
  overallPick: number,
  coaches: ICoach[]
): { coach: ICoach; round: number; pickInRound: number } => {
  const numCoaches = coaches.length;
  if (numCoaches === 0) {
    throw new Error('No hay entrenadores registrados en la liga.');
  }

  // Sort coaches by draft_order (1 to N)
  const sortedCoaches = [...coaches].sort((a, b) => a.draft_order - b.draft_order);

  // 1-indexed overallPick
  const round = Math.floor((overallPick - 1) / numCoaches) + 1;
  const pickInRound = ((overallPick - 1) % numCoaches) + 1;

  // In odd rounds: Order is 1 -> N (0 to numCoaches - 1)
  // In even rounds: Order is N -> 1 (numCoaches - 1 down to 0)
  const isOddRound = round % 2 === 1;
  const coachIndex = isOddRound ? pickInRound - 1 : numCoaches - pickInRound;

  return {
    coach: sortedCoaches[coachIndex],
    round,
    pickInRound
  };
};

export const generateDraftSchedule = (
  totalRounds: number,
  coaches: ICoach[],
  currentOverallPick: number
): ISnakePickTurn[] => {
  const schedule: ISnakePickTurn[] = [];
  const numCoaches = coaches.length;
  const totalPicks = totalRounds * numCoaches;

  for (let p = 1; p <= totalPicks; p++) {
    const { coach, round, pickInRound } = calculateSnakeTurn(p, coaches);
    schedule.push({
      overallPick: p,
      round,
      pickInRound,
      coachId: coach.id!,
      coachName: coach.name,
      teamName: coach.team_name,
      isCompleted: p < currentOverallPick
    });
  }

  return schedule;
};
