import Sidebar from "@/Components/Sidebar";
import { ModeToggle } from "@/Components/modeToggle";
import Chatbot from "@/Components/Chatbot";
import { DotPattern } from "@/Components/magicui/dot-pattern";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-950">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative">
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            "opacity-50 dark:opacity-30"
          )}
        />
        <div className="absolute top-4 right-4 z-[100]">
          <ModeToggle />
        </div>
        <Chatbot />
      </div>
    </div>
  );
}
