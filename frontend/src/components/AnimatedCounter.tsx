import { useCountUp } from "../hooks/useCountUp";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  start: boolean;
}

export function AnimatedCounter({ target, suffix = "", start }: AnimatedCounterProps) {
  const value = useCountUp(target, start);
  return (
    <strong>
      {value}
      {suffix}
    </strong>
  );
}
