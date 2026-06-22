---
title: Convoca Mobile Architecture
summary: Convoca mobile architecture uses Capacitor with server.url for web and fallback strategies. Routine changes are deployed to web, not via store updates.
tags: []
related: []
keywords: []
createdAt: '2026-06-22T12:56:18.184Z'
updatedAt: '2026-06-22T12:56:18.184Z'
---
## Reason
Documenting mobile architecture strategy and deployment workflow.

## Raw Concept
**Task:**
Document Convoca mobile architecture and deployment strategy

**Changes:**
- Capacitor uses server.url and webDir out as fallback
- Routine changes delivered by deploying web app
- Store updates needed for native/Capacitor changes

**Files:**
- docs/mobile-convoca/CHECKLIST.md
- package.json
- scripts/build-mobile-fallback.mjs

**Flow:**
WebView loads from server.url; fallback to local assets as needed

**Timestamp:** 2026-06-22

## Narrative
### Structure
Mobile app relies on live server for web content with local fallback

### Dependencies
Capacitor config and server.url setup in capacitor.config.ts

### Highlights
Web app updates are pushed live, store updates for native changes
