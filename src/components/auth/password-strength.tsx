import { passwordStrength } from "@/lib/auth-schema";
import { cn } from "@/lib/utils";

const LABELS = ["Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-destructive", "bg-warning", "bg-info", "bg-success"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordStrength(password);
  const level = Math.max(1, score);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full bg-muted transition-colors",
              i < level && COLORS[level - 1]
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{LABELS[level - 1]} password</p>
    </div>
  );
}
