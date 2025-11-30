from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, deps
from app.email_utils import send_email


router = APIRouter(prefix="/recruitment", tags=["Recruitment"])


@router.post("/email/templates", response_model=schemas.EmailTemplateOut)
def create_template(template: schemas.EmailTemplateBase, db: Session = Depends(deps.get_db)):
    t = models.EmailTemplate(**template.dict())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/email/templates", response_model=list[schemas.EmailTemplateOut])
def list_templates(db: Session = Depends(deps.get_db)):
    return db.query(models.EmailTemplate).all()


@router.post("/candidates/{candidate_id}/send-reject")
def send_reject(candidate_id: int, template_key: str, db: Session = Depends(deps.get_db)):
    cand = db.query(models.Candidate).get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    tmpl = db.query(models.EmailTemplate).filter_by(key=template_key).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    body = tmpl.body.replace("{{candidate_name}}", cand.full_name)
    send_email(to=cand.email, subject=tmpl.subject, body=body)
    cand.current_status = "reject"
    db.commit()
    return {"detail": "Reject email sent"}