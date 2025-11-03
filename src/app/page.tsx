import FileUpload from "@/Components/FileUpload";
import { ModeToggle } from "@/Components/modeToggle";
import Chatbot from "@/Components/Chatbot";

export default function Home() {
  return (
    <div className="flex min-h-screen w-screen ">
      <ModeToggle />
      <div className="w-[30vw] min-h-screen ">
        <FileUpload />
      </div>
      <div className="w-[70vw] min-h-screen border-l-2">
        <Chatbot />
      </div>
    </div>
  );
}
