def team_lead_interview_template(candidate_name: str, position: str, company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      Congratulations on moving forward in the hiring process for the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>! We’d like to invite you to an interview with the Team Lead.
    </p>

    <p>
      This conversation will focus on your technical background, problem-solving approach, and teamwork skills.
    </p>

    <p>
      <em>We will share the exact date, time, and meeting details separately.</em>
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
