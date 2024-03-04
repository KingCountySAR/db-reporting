'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { FaChalkboardUser, FaMountain } from "react-icons/fa6";

const links = [
  { label: 'Missions', href: '/missions', icon: FaMountain },
  { label: 'Training', href: '/training', icon: FaChalkboardUser },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
    {links.map(l => {
      const LinkIcon = l.icon;
      return (
        <li key={l.href}>
          <Link href={l.href} className={clsx({ 'active': pathname.startsWith(l.href) })}>
            <LinkIcon />
            {l.label}
          </Link>
        </li>
      )
    })}
    </>
  );
}