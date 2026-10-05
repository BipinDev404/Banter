# Security Specification - Banter

## Data Invariants
1. A message must have a valid non-empty `userId`, `userName` (1-20 chars), `message` (1-500 chars), and strict server timestamp `createdAt`.
2. Messages cannot be updated or deleted once created (append-only chat log).
3. A presence session must have a valid `sessionId`, `userName` (1-20 chars), and `connectedAt` / `lastSeen` timestamps.
4. Presence updates may only refresh `lastSeen` and `userName`; `sessionId` and `connectedAt` are immutable.
5. All document IDs must be alphanumeric or hyphen/underscore and under 128 characters.

## The Dirty Dozen Payloads (Designed to Fail)
1. **Empty Message**: `{ userId: "u1", userName: "Alex", message: "", createdAt: request.time }` -> Rejected by `message.size() >= 1`.
2. **Oversized Message (>500 chars)**: `{ userId: "u1", userName: "Alex", message: "a".repeat(501), createdAt: request.time }` -> Rejected by `message.size() <= 500`.
3. **Empty Username**: `{ userId: "u1", userName: "", message: "hi", createdAt: request.time }` -> Rejected by `userName.size() >= 1`.
4. **Oversized Username (>20 chars)**: `{ userId: "u1", userName: "AlexWithVeryLongNameOver20", message: "hi", createdAt: request.time }` -> Rejected by `userName.size() <= 20`.
5. **Ghost Field Injection**: `{ userId: "u1", userName: "Alex", message: "hi", createdAt: request.time, isAdmin: true }` -> Rejected by `hasOnly()`.
6. **Client-Spoofed Timestamp**: `{ userId: "u1", userName: "Alex", message: "hi", createdAt: timestamp("2020-01-01T00:00:00Z") }` -> Rejected by `createdAt == request.time`.
7. **Tamper With Existing Message**: `update doc /messages/msg1` -> Denied (`allow update: if false`).
8. **Delete Other User's Message**: `delete doc /messages/msg1` -> Denied (`allow delete: if false`).
9. **Malformed Doc ID (Path Poisoning)**: `/messages/msg%20illegal!` -> Denied by `isValidId(messageId)`.
10. **Presence Session ID Hijack**: Update `/presence/sessionA` with `incoming().sessionId = "sessionB"` -> Denied by `sessionId == existing().sessionId`.
11. **Presence Timestamp Tampering**: Update `/presence/sessionA` with spoofed `connectedAt` -> Denied by `connectedAt == existing().connectedAt`.
12. **Presence Ghost Field Injection**: Update `/presence/sessionA` adding `role: "admin"` -> Denied by `affectedKeys().hasOnly(['lastSeen', 'userName'])`.
