---
summary: The authorisation checks in your product must be validated before every new function ships and whenever the authorisation logic changes, and any weakness you find goes through the vulnerability process.
tags: [access-control, product-security, testing]
lifecycle: [design, build]
related: [PSS-08, DEV-05, DEV-07, PSS-02, OPS-22]
status: draft, sample text for the prototype
---

## What this means in practice

PSS covers the security of the cloud service as a product, so this criterion is about the authorisation checks that protect the functions your customers call. The provider's own staff are covered under IAM.

The interesting sub-criterion is 02B: authorisation must be **validated before a new function is made available** and **whenever the authorisation mechanism of an existing function changes**. In practice that means:

- Every new endpoint or operation ships with tests that prove unauthorised callers are rejected: wrong tenant, wrong role, missing scope.
- A change to the policy engine, role model or middleware triggers the authorisation test suite, not just the tests of the feature that prompted it.
- The tests are part of the change process (cf. DEV-07), so the evidence is a CI run attached to a release.

If those tests or a pentest find a hole, such as an IDOR or a missing tenant check, it is handled as a vulnerability (03B, cf. PSS-02). A quiet bugfix is not enough.

## Typical evidence

- Design documentation of the authorisation model (cf. DEV-05)
- Automated authorisation test suites and CI results linked to sample releases
- The change process showing that authorisation changes trigger validation
- Pentest reports covering broken object-level and function-level authorisation
- Vulnerability tickets for authorisation findings with severity and remediation dates

## Common misconceptions

- **"We need ABAC."** Attribute-based access control is the additional criterion 01AC. Basic only requires effective access control.
- **"The annual pentest covers this."** 02B ties validation to each new function and each change, not to a calendar.
- **"This is about our admins."** It is about access to the service's functions. Provider-side privileged access is covered by IAM-06.

## What changed since C5:2020

_Not written yet. Source for this section: BSI's C5:2026 changelog (xlsx)._
