export interface TeamMember {
  team_lead_id: string;
  team_lead_name: string;
  members: Member;
}

export interface Member {
  member_id: string;
  employee_id: string;
  fullname: string;
  email: string;
  role: string;
  positions: string;
}
