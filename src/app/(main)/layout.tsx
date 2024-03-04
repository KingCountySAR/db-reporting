import { LeftBar } from "../ui/leftbar";
import { NavBar } from "../ui/navbar"

export default function MainLayout({children}: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="flex grow">
        <LeftBar />
        <main className="p-4 overflow-auto flex flex-col grow">
          {children}
        </main>
      </div>
    </>
  );
}
