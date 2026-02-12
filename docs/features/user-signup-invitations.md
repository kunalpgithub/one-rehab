---
status: ready
depends_on: []
blocks: []
created: 2025-02-12
---

# User signup and invitations (centralized profiles)

## Goal

Provide a minimal signup page that collects contact and personal information so every participant (patient, visitor, manager) has a single centralized profile. Invitations drive signup: when someone adds another person in the app, the added person is invited to sign up; managers can invite their team. This reduces duplicate or partial records and ties activity to one identity.

## Scope

Auth/signup UI, invitation flows (send + accept), and profile data. Likely DB: user/profile table(s), invitation table, and linking roles (patient, visitor, manager) to that profile. Email (or SMS) for invite delivery.

## Acceptance

- **Minimal signup page**: New users can sign up with contact details (e.g. email, phone) and minimal personal info; no long forms.
- **Visitor adds patient**: When a visitor adds a patient, the patient is invited to sign up (e.g. email with signup link). Accepting completes profile and links that user as the patient for existing records where applicable.
- **Patient adds visitor**: When a patient adds a visitor, the visitor is invited to sign up; same flow as above for the visitor role.
- **Manager invites team**: Manager can send signup invitations to team members (e.g. visitors/staff). Invitees sign up and are linked to that manager/team.
- **Centralized profile**: One profile per person; roles (patient, visitor, manager) are attributes or links from that profile so the same person can be referenced consistently across visits, invoices, and teams.

## Out of scope

- Full CRM or extended profile fields (keep signup minimal).
- Social login or SSO (unless specified later).
- Custom invitation copy per role (can be same template with role context).

## Notes

- Invitation token or magic-link pattern: store pending invite (email/phone, role, inviter), send link; signup page pre-fills or assigns role from token.
- Consider how existing patients/visitors (created before this feature) are migrated or invited to claim their profile.
- Cross-reference: [Patient dashboard](patient-dashboard.md) and [Manager dashboard](manager-dashboard.md) assume users can log in; this feature provides the signup path and identity.
