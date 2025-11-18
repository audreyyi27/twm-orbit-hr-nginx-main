import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# from dotenv import load_dotenv
import os


# load_dotenv()
SMTP_HOST = os.getenv('SMTP_HOST','localhost')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', "")
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD',"")
SMTP_FROM = os.getenv('SMTP_FROM', "no-reply@example.com")


def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_email
    msg.attach(MIMEText(body, "plain"))


    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        if SMTP_USER:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)