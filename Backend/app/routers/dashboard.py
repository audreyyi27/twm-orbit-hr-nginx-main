from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import String, cast, func, literal, select, literal_column, text, case, and_
from .. import schemas, models
from ..db import get_db
from ..deps import get_current_user
from ..cache import cache_get, cache_set

router = APIRouter(prefix="/dashboard", tags=['reports'])

TZ_NAME = "Asia/Jakarta"  # pass a string to SQL

async def _validate_tzname(db: AsyncSession, tzname: str) -> str:
    res = await db.execute(text("select 1 from pg_timezone_names where name = :tz limit 1"), {"tz": tzname})
    if res.first() is None:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {tzname}")
    return tzname

def _bucket_expr(period: schemas.PeriodEnum, tzname: str, dt_col):
    ts = func.timezone(tzname, dt_col)
    if period == schemas.PeriodEnum.weekly:
        return func.date_trunc("week", ts)
    if period == schemas.PeriodEnum.monthly:
        return func.date_trunc("month", ts)
    if period == schemas.PeriodEnum.yearly:
        return func.date_trunc("year", ts)
    if period == schemas.PeriodEnum.all_time:
        return literal_column("TIMESTAMP '1970-01-01'")
    if period == schemas.PeriodEnum.custom:
        return None
    raise HTTPException(400, "invalid period")

def _auto_bucket_for_custom(tzname: str, dt_col, start: datetime, end: datetime):
    span_days = max((end - start).days, 1)
    ts = func.timezone(tzname, dt_col)
    if span_days <= 14:
        return func.date_trunc("day", ts)
    if span_days <= 120:
        return func.date_trunc("week", ts)
    if span_days <= 730:
        return func.date_trunc("month", ts)
    return func.date_trunc("year", ts)

@router.get(
    "/candidate-stages",
    response_model=schemas.DashboardResponse,
    summary="Bucketed counts of candidate stages over time",
    description=(
        "Returns counts grouped by time bucket and stage label using `entered_at`. "
        "For rejections, the label is remapped to a reason based on the previous stage:\n"
        "- rejected after `coding_test` → `fail_coding_test`\n"
        "- rejected after `interview_team_lead` → `fail_interview_lead`\n"
        "- otherwise → `unqualified`\n\n"
        "When `period=custom`, buckets auto-scale by the window size (day/week/month/year). "
        "All timestamps are computed in the configured timezone."
    ),
    responses={
        200: {
            "description": "OK",
            "content": {
                "application/json": {
                    "examples": {
                        "monthly_latest_per_bucket": {
                            "summary": "Monthly buckets, latest per candidate within each bucket",
                            "value": {
                                "items": {
                                    "period": "monthly",
                                    "from_": None,
                                    "to": None,
                                    "buckets": [
                                        {
                                            "bucket_start": "2025-05-01T00:00:00",
                                            "counts": {
                                                "applied": 12,
                                                "screened": 7,
                                                "coding_test": 3,
                                                "interview_team_lead": 2,
                                                "offer": 1,
                                                "hired": 2,
                                                "fail_coding_test": 1,
                                                "fail_interview_lead": 0,
                                                "unqualified": 1
                                            }
                                        },
                                        {
                                            "bucket_start": "2025-06-01T00:00:00",
                                            "counts": {
                                                "applied": 9,
                                                "screened": 6,
                                                "coding_test": 4,
                                                "interview_team_lead": 1,
                                                "offer": 2,
                                                "hired": 3,
                                                "fail_coding_test": 1,
                                                "fail_interview_lead": 1,
                                                "unqualified": 0
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        "custom_window": {
                            "summary": "Custom date window with auto bucket size",
                            "value": {
                                "items": {
                                    "period": "custom",
                                    "from_": "2025-07-01T00:00:00",
                                    "to": "2025-07-15T23:59:59",
                                    "buckets": [
                                        {
                                            "bucket_start": "2025-07-01T00:00:00",
                                            "counts": {
                                                "applied": 3,
                                                "screened": 1,
                                                "unqualified": 0
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
        },
        400: {
            "description": "Invalid input (timezone not found, invalid period, custom range missing from/to, or to < from)"
        },
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
    },
)
async def get_candidate_stages(
    period: schemas.PeriodEnum = Query(...),
    from_: Optional[datetime] = Query(None, alias="from"),
    to: Optional[datetime] = Query(None),
    latest_per_candidate_bucket: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_user),
):
    """
    Counts by time bucket and stage label (using entered_at).
    Rejection is remapped to a reason based on the previous stage:
      - rejected after coding_test   -> 'fail_coding_test'
      - rejected after interview TL  -> 'fail_interview_lead'
      - otherwise                    -> 'unqualified'
    TODO: 'fail_to_attend' hook is in place, wire it when your signal is ready.
    """
    # Create cache key based on parameters
    cache_key = f"dashboard_stages:{period.value}:{from_}:{to}:{latest_per_candidate_bucket}"
    
    # Check cache first
    cached_result = await cache_get(cache_key)
    if cached_result:
        return schemas.DashboardResponse(items=cached_result)
    
    tzname = await _validate_tzname(db, TZ_NAME)
    dt_col = models.CandidateStages.entered_at

    if period == schemas.PeriodEnum.custom and (not from_ or not to):
        raise HTTPException(400, "from and to are required for custom period")
    if to and from_ and to < from_:
        raise HTTPException(400, "to must be >= from")

    filters = []
    # Bucketing + default windows
    if period == schemas.PeriodEnum.custom:
        filters += [dt_col >= from_, dt_col <= to]
        bucket = _auto_bucket_for_custom(tzname, dt_col, from_, to)
    else:
        bucket = _bucket_expr(period, tzname, dt_col)
        now = func.now()
        if period in (schemas.PeriodEnum.weekly, schemas.PeriodEnum.monthly):
            filters += [dt_col >= now - text("interval '1 year'"), dt_col <= now]
        elif period == schemas.PeriodEnum.yearly:
            filters += [dt_col >= now - text("interval '5 years'"), dt_col <= now]
        # all-time: no date filter

    bucket_lbl = "bucket_start"

    # Previous stage over full candidate timeline (by entered_at ASC)
    prev_stage = func.lag(models.CandidateStages.stage_key).over(
        partition_by=models.CandidateStages.candidate_id,
        order_by=models.CandidateStages.entered_at.asc(),
    ).label("prev_stage")

    # rejection reason mapping
    rejection_reason = case(
        (and_(
            models.CandidateStages.stage_key == models.CandidateStatusEnum.rejected,
            prev_stage == models.CandidateStatusEnum.coding_test,
        ), literal("fail_coding_test")),
        (and_(
            models.CandidateStages.stage_key == models.CandidateStatusEnum.rejected,
            prev_stage == models.CandidateStatusEnum.interview_team_lead,
        ), literal("fail_interview_lead")),
        # TODO: add fail_to_attend mapping when you have a signal
        else_=literal("unqualified"),
    )
        
    stage_label_expr = case(
        (models.CandidateStages.stage_key == models.CandidateStatusEnum.rejected, rejection_reason),
        else_=cast(models.CandidateStages.stage_key, String),
    ).label("stage_label")

    # Build the ranked subquery using REAL expressions for bucket + stage_label
    bucket_expr = bucket.label(bucket_lbl)

    ranked = (
        select(
            models.CandidateStages.candidate_id,
            models.CandidateStages.stage_key,
            prev_stage,
            stage_label_expr,
            models.CandidateStages.entered_at.label("entered_at"),
            bucket_expr,
            func.row_number().over(
                partition_by=(models.CandidateStages.candidate_id, bucket_expr),
                order_by=models.CandidateStages.entered_at.desc(),
            ).label("rn"),
        )
        .where(*filters)
        .subquery("ranked")
    )
    # Use the ranked.c columns directly in group_by/order_by. No string-y literals.
    bucket_col = ranked.c[bucket_lbl]
    label_col = ranked.c.stage_label

    if latest_per_candidate_bucket:
      stmt = (
        select(bucket_col, label_col, func.count(literal(1)).label("cnt"))
        .where(ranked.c.rn == 1)
        .group_by(bucket_col, label_col)
        .order_by(bucket_col.asc(), label_col.asc())
      )
    else:
      stmt = (
          select(bucket_col, label_col, func.count(literal(1)).label("cnt"))
          .group_by(bucket_col, label_col)
          .order_by(bucket_col.asc(), label_col.asc())
      )
    result = await db.execute(stmt)
    rows = result.all()

    # Pivot to {bucket_start: {label: count}}
    buckets_map: Dict[datetime, Dict[str, int]] = {}
    for b, label, cnt in rows:
        # label comes out as str due to cast/literals above
        buckets_map.setdefault(b, {})[str(label)] = cnt

    # Zero-fill to keep series aligned
    all_labels = {k for d in buckets_map.values() for k in d}
    for d in buckets_map.values():
        for s in all_labels:
            d.setdefault(s, 0)

    buckets = [
        schemas.BucketItem(bucket_start=k, counts=v)
        for k, v in sorted(buckets_map.items(), key=lambda kv: kv[0])
    ]
    res = schemas.Dashboard(period=period, from_=from_, to=to, buckets=buckets)
    
    # Cache result for 15 minutes
    await cache_set(cache_key, res.model_dump(), ttl=900)
    
    return schemas.DashboardResponse(items=res)
