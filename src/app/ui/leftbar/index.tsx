import { auth } from "auth";
import NavLinks from "./navLinks";

export const LeftBar = async () => {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <aside className="flex flex-col grow-0 shrink-0 items-center sticky top-0 overflow-y-auto space-y-4 py-1 px-0 bg-base-300 shadow">
      <ul className="menu menu-lg">
        <NavLinks />
      </ul>
    </aside>
  );
}