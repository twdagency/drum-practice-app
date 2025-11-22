/**
 * Utility functions for formatting subdivision text
 */

export function getSubdivisionText(subdivision: number): string {
  switch (subdivision) {
    case 4:
      return '4th';
    case 8:
      return '8th';
    case 12:
      return '8th (triplets)'; // 8th note triplets - subdivision 12 means triplets of 8th notes
    case 16:
      return '16th';
    case 24:
      return '16th (sextuplets)'; // 16th note sextuplets - subdivision 24 means sextuplets of 16th notes
    case 32:
      return '32nd';
    default:
      return `${subdivision}th`;
  }
}

export function getSubdivisionTextWithSuffix(subdivision: number): string {
  switch (subdivision) {
    case 4:
      return 'Quarter notes';
    case 8:
      return 'Eighth notes';
    case 12:
      return 'Eighth note triplets'; // Subdivision 12 = triplets (3 notes per 8th note beat)
    case 16:
      return 'Sixteenth notes';
    case 24:
      return 'Sixteenth note sextuplets'; // Subdivision 24 = sextuplets (6 notes per 16th note beat)
    case 32:
      return 'Thirty-second notes'; // Commonly called "32nd notes"
    default:
      return `${subdivision}th notes`;
  }
}

