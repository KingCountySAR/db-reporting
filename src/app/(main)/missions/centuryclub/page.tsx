import { getCenturyClub } from '@/app/lib/data';
import Link from 'next/link';

export async function generateMetadata() {
  return {
    title: 'Century Club'
  };
}

export default async function TopResponderPage() {
  const format = new Intl.NumberFormat();
  const hourFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const responders = await getCenturyClub(100, { unit: 'ESAR' });

  return (
    <div className="flex flex-col max-w-screen-sm">
      <div className="text-sm breadcrumbs">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/missions">Missions</Link></li>
          <li>Century Club</li>
        </ul>
      </div>
      <div>Responders with more than N missions</div>
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
          {responders.map((r, i) => (
            <tr key={r._id.memberId}>
              <td className="text-center">{r._id.refNumber}</td>
              <td>{r._id.firstName} {r._id.lastName}</td>
              <td className="text-right">{r.count}</td>
              <td className="text-right">{r.time.toDateString()}</td>
              <td className="text-right">{r.first.getFullYear()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}