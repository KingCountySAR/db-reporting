'use client';
import { CenturyClubRow } from '@/app/lib/data';
import { parseCenturyClubApiResult } from '@/types/api/missions/centuryclub';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from '@/app/lib/appContext';

function TableSkeleton() {
  return (
    <div role="status" className="max-w-md animate-pulse mt-3">
      {[1,2,3,4,5,6,7].map(i => (
        <div key={i} className="flex items-center w-full">
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-[80px] mb-3.5 mx-2"></div>
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-[360px] mb-3.5 mx-2"></div>
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-[80px] mb-3.5 mx-2"></div>
          <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 w-[80px] mb-3.5 mx-2"></div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

function Table({ responders }: { responders: CenturyClubRow[]|undefined }) {
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th className="text-center">DEM#</th>
            <th>Name</th>
            <th className="text-right"># Missions</th>
            <th className="text-right">Club Date</th>
            <th className="text-right">First Mission</th>
          </tr>
        </thead>
        <tbody>
          {responders?.map((r, i) => (
            <tr key={r._id.memberId}>
              <td className="text-center">{r._id.refNumber}</td>
              <td>{r._id.firstName} {r._id.lastName}</td>
              <td className="text-right">{r.count}</td>
              <td className="text-right">{r.time?.toDateString()}</td>
              <td className="text-right">{r.first.getFullYear()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>{new Intl.NumberFormat().format(responders?.length ?? 0)} members</div>
    </>
  )
}

export default function CenturyClubPage() {
  const app = useApp();
  const [unit, setUnit] = useState<string>('');
  const [n, setN] = useState<number>(100);
  const [responders, setResponders] = useState<CenturyClubRow[]>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Century Club';
    setResponders(undefined);
    if (unit && n) {
      setLoading(true);
      fetch(`/api/v1/missions/centuryclub?n=${n}&unit=${unit}`).then(response => response.json())
        .then(parseCenturyClubApiResult)
        .then(rows => setResponders(rows))
        .finally(() => setLoading(false));
    } else {
    }
  }, [n, unit]);

  return (
    <div className="flex flex-col max-w-screen-sm">
      <div className="text-sm breadcrumbs">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/missions">Missions</Link></li>
          <li>Century Club</li>
        </ul>
      </div>
      <div>Responders with more than
        <select className="select select-ghost" value={n} onChange={evt => { setN(Number(evt.currentTarget.value)) }}>
          {[25, 50, 100, 250, 500].map(c => (<option key={c}>{c}</option>))}
        </select>
        missions with
        <select className="select select-ghost" value={unit} onChange={evt => { setUnit(evt.currentTarget.value) }}>
          <option value="">Unit</option>
          {app.unitList.map(u => (<option key={u}>{u}</option>))}
        </select>
      </div>
      {unit
        ? (loading ? <TableSkeleton /> : <Table responders={responders} />)
        : <div>No SAR unit selected.</div>
      }
    </div>
  )
}