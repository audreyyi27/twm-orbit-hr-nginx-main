def offer_invitation_template(candidate_name: str, position="Software developer", company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      Congratulations! We are delighted to move forward with an offer for the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>.
    </p>

    <p>
      Our HR team will share the details of your offer, including compensation, benefits, and next steps.
    </p>

    <p>
      <em>We look forward to welcoming you to our team!</em>
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
