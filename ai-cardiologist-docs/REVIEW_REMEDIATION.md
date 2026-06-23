# Peer Review Remediation Log (AC-073)

Source: `AI Cardiologist.Doc/Review/Review Comments 01.txt`

| Review weakness | Requirement ID | Status | Evidence |
|-----------------|----------------|--------|----------|
| Target label unspecified | AC-010, AC-071 | Done | `constants.py`, `DATA_MODEL.md` |
| No stratified CV / CI | AC-031 | Done | `evaluation.cross_validate_model` |
| No calibration / DCA | AC-032 | Partial | `evaluate_model` Brier + calibration curve; DCA UI Phase 3 |
| No Framingham/ASCVD baseline | AC-033 | ToDo | Future notebook |
| No subgroup fairness | AC-034 | ToDo | Future slice metrics |
| ELI5 not demonstrated | AC-040, AC-041 | Done | ML explainability + PredictPage results |
| No external validation | AC-011 | Partial | LLCP ingest path stub |
| Cost/time claims unsubstantiated | AC-001 | Done | Governance disclaimer + decision-support framing |
| No clinician validation | AC-091 | Deferred | Enterprise phase |
