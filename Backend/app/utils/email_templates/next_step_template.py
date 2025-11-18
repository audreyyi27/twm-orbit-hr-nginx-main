def next_step_template(candidate_name: str, position = "Software developer", company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      Congratulations! You’ve successfully progressed in the recruitment process for the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>.
    </p>

    <p>
      As the next step, our team will be in touch with further instructions regarding scheduling and preparation.
    </p>

    <p>
      <em>Please keep an eye on your inbox for additional details, and don’t hesitate to reach out if you have any questions.</em>
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
