'use client';

import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col max-w-screen-sm">
      <div className="text-sm breadcrumbs">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li>Missionns</li>
        </ul>
      </div>
      <div>Missions Page</div>
      <div>
        <Link href="/missions/topresponders">Top Responders</Link> | <Link href="/missions/centuryclub">Century Club</Link>
      </div>
    </div>
  );
}