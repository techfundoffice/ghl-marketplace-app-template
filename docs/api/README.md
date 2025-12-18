# GoHighLevel Clone - REST API Architecture

## Overview

This document provides a comprehensive REST API architecture for a GoHighLevel clone platform. The API follows RESTful principles and is documented using OpenAPI 3.0 specification.

## API Base URL

```
Production: https://api.gohighlevel-clone.com/v1
Staging: https://api-staging.gohighlevel-clone.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API requests (except authentication endpoints) require authentication using JWT Bearer tokens.

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- **Standard tier**: 100 requests/minute
- **Professional tier**: 500 requests/minute
- **Enterprise tier**: 2000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Pagination

List endpoints support cursor-based pagination:

```
GET /api/v1/contacts?limit=50&cursor=eyJpZCI6MTIzfQ
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTczfQ",
    "prevCursor": "eyJpZCI6NzN9",
    "hasMore": true,
    "total": 1250
  }
}
```

## Filtering and Sorting

```
GET /api/v1/contacts?filter[status]=active&filter[tags]=vip&sort=-createdAt
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2025-12-18T10:30:00Z"
  }
}
```

### Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Webhooks

The API supports webhooks for real-time event notifications:

```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["contact.created", "opportunity.won"],
  "secret": "whsec_abc123"
}
```

## API Versioning

The API uses URL-based versioning (`/v1`, `/v2`). Breaking changes will be introduced in new versions while maintaining backward compatibility for existing versions.

## OpenAPI Specification

Complete OpenAPI 3.0 specification is available in:
- `openapi.yaml` - Full specification
- Individual endpoint files in `/docs/api/endpoints/`

## Endpoint Categories

1. [Authentication](/docs/api/endpoints/auth.yaml)
2. [Agencies](/docs/api/endpoints/agencies.yaml)
3. [Locations](/docs/api/endpoints/locations.yaml)
4. [Contacts](/docs/api/endpoints/contacts.yaml)
5. [Conversations](/docs/api/endpoints/conversations.yaml)
6. [Opportunities](/docs/api/endpoints/opportunities.yaml)
7. [Calendar](/docs/api/endpoints/calendar.yaml)
8. [Workflows](/docs/api/endpoints/workflows.yaml)
9. [Campaigns](/docs/api/endpoints/campaigns.yaml)
10. [Payments](/docs/api/endpoints/payments.yaml)
11. [Sites](/docs/api/endpoints/sites.yaml)
12. [AI](/docs/api/endpoints/ai.yaml)

## SDK Support

Official SDKs available for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby
- Go
- .NET

## Support

- Documentation: https://docs.gohighlevel-clone.com
- API Status: https://status.gohighlevel-clone.com
- Support: api-support@gohighlevel-clone.com
