import { Show } from "solid-js";
import { Badge } from "../../ui/badge";
import { Clock } from "phosphor-solid";
import { DifficultyLevel } from "../../lib/types";
import { calculatePomodoros, getDifficultyEmoji } from "../services/badge-utils";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "../../ui/tooltip";

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  duration: number;
  showPomodoro?: boolean;
  className?: string;
}

/**
 * A compact badge component that displays task complexity level with tooltip
 * - Shows only complexity indicator (dots) by default
 * - Displays full information including pomodoro count on hover
 */
export const DifficultyBadge = (props: DifficultyBadgeProps) => {
  const pomodoros = () => calculatePomodoros(props.duration);
  const complexitySymbol = () => getDifficultyEmoji(props.difficulty);
  
  // Classes based on difficulty level
  const difficultyClasses = {
    low: "text-green-600",
    medium: "text-amber-600",
    high: "text-red-600"
  };

  // Get descriptive text for difficulty level
  const getDifficultyText = (level: DifficultyLevel): string => {
    switch(level) {
      case 'low': return 'Low complexity';
      case 'medium': return 'Medium complexity';
      case 'high': return 'High complexity';
      default: return 'Complexity';
    }
  };
  
  return (
    <Badge 
      variant="outline" 
      class={`text-xs px-1.5 py-0 h-5 flex items-center ${difficultyClasses[props.difficulty] || ""} ${props.className || ""}`}
      title={`${getDifficultyText(props.difficulty)}${(props.showPomodoro ?? true) && props.duration > 0 ? ` - ${pomodoros()} ${pomodoros() === 1 ? "pomodoro" : "pomodoros"} (${props.duration} mins)` : ''}`}
    >
      <span class="font-medium">{complexitySymbol()}</span>
    </Badge>
  );
};
