---
evicted_at: '2026-09-18T10:37:24.005Z'
evicted_importance: 50
original_path: facts/project/rlm_curate_workflow_facts.md
original_token_count: 510
points_to: _archived/facts/project/rlm_curate_workflow_facts.full.md
type: archive_stub
---
The RLM curation workflow outlines a streamlined process for single-pass context curation, emphasizing the use of precomputed recon results to enhance efficiency. Key steps include utilizing precomputed recon for extraction, directly curating without re-invoking recon, and verifying outcomes through `result.applied[].filePath`. The workflow is structured around the flow: precomputed recon → extraction → curation → verification. Important rules stress the prohibition of printing raw context and reiterating recon calls. Additionally, it highlights the need for organized extractions using `tools.curation.groupBySubject()` and deduplication via `tools.curation.dedup()`. The context size is noted as 1310 characters across 33 lines, and the author is identified as a ByteRover context engineer.