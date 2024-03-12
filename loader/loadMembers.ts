import { MongoClient } from 'mongodb';
import { writeFileSync } from 'fs';
import { format as formatDate } from 'date-fns';

import { Incident, IncidentRoster, Member as D4HMember, Group } from './d4h/lib';
import { OPERATIONAL_UNITS, d4h, isSubset } from './util';
import { MemberDoc } from '@/app/lib/data/mongoDocs';

async function buildMember(d4hRow: D4HMember, unitGroupLookup: Record<string, string>) {
  const nameParts = d4hRow.name.split(',');
  let member: MemberDoc = {
    memberId: d4hRow.id + '',
    firstName: nameParts[1]?.trim(),
    lastName: nameParts[0]?.trim(),
    activeUnits: (!d4hRow.status.value.includes('Operational')) ? [] : (d4hRow.group_ids ?? []).map(f => unitGroupLookup[f]).filter(f => f).sort(),
    emails: [],
    isOperational: d4hRow.status.value === 'Operational',
    dbClass: d4hRow.status.value,
  }

  if (d4hRow.ref) member.refNumber = d4hRow.ref.trim();
  if (d4hRow.email) member.emails.push(d4hRow.email.trim());
  let customString = d4hRow.custom_fields?.find(f => f.label === 'Secondary Email')?.value_string;
  if (customString) {
    for (const email of customString?.split(/[,;]/).filter(f => f).map(f => f.trim())) {
      if (/^([0-9a-zA-Z]|[0-9a-zA-Z][0-9a-zA-Z\.\-_]*[0-9a-zA-Z]+)@([0-9A-Za-z\-\.])+[a-zA-Z]{2,}$/.test(email)) {
        if (!member.emails.includes(email)) {
          member.emails.push(email);
        }
      } else {
        console.log('# Email in wrong format? ' + email)
      }
    }
  }
  customString = d4hRow.custom_fields?.find(f => f.label === 'UUID')?.value_string;
  if (customString) member.oldId = customString;

  return member;
}

export async function loadMembers(mongo: MongoClient) {
  const unitGroupLookup = (await d4h<Group>('/team/groups'))
                      .filter(f => f.bundle === 'Units' && Object.keys(OPERATIONAL_UNITS).includes(f.title))
                      .reduce((a,c) => ({ ...a, [c.id]: c.title }), {} as Record<string,string>)
  const d4hMembers = [
    ...await d4h<D4HMember>('/team/members?include_custom_fields=true'),
  //  ...await d4h<D4HMember>('/team/members?include_custom_fields=true&status=Retired'),
    ...await d4h<D4HMember>('/team/members?include_custom_fields=true&status=Non-Operational'),
  //  ...await d4h<D4HMember>('/team/members?include_custom_fields=true&status=Deleted'),
  ];

  for (const d4hMember of d4hMembers) {
    const d4hId = d4hMember.id + '';
    const member = await buildMember(d4hMember, unitGroupLookup);
    const existing = await mongo.db().collection<MemberDoc>("members").findOne({ memberId: d4hId });
    if (existing && isSubset(member, existing)) {
    } else {
      await mongo.db().collection<MemberDoc>("members").replaceOne({ memberId: d4hId }, member, { upsert: true });
      console.log(`${member.firstName} ${member.lastName} [saved]`);
    }
  }
}