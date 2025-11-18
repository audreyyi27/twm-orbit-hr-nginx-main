def rejection_email_template(candidate_name:str,position= "Software developer",company_name="Taiwan Mobile Indonesia"):
  return f"""
          <p>Hi <strong>{candidate_name}</strong>,</p>

          <p>
            Thank you for applying for the <strong>{position}</strong> role at 
            <strong>{company_name}</strong>. We appreciate the time and effort you put into your application.
          </p>

          <p>
            After careful review, we’ve decided to move forward with other candidates whose experience more closely matches our needs at this time.
          </p>

          <p>
            We truly value your interest in <strong>{company_name}</strong> and encourage you to apply again for future opportunities. 
            <em>We wish you the best in your job search.</em>
          </p>

          <p>Sincerely,<br>
          The <strong>{company_name}</strong> Hiring Team</p>
      """