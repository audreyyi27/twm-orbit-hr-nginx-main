def information_template(candidate_name: str, position="Software developer", company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      We’d like to share an update regarding your application for the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>.
    </p>

    <p>
      <em>This message is for informational purposes and does not require any action from you at this time.</em>
    </p>

    <p>
      Our team will keep you informed as the process continues, and we appreciate your patience and interest in 
      <strong>{company_name}</strong>.
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
