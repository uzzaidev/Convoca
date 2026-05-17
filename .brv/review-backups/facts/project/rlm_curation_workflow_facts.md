---
title: RLM Curation Workflow Facts
summary: Workflow facts for a single-pass RLM curation task, including precomputed recon and verification rules.
tags: []
related: []
keywords: []
createdAt: '2026-05-16T16:01:00.412Z'
updatedAt: '2026-05-16T16:01:00.412Z'
---
## Reason
Capture the workflow constraints and execution mode from the curation task

## Raw Concept
**Task:**
Curate an RLM-mode context using the precomputed single-pass path.

**Changes:**
- Recognized precomputed recon with suggested single-pass mode
- Captured task constraints for extraction and verification
- Preserved workflow facts for future curation reference

**Flow:**
precomputed recon -> single-pass curation -> verify applied file paths

**Timestamp:** 2026-05-16T16:00:54.410Z

## Narrative
### Structure
This entry documents the execution constraints for a curation task that must avoid raw context printing and use the provided task identifiers.

### Dependencies
Depends on the precomputed recon result, task ID, and history/metadata variables supplied by the caller.

### Highlights
Single-pass mode is explicitly recommended, and verification must rely on applied file paths instead of rereading files.

## Facts
- **curation_context_size**: The current context is a 601-character, 12-line snippet being curated with the RLM approach. [other]
- **recon_mode**: The task uses precomputed recon with suggestedMode set to single-pass. [other]
- **verification_rule**: The task requires verification via result.applied[].filePath and forbids readFile for verification. [convention]
