---
consolidated_at: '2026-05-16T16:17:53.103Z'
consolidated_from: [{date: '2026-05-16T16:17:53.103Z', path: facts/project/rlm_curation_workflow_facts.md, reason: 'These two files document the same RLM curation workflow constraints and are largely overlapping in flow, verification rules, and execution mode. They should be merged into a single canonical workflow entry to eliminate duplication.'}]
---
## Reason
Document the RLM curation workflow requirements and verification steps from the provided context, including the precomputed single-pass execution constraints.

## Raw Concept
**Task:**
Document the RLM curation workflow for small contexts and precomputed single-pass contexts.

**Changes:**
- Use the precomputed recon result to decide on single-pass handling
- Extract facts from the context without printing raw content
- Organize facts with deduplication and subject grouping
- Verify curated results through applied file paths and summary checks
- Recognized precomputed recon with suggested single-pass mode
- Captured task constraints for extraction and verification
- Preserved workflow facts for future curation reference

**Flow:**
recon -> single-pass extraction -> dedup/group -> curate -> verify -> record history

**Timestamp:** 2026-05-16T16:01:15.186Z

## Narrative
### Structure
The workflow distinguishes between small single-pass contexts and larger chunked contexts, then applies extraction and organization before curation.

### Dependencies
Uses tools.curation.recon, tools.curation.mapExtract, tools.curation.dedup, tools.curation.groupBySubject, and tools.curate. Depends on the precomputed recon result, task ID, and history/metadata variables supplied by the caller.

### Highlights
The provided context explicitly says not to print raw context, not to call recon again, and to verify using result.applied[].filePath. Single-pass mode is explicitly recommended, and verification must rely on applied file paths instead of rereading files.

### Rules
IMPORTANT: Do NOT print raw context. Do NOT call tools.curation.recon — it has been pre-computed. Proceed directly to extraction. For chunked extraction use tools.curation.mapExtract(). Pass taskId as a bare variable, not a string. Use tools.curation.groupBySubject() and tools.curation.dedup() to organize extractions. Verify via result.applied[].filePath — do NOT call readFile for verification.

## Facts
- **curation_workflow_recon**: The curation workflow requires recon before processing context. [convention]
- **curation_workflow_mode**: Single-pass mode should be used when recon suggests a small context. [convention]
- **curation_workflow_chunked_extraction**: Chunked extraction should use tools.curation.mapExtract when the context is large. [convention]
- **curation_workflow_fact_processing**: Deduplication and grouping should be applied to extracted facts before curation. [convention]
- **curation_workflow_verification**: Curate result success must be verified via result.summary and applied file paths. [convention]
- **curation_context_size**: The current context is a 601-character, 12-line snippet being curated with the RLM approach. [other]
- **recon_mode**: The task uses precomputed recon with suggestedMode set to single-pass. [other]
- **verification_rule**: The task requires verification via result.applied[].filePath and forbids readFile for verification. [convention]
- **curation_mode**: Curate tasks should use the RLM approach with single-pass when suggestedMode is single-pass. [convention]
- **context_size**: The context size is 1310 characters across 33 lines with 0 messages. [project]
- **recon_usage**: Reconnaissance was already computed and should not be called again for this task. [convention]