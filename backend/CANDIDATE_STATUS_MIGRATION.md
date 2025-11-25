# Add candidate_status Column Migration

## Overview
Added a new `candidate_status` column to the `candidates` table to track the current recruitment status directly on the candidate record.

## Changes Made

### 1. Backend Models (`models.py`)
```python
candidate_status = Column(
    Enum(CandidateStatusEnum, name="candidate_status", create_type=False), 
    nullable=True, 
    default=CandidateStatusEnum.applied
)
```

### 2. Backend Schemas (`schemas.py`)
Added `candidate_status: Optional[CandidateStatusEnum] = None` to:
- ✅ `Candidate` schema
- ✅ `CandidateCreate` schema  
- ✅ `CandidateUpdate` schema

### 3. Database Index
```python
Index('idx_candidates_status', Candidates.candidate_status)
```

## Purpose

This column allows you to:
- **Quickly filter candidates by status** (applied, screened, hired, rejected, etc.)
- **Avoid complex joins** with the `candidate_stages` table for simple status queries
- **Display current status** in list views without additional queries
- **Support status-based filtering** in the frontend UI

## Status Values (CandidateStatusEnum)

```python
'applied'                       # Initial application
'resume_scraped'                # Resume data extracted
'screened'                      # Initial screening complete
'survey'                        # Survey sent/completed
'coding_test'                   # Coding test phase
'interview_team_lead'           # Team lead interview
'interview_general_manager'     # GM interview
'offer'                         # Offer extended
'hired'                         # Successfully hired
'rejected'                      # Rejected at any stage
```

## Database Migration

### Prerequisites
```bash
# Backup database first!
pg_dump -h localhost -U your_user -d hr_system > backup_before_status_column.sql
```

### Run Migration
```bash
cd backend
psql -h localhost -U your_user -d hr_system -f add_candidate_status_column.sql
```

### Expected Output
```
BEGIN
ALTER TABLE
UPDATE 123  # (number of existing candidates)
CREATE INDEX
COMMIT

 column_name     | data_type | column_default
-----------------+-----------+-----------------
 candidate_status| USER-DEFINED | 'applied'::candidate_status

 indexname              | indexdef
------------------------+--------------------------------
 idx_candidates_status  | CREATE INDEX idx_candidates...
```

### Rollback (if needed)
```bash
psql -h localhost -U your_user -d hr_system -f remove_candidate_status_column.sql
```

## Testing

### 1. Test API Response
```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal
curl http://localhost:8000/candidates | jq '.[0].candidate_status'
# Should return: "applied" or the actual status
```

### 2. Test Filtering (once implemented)
```bash
curl "http://localhost:8000/candidates?status=applied" | jq '.items | length'
```

### 3. Test Update
```python
# In Python console or test script
import requests

response = requests.put(
    "http://localhost:8000/candidates/{uuid}",
    json={"candidate_status": "screened"},
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
print(response.json())
```

## Frontend Updates Needed

After running the migration, update frontend files:

### 1. `frontend/src/core/candidates/domain.ts`
```typescript
export interface Candidate {
  // ... existing fields ...
  candidate_status?: 'applied' | 'resume_scraped' | 'screened' | 'survey' | 
                     'coding_test' | 'interview_team_lead' | 
                     'interview_general_manager' | 'offer' | 'hired' | 'rejected';
}
```

### 2. `frontend/src/core/candidates/dto.ts`
```typescript
export interface CandidateDto {
  // ... existing fields ...
  candidate_status?: string;
}
```

### 3. Update UI Components
- Add status badge display in candidate list
- Add status filter dropdown
- Add status selector in candidate forms

## API Examples

### GET Candidate (Response includes status)
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john@example.com",
  "candidate_status": "screened",
  ...
}
```

### Update Candidate Status
```bash
PUT /candidates/{uuid}
Content-Type: application/json

{
  "candidate_status": "interview_team_lead"
}
```

## Notes

- ✅ Existing candidates default to `'applied'` status
- ✅ Index created for fast filtering
- ✅ All schemas updated
- ✅ Rollback script available
- ⚠️ Frontend needs manual updates

## Relationship with candidate_stages

The `candidate_status` column provides a **snapshot** of the current status, while `candidate_stages` table maintains a **full history** of status transitions:

- **candidate_status**: Current state (one value per candidate)
- **candidate_stages**: Historical timeline (multiple records per candidate)

You can keep both updated by:
1. Inserting a new row in `candidate_stages` when status changes
2. Updating `candidate_status` in `candidates` table with the new status

---

**Migration Created**: 2025-11-03  
**Status**: ✅ Backend updated | ⏳ Database migration pending | ⏳ Frontend pending




