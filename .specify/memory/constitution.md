<!--
SYNC IMPACT REPORT
==================
Version Change: Initial version → 1.0.0
Action: Initial constitution creation for Notable web application
Modified Principles: N/A (initial creation)
Added Sections: All sections (initial creation)
Removed Sections: None

Template Consistency Check:
✅ plan-template.md: Reviewed - constitution gates will be enforced in Phase 0
✅ spec-template.md: Reviewed - aligns with user-centric requirements approach
✅ tasks-template.md: Reviewed - supports test-driven development when requested
✅ agent-file-template.md: Not yet reviewed (not critical for initial setup)
✅ checklist-template.md: Not yet reviewed (not critical for initial setup)

Follow-up TODOs: None - all essential fields populated
-->

# Notable Constitution

## Core Principles

### I. Type Safety

All application code MUST use TypeScript with strict mode enabled. Type assertions and `any` types are prohibited except when interacting with untyped third-party libraries, and MUST be documented with justification.

**Rationale**: Type safety prevents entire classes of runtime errors and improves maintainability through explicit contracts and better IDE support.

### II. Accessibility-First

All user interfaces MUST meet WCAG 2.1 Level AA standards. This includes semantic HTML, proper ARIA attributes, keyboard navigation support, and sufficient color contrast.

**Rationale**: Accessible applications serve all users effectively and are legally required in many jurisdictions. Building accessibility in from the start is significantly easier than retrofitting.

### III. Component Isolation

Components MUST be self-contained with clear props interfaces and single responsibilities. Components MUST NOT directly access global state, external APIs, or browser APIs except through explicitly passed dependencies.

**Rationale**: Isolated components are testable, reusable, and maintainable. Clear boundaries prevent coupling and enable parallel development.

### IV. Performance Budget

Page initial load MUST complete in under 3 seconds on 3G networks. Largest Contentful Paint (LCP) MUST be under 2.5 seconds. Cumulative Layout Shift (CLS) MUST be under 0.1.

**Rationale**: Performance directly impacts user experience and conversion rates. Core Web Vitals are measurable standards that correlate with user satisfaction.

### V. Security by Default

All user inputs MUST be validated and sanitized. External links MUST include `rel="noopener"`. Sensitive data MUST never be logged or exposed in client-side code. Authentication state MUST be verified server-side.

**Rationale**: Security vulnerabilities can have severe consequences. Defense in depth and secure defaults prevent common attack vectors.

## Code Quality Standards

All code MUST pass Ultracite (Biome) linting and formatting checks before commit. The pre-commit hook enforces this automatically via Lefthook.

All functions MUST have explicit return types when not trivially inferable. Complex business logic MUST be extracted into named functions with clear purposes.

Error boundaries MUST be used to gracefully handle component failures without crashing the entire application.

**Rationale**: Consistent code quality reduces cognitive load, prevents bugs, and accelerates onboarding.

## Testing Requirements

Testing is OPTIONAL by default but when included MUST follow these standards:

- Unit tests for business logic and utility functions
- Integration tests for user flows spanning multiple components
- Tests MUST be written before implementation (TDD) when testing is requested
- Tests MUST use meaningful assertions and clear arrange-act-assert structure
- All tests MUST pass before merging to main branch

**Rationale**: Requested tests serve as executable specifications and regression prevention, but are not mandatory for all features to avoid overhead where not needed.

## Governance

This constitution is the source of truth for all technical decisions in the Notable project. Any deviation MUST be explicitly documented with justification in the relevant specification or plan document.

**Amendment Process**: Constitution amendments require updating this file and incrementing the version according to semantic versioning. All dependent templates and generated artifacts MUST be reviewed for consistency after amendments.

**Compliance**: All pull requests MUST verify adherence to constitutional principles during code review. Complexity additions MUST be justified against simpler alternatives in plan documents.

**Version**: 1.0.0 | **Ratified**: 2025-11-20 | **Last Amended**: 2025-11-20
