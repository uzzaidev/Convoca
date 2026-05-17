---
title: Curate Workflow RLM Approach
summary: RLM curation workflow uses recon, single-pass or chunked extraction, dedup/grouping, curate verification, and history recording.
tags: []
related: [facts/project/project_facts.md]
keywords: []
createdAt: '2026-05-16T16:01:21.875Z'
updatedAt: '2026-05-16T16:01:21.875Z'
---
## Reason
Document the RLM curation workflow requirements and verification steps from the provided context

## Raw Concept
**Task:**
Document the RLM curation workflow for small contexts

**Changes:**
- Use the precomputed recon result to decide on single-pass handling
- Extract facts from the context without printing raw content
- Organize facts with deduplication and subject grouping
- Verify curated results through applied file paths and summary checks

**Flow:**
recon -> single-pass extraction -> dedup/group -> curate -> verify -> record history

**Timestamp:** 2026-05-16T16:01:15.186Z

## Narrative
### Structure
The workflow distinguishes between small single-pass contexts and larger chunked contexts, then applies extraction and organization before curation.

### Dependencies
Uses tools.curation.recon, tools.curation.mapExtract, tools.curation.dedup, tools.curation.groupBySubject, and tools.curate.

### Highlights
The provided context explicitly says not to print raw context, not to call recon again, and to verify using result.applied[].filePath.

## Facts
- **curation_workflow_recon**: The curation workflow requires recon before processing context. [convention]
- **curation_workflow_mode**: Single-pass mode should be used when recon suggests a small context. [convention]
- **curation_workflow_chunked_extraction**: Chunked extraction should use tools.curation.mapExtract when the context is large. [convention]
- **curation_workflow_fact_processing**: Deduplication and grouping should be applied to extracted facts before curation. [convention]
- **curation_workflow_verification**: Curate result success must be verified via result.summary and applied file paths. [convention]
