import { ObjectId } from "mongodb";

export interface MissionTimeline {
  status: 'SignedIn'|'SignedOut';
  time: Date;
  role?: string;
  unit?: string;
}

export interface MissionRoster {
  memberId?: ObjectId;
  refNumber?: string;
  lastName: string;
  firstName: string;
  timeline: MissionTimeline[];
  hours?: number;
  miles?: number;
};

export interface MissionDoc {
  d4hId: number;
  title: string;
  refNumber?: string;
  jurisdiction: {
    state: string;
    county?: string;
  },
  categories: string[];
  start: Date;
  done?: Date;
  roster: MissionRoster[];
  miles: number;
  hours: number;
  numResponders: number;
  units: { name: string, hours: number, miles: number }[];
};

export interface MemberDoc {
  memberId?: string;
  dbClass?: string;
  oldId?: string;
  firstName: string;
  lastName: string;
  refNumber?: string;
  isOperational: boolean;
  activeUnits: string[];
  emails: string[];
}