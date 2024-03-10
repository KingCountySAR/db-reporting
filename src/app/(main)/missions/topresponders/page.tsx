import { getTopVolunteers } from '@/app/lib/data';
import Link from 'next/link';

export async function generateMetadata() {
  return {
    title: 'Top Responders'
  };
}

export default async function TopResponderPage() {
  const format = new Intl.NumberFormat();
  const hourFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const responders = await getTopVolunteers({ unit: 'ESAR', filterInTown: true });

  return (
    <div className="flex flex-col max-w-screen-sm">
      <div className="text-sm breadcrumbs">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/missions">Missions</Link></li>
          <li>Top Responders</li>
        </ul>
      </div>
      <div>Top ESAR Responders</div>
      <table className="table">
        <thead>
        <tr>
          <th></th>
          <th className="text-center">DEM#</th>
          <th>Name</th>
          <th className="text-right"># Missions</th>
          <th className="text-right">Hours</th>
          <th className="text-right">Miles</th>
        </tr>
        </thead>
        <tbody>
          {responders.map((r, i) => (
            <tr key={`${i}-${r._id}`}>
              <td className="text-center">{i + 1}</td>
              <td className="text-center">{r.refNumber}</td>
              <td>{r.firstName} {r.lastName}</td>
              <td className="text-right">{r.count}</td>
              <td className="text-right">{hourFormat.format(r.hours)}</td>
              <td className="text-right">{format.format(r.miles)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}