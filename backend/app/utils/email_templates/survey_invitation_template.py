def survey_invitation_template(candidate_name: str, position: str, company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      Thank you for applying for the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>. As the next step in our process, we invite you to complete a brief survey.
    </p>

    <p>
      The survey helps us better understand your background, motivation, and interests. It should take no more than 10–15 minutes.
    </p>

    <p>
      <em>Please complete the survey by the deadline provided so we can continue with your application.</em>
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
