# DiLer Integration Plan

## Overview

This document outlines the plan to integrate Club Selection into [DiLer (Digitale Lernumgebung)](https://www.digitale-lernumgebung.de/), an open-source Learning Management System built on the Joomla framework.

The integration will create a Joomla module that embeds Club Selection via an iframe, automatically generating the student token from the logged-in user's email address.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         DiLer (Joomla)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Club Selection Module                   │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  1. Get user email via JFactory::getUser()  │    │    │
│  │  │  2. Generate token (SHA-256 hash, 12 chars) │    │    │
│  │  │  3. Render iframe with token in URL         │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                        │                             │    │
│  │                        ▼                             │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  <iframe src="https://clubselection.        │    │    │
│  │  │    example.com/embed?token=abc123def456">   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Club Selection Server                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GET /embed?token=abc123def456&project=xyz          │    │
│  │  - Validates token                                   │    │
│  │  - Returns student enrollment view                   │    │
│  │  - Styled for iframe embedding                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Club Selection Backend Changes

#### 1.1 Create Embed-Friendly Endpoint
Create a new route `/embed` that serves a minimal, iframe-optimized version of the student view.

**File:** `packages/backend/src/routes/embed.ts`

```typescript
// New route for iframe embedding
router.get('/embed', async (req, res) => {
    const { token, project } = req.query;
    // Validate token, return student's project enrollment view
    // Set appropriate headers for iframe embedding
});
```

#### 1.2 Add CORS Configuration for DiLer Domain
Update CORS to allow requests from the DiLer domain.

**File:** `packages/backend/src/index.ts`

```typescript
app.use(cors({
    origin: [
        process.env.DILER_ORIGIN || 'https://your-diler-instance.de',
        // Allow localhost for development
        'http://localhost:5173'
    ],
    credentials: true
}));
```

#### 1.3 Add X-Frame-Options Header
Allow iframe embedding from trusted DiLer domains.

```typescript
app.use((req, res, next) => {
    // Allow framing from DiLer domain
    res.setHeader('Content-Security-Policy',
        `frame-ancestors 'self' ${process.env.DILER_ORIGIN || 'https://your-diler-instance.de'}`
    );
    next();
});
```

#### 1.4 Create Embed-Specific Frontend View
Create a streamlined Vue component for iframe embedding without navigation chrome.

**File:** `packages/frontend/src/views/Embed.vue`

- Minimal UI (no header/footer)
- Auto-login via token in URL
- Display project selection or enrollment status
- Responsive for various iframe sizes

### Phase 2: Joomla Module Development

#### 2.1 Module Structure

```
mod_clubselection/
├── mod_clubselection.php          # Main module entry point
├── mod_clubselection.xml          # Module manifest
├── helper.php                     # Helper class for token generation
├── tmpl/
│   └── default.php                # Template file (renders iframe)
└── language/
    ├── en-GB/
    │   └── en-GB.mod_clubselection.ini
    └── de-DE/
        └── de-DE.mod_clubselection.ini
```

#### 2.2 Main Module File

**File:** `mod_clubselection.php`

```php
<?php
defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\ModuleHelper;

// Get current user
$user = Factory::getUser();

// Check if user is logged in
if ($user->guest) {
    return; // Don't show module to guests
}

// Get module parameters
$clubselectionUrl = $params->get('clubselection_url', 'https://clubselection.example.com');
$projectId = $params->get('project_id', '');
$height = $params->get('height', '600');

// Generate token from user email
require_once __DIR__ . '/helper.php';
$token = ModClubselectionHelper::generateToken($user->email);

// Include template
require ModuleHelper::getLayoutPath('mod_clubselection', $params->get('layout', 'default'));
```

#### 2.3 Helper Class (Token Generation)

**File:** `helper.php`

```php
<?php
defined('_JEXEC') or die;

class ModClubselectionHelper
{
    /**
     * Generate student token from email
     * MUST match the algorithm in Club Selection backend
     *
     * @param string $email User's email address
     * @return string 12-character token
     */
    public static function generateToken(string $email): string
    {
        // Normalize: lowercase and trim (matches backend algorithm)
        $normalized = strtolower(trim($email));

        // SHA-256 hash, first 12 characters
        $hash = hash('sha256', $normalized);

        return substr($hash, 0, 12);
    }
}
```

#### 2.4 Template File

**File:** `tmpl/default.php`

```php
<?php
defined('_JEXEC') or die;

// Build iframe URL
$iframeUrl = $clubselectionUrl . '/embed?token=' . htmlspecialchars($token);
if (!empty($projectId)) {
    $iframeUrl .= '&project=' . htmlspecialchars($projectId);
}
?>

<div class="mod-clubselection">
    <iframe
        src="<?php echo $iframeUrl; ?>"
        width="100%"
        height="<?php echo (int)$height; ?>px"
        frameborder="0"
        allow="clipboard-write"
        style="border: none; border-radius: 8px;"
        title="Club Selection">
        <p>Your browser does not support iframes.</p>
    </iframe>
</div>
```

#### 2.5 Module Manifest

**File:** `mod_clubselection.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<extension type="module" version="4.0" client="site" method="upgrade">
    <name>mod_clubselection</name>
    <author>Your Name</author>
    <creationDate>2024</creationDate>
    <copyright>CC BY-NC-SA 4.0</copyright>
    <license>CC BY-NC-SA 4.0</license>
    <authorEmail>your@email.com</authorEmail>
    <version>1.0.0</version>
    <description>MOD_CLUBSELECTION_DESC</description>

    <files>
        <filename module="mod_clubselection">mod_clubselection.php</filename>
        <filename>helper.php</filename>
        <folder>tmpl</folder>
        <folder>language</folder>
    </files>

    <config>
        <fields name="params">
            <fieldset name="basic">
                <field
                    name="clubselection_url"
                    type="url"
                    label="MOD_CLUBSELECTION_URL_LABEL"
                    description="MOD_CLUBSELECTION_URL_DESC"
                    default="https://clubselection.example.com"
                    required="true"
                />
                <field
                    name="project_id"
                    type="text"
                    label="MOD_CLUBSELECTION_PROJECT_LABEL"
                    description="MOD_CLUBSELECTION_PROJECT_DESC"
                    default=""
                />
                <field
                    name="height"
                    type="number"
                    label="MOD_CLUBSELECTION_HEIGHT_LABEL"
                    description="MOD_CLUBSELECTION_HEIGHT_DESC"
                    default="600"
                    min="200"
                    max="2000"
                />
            </fieldset>
        </fields>
    </config>
</extension>
```

### Phase 3: Environment Configuration

#### 3.1 Add DiLer-Related Environment Variables

**File:** `packages/backend/.env`

```env
# DiLer Integration
DILER_ORIGIN=https://your-diler-instance.de
EMBED_ALLOWED_ORIGINS=https://your-diler-instance.de,https://another-allowed-domain.de
```

#### 3.2 Docker Compose Update

**File:** `docker-compose.yml`

```yaml
environment:
  - DILER_ORIGIN=${DILER_ORIGIN:-https://your-diler-instance.de}
  - EMBED_ALLOWED_ORIGINS=${EMBED_ALLOWED_ORIGINS:-}
```

### Phase 4: Security Considerations

#### 4.1 Token Security
- Tokens are one-way hashes (cannot reverse to email)
- 12-character tokens provide 48 bits of entropy (sufficient for non-critical data)
- Consider adding a shared secret for HMAC if higher security is needed

#### 4.2 CORS & Frame Security
- Restrict `frame-ancestors` to specific DiLer domains
- Use HTTPS only in production
- Validate `Referer` header for embed requests

#### 4.3 Rate Limiting
- Add rate limiting to `/embed` endpoint
- Prevent token enumeration attacks

#### 4.4 Optional: Signed Tokens
For higher security, implement signed tokens:

```php
// DiLer side (PHP)
$timestamp = time();
$payload = $email . '|' . $timestamp;
$signature = hash_hmac('sha256', $payload, $sharedSecret);
$token = base64_encode($payload . '|' . $signature);
```

```typescript
// Club Selection side (TypeScript)
// Verify signature and check timestamp is recent
```

## Implementation Checklist

### Backend Changes
- [ ] Create `/api/embed` route
- [ ] Create `/embed` frontend route
- [ ] Add `Embed.vue` component (minimal UI)
- [ ] Configure CORS for DiLer origin
- [ ] Add `Content-Security-Policy` frame-ancestors header
- [ ] Add environment variables for DiLer integration
- [ ] Update Docker configuration

### Joomla Module
- [ ] Create module directory structure
- [ ] Implement `mod_clubselection.php`
- [ ] Implement `helper.php` with token generation
- [ ] Create `tmpl/default.php` template
- [ ] Create `mod_clubselection.xml` manifest
- [ ] Add language files (EN, DE)
- [ ] Test installation on Joomla/DiLer

### Testing
- [ ] Verify token generation matches between PHP and TypeScript
- [ ] Test iframe embedding from DiLer
- [ ] Test with different screen sizes
- [ ] Verify CORS headers work correctly
- [ ] Test with logged-in and guest users
- [ ] Security review

### Documentation
- [ ] Update README with DiLer integration info
- [ ] Create installation guide for DiLer admins
- [ ] Document configuration options

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `packages/backend/src/routes/embed.ts` | Embed API endpoint |
| `packages/frontend/src/views/Embed.vue` | Iframe-optimized view |
| `joomla-module/mod_clubselection/` | Complete Joomla module |

### Modified Files
| File | Changes |
|------|---------|
| `packages/backend/src/index.ts` | Add CORS config, frame headers, embed route |
| `packages/frontend/src/router/index.ts` | Add `/embed` route |
| `docker-compose.yml` | Add DiLer environment variables |
| `.env.example` | Add DiLer configuration |

## References

- [DiLer Documentation](https://docs.digitale-lernumgebung.de/)
- [Joomla Module Development](https://docs.joomla.org/module)
- [Joomla Wrapper Module](https://docs.joomla.org/Help5.x:Site_Modules:_Wrapper/en)
- [Passing User Data to iFrame](https://stackoverflow.com/questions/9268225/how-to-pass-joomla-parameters-to-an-iframe-wrapper-page)
- [Joomla User Object](https://docs.joomla.org/accessing_the_current_user_object)
