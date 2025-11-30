def gm_interview_template(candidate_name: str, position: str, company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      We’re pleased to inform you that you’ve advanced to the next stage in the recruitment process for the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>. We would like to invite you to an interview with our General Manager.
    </p>

    <p>
      This discussion will cover your career aspirations, leadership potential, and how you align with our company’s vision.
    </p>

    <p>
      <em>Further details regarding the schedule and format will be provided soon.</em>
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
