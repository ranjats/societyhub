import { Building2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 animate-pulse">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    </div>
  );
}
