# Documentation Automation Scripts

## Overview

This document describes scripts and automation tools for maintaining comprehensive documentation of the Invoice Generator application. These scripts help keep documentation up-to-date with code changes and provide automated validation.

## Automation Philosophy

### Goals
- **Consistency**: Maintain consistent documentation format and structure
- **Accuracy**: Ensure documentation matches actual implementation
- **Timeliness**: Update documentation automatically with code changes
- **Completeness**: Cover all aspects of the application

### Principles
- **DRY (Don't Repeat Yourself)**: Extract information from code and configuration
- **Automation First**: Automate repetitive documentation tasks
- **Validation**: Verify documentation accuracy automatically
- **Integration**: Integrate with development workflow

## Available Scripts

### 1. API Documentation Generator

**File:** `scripts/generate-api-docs.js`

**Purpose:** Automatically generate API documentation from API route files

**Usage:**
```bash
node scripts/generate-api-docs.js
```

**Features:**
- Parse API route files
- Extract endpoint information
- Generate OpenAPI/Swagger documentation
- Update API catalog automatically
- Validate endpoint documentation

**Requirements:**
- Node.js 18+
- API route files following standard patterns
- JSDoc comments in route files

**Output:**
- Updated `docs/API_CATALOG.md`
- OpenAPI specification file
- API validation report

---

### 2. Component Documentation Scanner

**File:** `scripts/scan-components.js`

**Purpose:** Scan React components and generate/update component documentation

**Usage:**
```bash
node scripts/scan-components.js
```

**Features:**
- Scan component files for props and usage
- Extract component documentation from comments
- Generate component usage examples
- Update component library documentation
- Identify undocumented components

**Requirements:**
- React component files
- Standard comment format
- TypeScript interface definitions

**Output:**
- Updated `docs/COMPONENT_LIBRARY.md`
- Component usage examples
- Undocumented components report

---

### 3. Database Schema Documentation

**File:** `scripts/generate-db-docs.js`

**Purpose:** Generate database schema documentation from migration files and current database state

**Usage:**
```bash
node scripts/generate-db-docs.js
```

**Features:**
- Parse SQL migration files
- Extract table and column information
- Generate ERD diagrams
- Update schema documentation
- Validate schema consistency

**Requirements:**
- Access to database connection
- Migration files in standard format
- SQL parsing capabilities

**Output:**
- Updated `docs/DATABASE_SCHEMA.md`
- Database schema diagrams
- Schema validation report

---

### 4. Architecture Documentation Updater

**File:** `scripts/update-architecture-docs.js`

**Purpose:** Update architecture documentation based on codebase analysis

**Usage:**
```bash
node scripts/update-architecture-docs.js
```

**Features:**
- Analyze project structure
- Identify dependencies and relationships
- Update architecture diagrams
- Generate technology stack summary
- Identify architectural changes

**Requirements:**
- File system access
- Dependency analysis tools
- Code structure parsing

**Output:**
- Updated `docs/ARCHITECTURE.md`
- Architecture diagrams
- Technology stack report

---

### 5. Documentation Validation Script

**File:** `scripts/validate-docs.js`

**Purpose:** Validate documentation completeness and consistency

**Usage:**
```bash
node scripts/validate-docs.js
```

**Features:**
- Check for broken links
- Validate code examples
- Check documentation coverage
- Identify outdated information
- Generate validation report

**Requirements:**
- Documentation files in Markdown format
- Link checking capabilities
- Code example validation

**Output:**
- Validation report
- Issues list
- Coverage metrics
- Recommendations

---

### 6. Migration History Tracker

**File:** `scripts/track-migrations.js`

**Purpose:** Track and document database migration history

**Usage:**
```bash
node scripts/track-migrations.js
```

**Features:**
- Scan migration files
- Extract migration information
- Update migration history
- Identify migration patterns
- Generate migration statistics

**Requirements:**
- Migration files in standard format
- Access to migration history
- SQL parsing capabilities

**Output:**
- Updated `docs/MIGRATIONS.md`
- Migration statistics
- Migration analysis report

---

### 7. Bug Fix Documentation

**File:** `scripts/document-bug-fixes.js`

**Purpose:** Automatically document bug fixes from commit messages and issue tracking

**Usage:**
```bash
node scripts/document-bug-fixes.js
```

**Features:**
- Parse commit messages for bug fixes
- Extract bug fix information
- Update bug fix documentation
- Categorize bug fixes
- Generate bug statistics

**Requirements:**
- Git repository access
- Issue tracking system integration
- Commit message parsing

**Output:**
- Updated `docs/BUG_FIXES.md`
- Bug fix statistics
- Bug trend analysis

---

## Automated Workflows

### 1. Pre-commit Documentation Validation

**Hook:** `.git/hooks/pre-commit`

**Purpose:** Validate documentation before allowing commits

**Implementation:**
```bash
#!/bin/bash
# Run documentation validation
node scripts/validate-docs.js

# Check validation result
if [ $? -ne 0 ]; then
    echo "Documentation validation failed. Please fix documentation issues before committing."
    exit 1
fi
```

**Features:**
- Prevent commits with broken documentation
- Ensure documentation completeness
- Validate code examples
- Check for broken links

---

### 2. Post-commit Documentation Update

**Hook:** `.git/hooks/post-commit`

**Purpose:** Update documentation after successful commits

**Implementation:**
```bash
#!/bin/bash
# Update API documentation if API files changed
if git diff --name-only HEAD~1 HEAD | grep -q "app/api/"; then
    node scripts/generate-api-docs.js
fi

# Update component documentation if component files changed
if git diff --name-only HEAD~1 HEAD | grep -q "components/"; then
    node scripts/scan-components.js
fi

# Commit documentation updates
git add docs/
git commit -m "docs: Update documentation [skip ci]"
```

**Features:**
- Automatic documentation updates
- Targeted updates based on changed files
- Skip CI for documentation-only commits
- Maintain documentation consistency

---

### 3. CI/CD Pipeline Integration

**File:** `.github/workflows/documentation.yml`

**Purpose:** Automated documentation validation and deployment

**Implementation:**
```yaml
name: Documentation Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Validate documentation
        run: node scripts/validate-docs.js

      - name: Generate documentation
        run: |
          node scripts/generate-api-docs.js
          node scripts/scan-components.js
          node scripts/generate-db-docs.js

      - name: Deploy documentation
        if: github.ref == 'refs/heads/main'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git commit -m "docs: Automated documentation update [skip ci]" || exit 0
          git push
```

**Features:**
- Automated validation on all PRs
- Documentation generation on main branch
- Automated deployment of documentation
- Quality gates for documentation

---

## Configuration Files

### 1. Documentation Configuration

**File:** `docs.config.json`

**Purpose:** Configure documentation generation and validation

**Structure:**
```json
{
  "api": {
    "basePath": "app/api",
    "outputFile": "docs/API_CATALOG.md",
    "format": "markdown",
    "includeExamples": true,
    "validateResponses": true
  },
  "components": {
    "basePath": "components",
    "outputFile": "docs/COMPONENT_LIBRARY.md",
    "includePropTypes": true,
    "generateExamples": true
  },
  "database": {
    "migrationPath": "supabase/migrations",
    "outputFile": "docs/DATABASE_SCHEMA.md",
    "generateDiagrams": true
  },
  "validation": {
    "checkLinks": true,
    "validateExamples": true,
    "requiredCoverage": 80,
    "failOnWarnings": false
  }
}
```

---

### 2. Script Configuration

**File:** `scripts/config.json`

**Purpose:** Configure script behavior and execution

**Structure:**
```json
{
  "outputFormat": "markdown",
  "includeSourceLinks": true,
  "generateExamples": true,
  "validationLevel": "strict",
  "excludePaths": [
    "node_modules",
    ".next",
    ".git"
  ],
  "templates": {
    "api": "templates/api-template.md",
    "component": "templates/component-template.md",
    "database": "templates/database-template.md"
  }
}
```

---

## Templates

### 1. API Documentation Template

**File:** `templates/api-template.md`

**Purpose:** Template for generating API endpoint documentation

**Structure:**
```markdown
### {endpoint}

**Method:** {method}
**Path:** `{path}`
**Description:** {description}

**Authentication:** Required
**Parameters:**
{parameters}

**Request Body:**
```json
{requestBody}
```

**Response:**
```json
{response}
```

**Status Codes:**
{statusCodes}

**Example:**
```javascript
{example}
```
```

---

### 2. Component Documentation Template

**File:** `templates/component-template.md`

**Purpose:** Template for generating component documentation

**Structure:**
```markdown
### {ComponentName}

**File:** `components/{path}/{ComponentName}.{ext}`

**Description:** {description}

**Props:**
{props}

**Usage:**
```jsx
{usageExample}
```

**Features:**
{features}

**Accessibility:**
{accessibilityInfo}
```

---

## Monitoring and Reporting

### 1. Documentation Health Dashboard

**File:** `scripts/generate-health-report.js`

**Purpose:** Generate documentation health and coverage report

**Usage:**
```bash
node scripts/generate-health-report.js
```

**Metrics Tracked:**
- Documentation coverage percentage
- Broken links count
- Outdated documentation items
- Code examples validation
- API documentation completeness

**Output:**
- Health report in Markdown format
- JSON data for integration with dashboards
- Recommendations for improvement

---

### 2. Documentation Change Tracking

**File:** `scripts/track-changes.js`

**Purpose:** Track documentation changes over time

**Usage:**
```bash
node scripts/track-changes.js
```

**Features:**
- Track documentation updates
- Identify frequently changing areas
- Monitor documentation growth
- Generate change statistics

**Output:**
- Change log
- Statistics report
- Trend analysis

---

## Best Practices

### 1. Script Development
- Use TypeScript for better type safety
- Implement comprehensive error handling
- Provide clear logging and progress feedback
- Make scripts configurable and flexible
- Include comprehensive testing

### 2. Documentation Maintenance
- Run validation scripts regularly
- Update documentation with code changes
- Review and improve scripts continuously
- Monitor documentation health metrics
- Keep templates up to date

### 3. Integration with Development Workflow
- Use pre-commit hooks for validation
- Automate documentation generation
- Include documentation in CI/CD pipeline
- Set up quality gates for documentation
- Provide feedback to developers

## Troubleshooting

### Common Issues

1. **Script Execution Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review script configuration
   - Check file permissions

2. **Documentation Generation Errors**
   - Verify source files exist and are accessible
   - Check template files are properly configured
   - Review configuration settings
   - Examine error logs for specific issues

3. **Validation Failures**
   - Review validation criteria
   - Check documentation format
   - Verify code examples are correct
   - Fix broken links and references

### Debug Mode

Enable debug mode by setting environment variable:
```bash
export DEBUG_DOCS=true
node scripts/generate-api-docs.js
```

### Logging

Scripts provide detailed logging:
- Standard output for progress
- Error logs for troubleshooting
- Report generation for audit trail
- JSON output for integration

---

## Future Enhancements

### 1. AI-Powered Documentation
- Natural language processing for documentation generation
- Automated description generation
- Intelligent content suggestions
- Automated documentation improvements

### 2. Advanced Visualization
- Interactive architecture diagrams
- 3D component relationship visualizations
- Real-time dependency graphs
- Interactive API documentation

### 3. Integration Development Tools
- VS Code extension for documentation
- IDE integration for real-time updates
- Browser extensions for documentation preview
- Mobile applications for documentation access

### 4. Collaboration Features
- Multi-user documentation editing
- Review and approval workflows
- Comment and discussion threads
- Documentation versioning and branching

---

**Document Status:** Active
**Last Updated:** 2025-09-25
**Total Scripts:** 7
**Integration Points:** 3
**Next Enhancement:** AI-powered documentation generation