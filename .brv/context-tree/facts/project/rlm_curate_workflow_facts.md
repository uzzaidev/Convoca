---
title: RLM Curate Workflow Facts
summary: RLM curation workflow facts covering single-pass processing, precomputed recon, and verification requirements.
tags: []
related: [facts/project/project_facts_snapshot_2026_05_16.md, facts/project/curate_workflow_rlm_approach.md]
keywords: []
createdAt: '2026-05-16T16:01:36.991Z'
updatedAt: '2026-05-16T16:01:36.991Z'
---
## Reason
Capture the curated workflow instructions and task metadata for RLM-based curation.

## Raw Concept
**Task:**
Document the RLM curation workflow for a precomputed single-pass context.

**Changes:**
- Use the precomputed recon result instead of calling recon again
- Proceed directly to extraction for single-pass contexts
- Verify curation using result.applied[].filePath without readFile

**Flow:**
precomputed recon -> extraction -> curate -> verify

**Timestamp:** 2026-05-16T16:01:30.929Z

**Author:** ByteRover context engineer

## Narrative
### Structure
Defines how to process a small RLM curation context with single-pass extraction and direct UPSERT.

### Dependencies
Relies on precomputed recon variables, taskId injection, and curate result verification.

### Highlights
Do not print raw context, do not call tools.curation.recon again, and use result.applied[].filePath for verification.

### Rules
IMPORTANT: Do NOT print raw context. Do NOT call tools.curation.recon — it has been pre-computed. Proceed directly to extraction. For chunked extraction use tools.curation.mapExtract(). Pass taskId as a bare variable, not a string. Use tools.curation.groupBySubject() and tools.curation.dedup() to organize extractions. Verify via result.applied[].filePath — do NOT call readFile for verification.

## Facts
- **curation_mode**: Curate tasks should use the RLM approach with single-pass when suggestedMode is single-pass. [convention]
- **context_size**: The context size is 1310 characters across 33 lines with 0 messages. [project]
- **recon_usage**: Reconnaissance was already computed and should not be called again for this task. [convention]
