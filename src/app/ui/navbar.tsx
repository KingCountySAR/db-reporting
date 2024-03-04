import Image from "next/image";
import { FaRegCircleUser } from "react-icons/fa6";
import { FaCircleUser } from "react-icons/fa6";

import { auth, signIn, signOut } from "auth";
import { User } from "next-auth";

const LoginButton = () => (<form action={async () => {
  'use server';
  await signIn();
}}>
  <button className="btn btn-ghost hover:text-secondary"><FaRegCircleUser size={24} /> Login</button>
</form>);

const UserMenu = ({ user }: { user: User }) => (
  <div className="dropdown dropdown-end">
    <button className="btn btn-square btn-ghost">
      <FaCircleUser size={24} />
    </button>

    <ul tabIndex={0} className="dropdown-content menu z-[1] bg-base-300 text-base-content rounded-box shadow w-56 gap-2">
      <li>
        <a className="flex" title="View profile">
          <div className="flex flex-col">
            <h3 className="font-bold">{user.name}</h3>
            <span className="text-xs text-primary">{user.email}</span>
          </div>
        </a>
      </li>
      <div className="divider my-0"></div>
      <li>Profile</li>
      <form className="flex flex-col items-stretch" action={async () => {
        'use server';
        await signOut();
      }}>
        <button className="btn btn-sm btn-secondary" type="submit">Log out</button>
      </form>
    </ul>
  </div>
)

export const NavBar = async () => {
  const session = await auth();

  return (
    <nav className="navbar justify-between bg-primary text-primary-content shadow-lg">
      <div className="text-lg">
        <Image alt="Logo" src="/logo.png" width={86} height={73} className="w-14 mx-3" />
        King County Search and Rescue
      </div>
      {session?.user ? <UserMenu user={session.user} /> : <LoginButton />}
    </nav>
  )
}