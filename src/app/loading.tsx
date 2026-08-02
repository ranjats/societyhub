import { Building2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <div className="text-center relative z-10">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="absolute -inset-3 rounded-2xl bg-primary/25 blur-2xl animate-pulse-soft" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow">
            <Building2 className="w-8 h-8" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/20 border-t-primary" />
          Loading SocietyHub...
        </div>
      </div>
    </div>
  );
}
