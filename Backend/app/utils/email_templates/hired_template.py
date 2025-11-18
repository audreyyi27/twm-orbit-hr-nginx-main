def hired_template(candidate_name: str, position="Software developer", company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      We’re thrilled to officially welcome you to <strong>{company_name}</strong> as our new <strong>{position}</strong>!
    </p>

    <p>
      Our onboarding team will reach out with the next steps, including start date, orientation details, and documentation.
    </p>

    <p>
      <em>We’re excited to have you join us and contribute to our mission.</em>
    </p>

    <p>Congratulations again,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
