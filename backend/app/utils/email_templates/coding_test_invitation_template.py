def coding_test_invitation_template(candidate_name: str, position: str, company_name="Taiwan Mobile Indonesia"):
    return f"""
    <p>Hi <strong>{candidate_name}</strong>,</p>

    <p>
      Thank you again for your interest in the <strong>{position}</strong> role at 
      <strong>{company_name}</strong>. We’re excited to invite you to participate in our coding test as the next step in the selection process.
    </p>

    <p>
      The test will help us evaluate your problem-solving and technical skills. Instructions and access details will be sent to you separately.
    </p>

    <p>
      <em>Please complete the test by the deadline provided to remain in consideration for the role.</em>
    </p>

    <p>Sincerely,<br>
    The <strong>{company_name}</strong> Hiring Team</p>
    """
