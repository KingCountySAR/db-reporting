import { MongoClient, WithId } from 'mongodb';
import { writeFileSync } from 'fs';
import { format as formatDate } from 'date-fns';


import { Incident, IncidentRoster, Member } from './d4h/lib';
import { MemberDoc, MissionDoc, MissionRoster, MissionTimeline } from '@/app/lib/data/mongoDocs';
import { D4HWebClient } from './d4h/lib/src/d4hWebClient';
import { OPERATIONAL_UNITS, d4h, isSame, shallowClone } from './util';

const CATEGORY_TAGS = [ 'Disaster', 'Evidence', 'Recovery', 'Rescue', 'Search', 'Urban' ];

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

async function buildMission(d4hMission: any, members: Record<string, WithId<MemberDoc>>, d4hWebClient: D4HWebClient) {
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
        lastName: nameParts[0]?.trim(),
        firstName: nameParts[1]?.trim(),
        timeline: [],
      };

      const mongoMember = members[d4hRow.member.id + ''];
      if (mongoMember) {
        mongoParticipant.memberId = mongoMember._id;
        if (mongoMember.refNumber) mongoParticipant.refNumber = mongoMember.refNumber;
      } else {
        console.log('cant find member ' + d4hRow.member.id)
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
  mongoMission.units = Object.values(units).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)

  return mongoMission;
}

export async function loadMissions(mongo: MongoClient, d4hWebClient: D4HWebClient) {
  const mongoMissionIds = (await mongo.db().collection("missions").find({ start: { $gte: new Date('2021-01-01') } }).project({ d4hId: 1 }).toArray())
    .reduce((a, c) => ({ ...a, [c.d4hId]: 1 }), {});

  const mongoMembers = (await mongo.db().collection<MemberDoc>("members").find({ "memberId": { $exists: true } }).toArray()).reduce((a, c) => ({ ...a, [c.memberId!]: c }), {} as Record<string,WithId<MemberDoc>>)

  const d4hMissions = await d4h<Incident>('/team/incidents?after=2021-01-01&include_custom_fields=true&sort=date:desc');

  for (const d4hMission of d4hMissions) {
    const mongoMission = await buildMission(d4hMission, mongoMembers, d4hWebClient);
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
        writeFileSync(`archive/missions/${d4hMission.id}-${formatDate(new Date(), 'yyyy-MM-dd_HHmm')}.json`, JSON.stringify(existing, null, 2));
        const toSave = Object.assign(existing ?? {}, mongoMission);
        writeFileSync(`archive/missions/${d4hMission.id}.json`, JSON.stringify(toSave, null, 2));
        await mongo.db().collection("missions").replaceOne({ d4hId: d4hMission.id }, toSave, { upsert: true });
      } else {
        console.log(`...... mission ${mongoMission.refNumber} ${mongoMission.title}`);
      }

      delete mongoMissionIds[d4hMission.id];
    }
  }
  console.log('done');
}