import { MongoClient } from 'mongodb';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'fs';
import { format as formatDate } from 'date-fns';

import D4HRequest from './d4h/lib/src/d4hRequest';
import { Incident, IncidentRoster, Member } from './d4h/lib'
import { MissionDoc, MissionRoster, MissionTimeline } from '@/app/lib/data/mongoDocs';
import { D4HWebClient } from './d4h/lib/src/d4hWebClient';

['.env', '.env.local'].forEach(p => loadEnv({ path: p }));
const mongo = new MongoClient(process.env.MONGODB_URI!);
const d4hWebClient = new D4HWebClient();

const CATEGORY_TAGS = [ 'Disaster', 'Evidence', 'Recovery', 'Rescue', 'Search', 'Urban' ];
const OPERATIONAL_UNITS = (process.env.UNITS ?? '').split(',').reduce((a, c) => {
  const parts = c.split('=');
  return ({ ...a, [parts[0]]: parts.slice(-1)[0] });
}, {} as Record<string, string>);

function d4h<T>(url: string) {
  return new D4HRequest(process.env.D4H_TOKEN!, 250)
    .getManyAsync<T>(new URL(`https://api.d4h.org/v2/${url}`));
}

function getUnitAndRole(d4hRow: IncidentRoster) {
  let role: string | undefined = undefined;
  let unit: string | undefined = undefined;
  if (d4hRow.role?.title) {

    unit = OPERATIONAL_UNITS[d4hRow.role.bundle];
    if (unit) {
      if (d4hRow.role.title.includes('OL')) {
        role = 'OL'
      } else if (d4hRow.role.title.includes("ITOL") || d4hRow.role.title.includes("Comms")) {
        role = 'InTown'
      } else {
        role = 'Field'
      }

      return { unit, role };
    }
  }
  return { unit: undefined, role: undefined };
}

async function buildMission(d4hMission: any, members: Record<number, Member>) {
  let d4hRef = '';
  let d4hTitle = d4hMission.ref_desc.trim();
  const splitTitle = /^((\d{2}-\d{4})|(\d{2}-ES-\d{2,}) )(.*)/.exec(d4hTitle);
  if (splitTitle) {
    d4hRef = splitTitle[1].trim();
    d4hTitle = splitTitle[4].trim();
  } else if (/^\d\d\-/.test(d4hMission.ref_desc.trim())) {
    console.log('Could not figure out DEM# ' + d4hMission.ref_desc);
    return undefined;
  }

  const mongoMission: MissionDoc = {
    d4hId: d4hMission.id,
    title: d4hTitle,
    start: new Date(d4hMission.date),
    done: new Date(d4hMission.enddate),
    jurisdiction: { state: 'WA' },
    roster: [],
    numResponders: 0,
    hours: 0,
    miles: 0,
    units: [],
    categories: CATEGORY_TAGS.filter(t => d4hMission.tags.includes(t))
  };
  if (d4hRef) mongoMission.refNumber = d4hRef;

  let mileage = await d4hWebClient.getMileage(d4hMission.id);
  const d4hRoster = (await d4h<IncidentRoster>(`/team/attendance?activity_id=${d4hMission.id}&sort=date:desc`))
  .sort((a,b) => {
    if (a.member.id === b.member.id) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.member.name < b.member.name ? -1 : 1;
  });

  const units: Record<string, { name: string, hours: number, miles: number }> = {};
  const mongoRosterMap: Record<number, MissionRoster> = {};
  for (const d4hRow of d4hRoster) {
    const nameParts = d4hRow.member.name.split(',');

    let mongoParticipant: MissionRoster = mongoRosterMap[d4hRow.member.id];
    if (!mongoParticipant) {
      mongoParticipant = {
        memberId: d4hRow.member.id + '',
        lastName: nameParts[0]?.trim(),
        firstName: nameParts[1]?.trim(),
        timeline: [],
      };
      const d4hMember = members[d4hRow.member.id];
      if (d4hMember) {
        if (d4hMember.ref) mongoParticipant.refNumber = d4hMember.ref;
      }
      mongoRosterMap[d4hRow.member.id] = mongoParticipant;
      mongoMission.roster.push(mongoParticipant);
    }

    let hours :number|undefined = undefined;
    if (d4hRow.enddate) {
      hours = (new Date(d4hRow.enddate).getTime() - new Date(d4hRow.date).getTime()) / 3600000;
      mongoParticipant.timeline.push({ status: 'SignedOut', time: new Date(d4hRow.enddate) })
      mongoParticipant.hours = (mongoParticipant.hours ?? 0) + hours;
    }
    const miles = mileage[d4hRow.id];
    delete mileage[d4hRow.id];

    if (miles) {
      mongoParticipant.miles = miles;
    }

    const timeline: MissionTimeline = {
      status: 'SignedIn',
      time: new Date(d4hRow.date),
    };
    const { unit, role } = getUnitAndRole(d4hRow);
    if (unit) { timeline.unit = unit; }
    if (role) { timeline.role = role; }
    mongoParticipant.timeline.push(timeline);

    if (unit) {
      const v = units[unit] ?? { name: unit, hours: 0, miles: 0 };
      v.miles += miles ?? 0;
      v.hours += hours ?? 0;
      units[unit] = v;
    }
  }

  if (Object.keys(mileage).length > 0) {
    console.log('Unmatched mileage entries: ', Object.keys(mileage));
  }

  mongoMission.numResponders = mongoMission.roster.length;
  mongoMission.hours = mongoMission.roster.reduce((a,c) => a + (c.hours ?? 0), 0);
  mongoMission.miles = mongoMission.roster.reduce((a,c) => a + (c.miles ?? 0), 0);
  mongoMission.units = Object.values(units).sort((a,b) => a < b ? -1 : a > b ? 1 : 0)

  return mongoMission;
}

function isSame(left: any, right: any) {
  const log = 0
  log > 1 && console.log('-------');
  if (typeof left !== typeof right) {
    log > 0 && console.log('different types', typeof left, typeof right, left, right);
    return false;
  }
  if (typeof left == 'object') {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right).reduce((a,c) => ({ ...a, [c]: 1 }), {} as Record<string,number>);
    for (const key of leftKeys) {
      if (!isSame(left[key], right[key])) {
        log > 0 && console.log('children differ', key);
        return false;
      } else {
        log > 1 &&console.log('ok', key);
      }
      delete rightKeys[key];
    }
    if (Object.keys(rightKeys).length > 0) {
      log > 0 && console.log('right has more keys than left', Object.keys(rightKeys));
      return false;
    }
    return true
  }

  log > 1 && console.log(typeof left, left, right);
  return left === right;
}

function shallowClone<T extends { [key: string]: any}>(left: T, omit: string[]): Partial<T> {
  const result: any = {};
  for (const key of Object.keys(left).filter(f => !omit.includes(f))) {
    result[key] = left[key];
  }
  return result;
}

async function run() {
  const mongoMissionIds = (await mongo.db().collection("missions").find({ start: { $gte: new Date('2021-01-01') } }).project({ d4hId: 1 }).toArray())
    .reduce((a, c) => ({ ...a, [c.d4hId]: 1 }), {});

  const members = (await d4h<Member>('/team/members')).reduce((a,c) => ({ ...a, [c.id]: c}), {} as Record<number, Member>);

  const d4hMissions = await d4h<Incident>('/team/incidents?after=2021-01-01&include_custom_fields=true&sort=date:desc');

  for (const d4hMission of d4hMissions) {
    const mongoMission = await buildMission(d4hMission, members);
    if (mongoMission) {
      var dirty = true

      const existing = await mongo.db().collection<MissionDoc>("missions").findOne({ d4hId: d4hMission.id });
      if (existing) {
        const compareOriginal = shallowClone(existing, [ 'oldId', '_id']);
        if (compareOriginal.refNumber === null) delete compareOriginal.refNumber;
        compareOriginal.roster?.forEach(r => {
          if (r.refNumber === null) delete r.refNumber;
          r.timeline.forEach(t => {
            if (t.role === null) delete t.role;
            if (t.unit === null) delete t.unit;
          });
        });

        dirty = !isSame(compareOriginal, mongoMission);
      }

      if (dirty) {
        console.log(`Saving mission ${mongoMission.refNumber} ${mongoMission.title} (${d4hMission.id})`);
        writeFileSync(`archive/${d4hMission.id}-${formatDate(new Date(), 'yyyy-MM-dd_HHmm')}.json`, JSON.stringify(existing, null, 2));
        const toSave = Object.assign(existing ?? {}, mongoMission);
        writeFileSync(`archive/${d4hMission.id}.json`, JSON.stringify(toSave, null, 2));
        await mongo.db().collection("missions").replaceOne({ d4hId: d4hMission.id }, toSave, { upsert: true });
      } else {
        console.log(`...... mission ${mongoMission.refNumber} ${mongoMission.title}`);
      }

      delete mongoMissionIds[d4hMission.id];
    }


  }
  console.log('done');
}

Promise.all([
  run()
])
  .then(() => {
    mongo.close();
    console.log('all done');
  })