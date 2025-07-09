export const formatAccuracy = (accuracy: number): string => {
  return `${accuracy.toFixed(1)}%`;
};

export const formatTime = (time: number): string => {
  if (time < 60) {
    return `${time.toFixed(1)}s`;
  }
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}m ${seconds.toFixed(1)}s`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatScore = (score: number, totalPossible: number): string => {
  return `${score}/${totalPossible}`;
};

export const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 90) return '#0677C9'; // High - College Board blue
  if (accuracy >= 70) return '#5a9bd4'; // Medium - lighter blue
  return '#8bb3d9'; // Low - lightest blue
}; 