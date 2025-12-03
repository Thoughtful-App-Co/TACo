import { Show } from 'solid-js';
import { Badge } from '../../ui/badge';
import { Clock } from 'phosphor-solid';
import { DifficultyLevel } from '../../lib/types';
import { calculatePomodoros, getDifficultyEmoji } from '../services/badge-utils';
import { tempoDesign } from '../../theme/tempo-design';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  duration: number;
  showPomodoro?: boolean;
  className?: string; // Kept for compatibility but unused with inline styles
}

/**
 * A compact badge component that displays task complexity level with tooltip
 * - Shows only complexity indicator (dots) by default
 * - Displays full information including pomodoro count on hover
 */
export const DifficultyBadge = (props: DifficultyBadgeProps) => {
  const pomodoros = () => calculatePomodoros(props.duration);
  const complexitySymbol = () => getDifficultyEmoji(props.difficulty);

  // Colors based on difficulty level
  const difficultyColors = {
    low: tempoDesign.colors.frog, // Using frog green for low
    medium: tempoDesign.colors.amber[600],
    high: tempoDesign.colors.destructive,
  };

  // Get descriptive text for difficulty level
  const getDifficultyText = (level: DifficultyLevel): string => {
    switch (level) {
      case 'low':
        return 'Low complexity';
      case 'medium':
        return 'Medium complexity';
      case 'high':
        return 'High complexity';
      default:
        return 'Complexity';
    }
  };

  return (
    <Badge
      variant="outline"
      style={{
        'font-size': tempoDesign.typography.sizes.xs,
        padding: '0 6px',
        height: '20px',
        display: 'flex',
        'align-items': 'center',
        color: difficultyColors[props.difficulty] || tempoDesign.colors.foreground,
        'border-color': difficultyColors[props.difficulty] || tempoDesign.colors.border,
      }}
      title={`${getDifficultyText(props.difficulty)}${(props.showPomodoro ?? true) && props.duration > 0 ? ` - ${pomodoros()} ${pomodoros() === 1 ? 'pomodoro' : 'pomodoros'} (${props.duration} mins)` : ''}`}
    >
      <span style={{ 'font-weight': tempoDesign.typography.weights.medium }}>
        {complexitySymbol()}
      </span>
    </Badge>
  );
};
