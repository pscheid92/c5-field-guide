---
summary: Every privileged action by your own staff or automation must trace back to a person, be time-limited, be logged with automated alerting on misuse, and the admin entry points need MFA.
tags: [access-control, admin-interfaces, mfa, logging]
lifecycle: [design, run]
related: [IAM-01, IAM-08, OPS-10, OPS-13, COS-05, SIM-01]
status: draft, sample text for the prototype
---

## What this means in practice

"Privileged" has a precise meaning here (see the supplementary information): access that lets the provider's personnel read or write customer data, unless it is encrypted, or change operational or security configuration in production. If your admin API can do either, it is in scope.

For an engineer, the basic sub-criteria translate to:

- **No anonymous admins.** Shared technical accounts such as `root` or a service break-glass user may exist, but they can only be reached after the person has authenticated with their own identity (03B). Think "check out via a vault or `sudo` from a personal login", not a shared password in a wiki.
- **Time-boxed grants.** Privileged roles expire. How long is up to your risk assessment (02B), but "granted in 2023, still active" will not survive an audit.
- **Log, detect, notify.** Logging privileged activity is not enough. You need automated rules over those logs and a human who gets notified when they fire (04B to 06B).
- **MFA on every admin interface** (09B), including internal consoles and CLIs that talk to the admin API.

The additional criteria raise the bar to an inventory of privileged identities, named owners for non-human identities, **phishing-resistant MFA** (FIDO2 or equivalent) and a **PAM solution with just-in-time elevation**.

## Typical evidence

- The policy for privileged access (part of the IAM policy or a separate one, cf. IAM-01)
- Export of privileged roles and groups with members and expiry dates, as of a sample date
- A sample of access requests showing approval, grant and automatic expiry
- Identity provider configuration that enforces MFA for the admin applications
- SIEM detection rules for privileged misuse, plus one or two alerts with the resulting ticket
- For additional criteria: PAM configuration, FIDO2 enforcement policy, the non-human identity owner list with its six-monthly review record

## Common misconceptions

- **"C5 forbids shared accounts."** It does not. It requires that they are only accessed after personal authentication (03B).
- **"Standing admin access is forbidden in basic."** Basic requires time limits based on a risk assessment. Just-in-time elevation through PAM is explicitly required only by the additional criterion 04AC.
- **"Any MFA will do."** For the basic criteria, yes, the text only requires MFA. Phishing-resistant MFA is an additional criterion (03AC), so check which criteria your audit covers.
- **"We log everything, so we're fine."** 05B and 06B require automated monitoring and notification, not just retention.

## What changed since C5:2020

_Not written yet. Source for this section: BSI's C5:2026 changelog (xlsx)._
