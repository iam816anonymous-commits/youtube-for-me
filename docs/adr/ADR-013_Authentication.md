# ADR-013: Security and Authentication Policy

## Status
Approved

## Context
Securing admin access is critical. We must ensure that identity management is secure, preventing common attack vectors such as Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), and man-in-the-middle attacks.

## Decision
We will implement a double-token secure architecture:
*   **Sign-in:** Federated via Google OAuth 2.0.
*   **Tokens:**
    *   **Access Token:** Short-lived JWT (15-minute expiry) sent inside the `Authorization: Bearer <token>` header of HTTP requests.
    *   **Refresh Token:** Long-lived JWT (7-day expiry) stored inside an HTTP-only, secure, `SameSite=Strict` cookie to protect against XSS extraction.
*   **Security:** Enforced CORS policies at the Kong Gateway proxying layer.
