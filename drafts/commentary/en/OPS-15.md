---
summary: Logs must let you answer "which user accessed what, in which tenant, and when", with reliable timestamps, and you must be able to preserve forensic state during a security event.
tags: [logging, forensics, multi-tenancy]
lifecycle: [build, run]
related: [OPS-10, OPS-12, OPS-14, PSS-04, SIM-03]
status: draft, sample text for the prototype
---

## What this means in practice

This criterion is about whether your logs hold up in an investigation:

- **Attribution at tenant level** (01B). For any access, you can tell which identity acted and which tenant was affected. A request log with a tenant ID but only a shared service principal as the actor does not achieve this.
- **Timestamps on every event** (02B). Combine this with time synchronisation from OPS-10, otherwise timestamps from different systems cannot be correlated.
- **Forensic readiness** (03B). During a security event you can capture the state of hardware objects and network communication, for example disk and memory snapshots or packet captures, and keep a chain of evidence. This needs tooling and a runbook before the incident.

The additional criteria add an obligation to hand customers their logs on request (01AC) and integrity guarantees (02AC): tamper-evident storage, synchronised clocks, and copies that are provably identical to the originals.

## Typical evidence

- The log schema and sample events showing actor, tenant and timestamp
- Time synchronisation configuration (NTP or PTP sources)
- A forensic runbook and a record of its use in an incident or exercise
- For additional criteria: immutability configuration of the log store (WORM or object lock), hash or signature verification procedure, customer log requests with response times

## Common misconceptions

- **"Timestamps are the hard part."** The hard part is usually attribution. Background jobs and service-to-service calls often lose track of the original user and tenant.
- **"Forensics is the SOC's problem."** 03B needs platform capabilities such as snapshotting and traffic capture, which engineering has to build.
- **"Customer log export is mandatory."** It is the additional criterion 01AC. Customer-facing logging is covered separately by PSS-04.

## What changed since C5:2020

_Not written yet. Source for this section: BSI's C5:2026 changelog (xlsx)._
