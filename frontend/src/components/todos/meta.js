import { Circle, CircleCheck, CircleDot, SignalHigh, SignalLow, SignalMedium, TriangleAlert } from "lucide-react";

export const STATUS = {
  todo: { label: "To do", icon: Circle, tone: "default" },
  in_progress: { label: "In progress", icon: CircleDot, tone: "accent" },
  done: { label: "Done", icon: CircleCheck, tone: "success" },
};

export const PRIORITY = {
  urgent: { label: "Urgent", icon: TriangleAlert, tone: "danger", rank: 0 },
  high: { label: "High", icon: SignalHigh, tone: "warning", rank: 1 },
  medium: { label: "Medium", icon: SignalMedium, tone: "default", rank: 2 },
  low: { label: "Low", icon: SignalLow, tone: "default", rank: 3 },
};
