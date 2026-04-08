# GDS Components

Based on [GOV.UK Design System](https://design-system.service.gov.uk/components/).

## Navigation
| Component | Description |
|-----------|-------------|
| Back link | Return to previous page |
| Breadcrumbs | Hierarchical navigation |
| Pagination | Navigate between pages |
| Service navigation | Primary menu |
| Skip link | Skip to main content |
| Exit this page | Emergency exit |

## Form Inputs
| Component | Description |
|-----------|-------------|
| Button | Clickable action |
| Checkboxes | Multiple selection |
| Date input | Date entry |
| File upload | Document submission |
| Password input | Secure entry with show/hide |
| Radios | Single selection |
| Select | Dropdown |
| Text input | Single-line text |
| Textarea | Multi-line text |
| Character count | Text with limit tracking |

## Form Structure
| Component | Description |
|-----------|-------------|
| Fieldset | Group related fields |
| Error message | Field validation feedback |
| Error summary | All errors at page top |

## Content Display
| Component | Description |
|-----------|-------------|
| Accordion | Expandable sections |
| Details | Show/hide content |
| Inset text | Important information box |
| Panel | Confirmation container |
| Summary list | Key-value display |
| Table | Data rows/columns |
| Tabs | Tabbed content |
| Tag | Category label |
| Warning text | Alert message |

## Page Structure
| Component | Description |
|-----------|-------------|
| GOV.UK header | Crown branding |
| GOV.UK footer | Standard links |
| Phase banner | Alpha/beta/live |
| Cookie banner | Consent notification |
| Notification banner | Announcements |

## Progress
| Component | Description |
|-----------|-------------|
| Task list | Progress checklist |

## Usage Guidelines

- Always use GOV.UK components as starting point
- Tested with users, meet accessibility standards
- Adapt only when research shows need
- Contribute improvements back

## Examples

### Button
```html
<button class="govuk-button" data-module="govuk-button">
  Save and continue
</button>
```

### Text Input
```html
<div class="govuk-form-group">
  <label class="govuk-label" for="event-name">Event name</label>
  <input class="govuk-input" id="event-name" name="eventName" type="text">
</div>
```

### Error Message
```html
<div class="govuk-form-group govuk-form-group--error">
  <label class="govuk-label" for="event-name">Event name</label>
  <p class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> Enter an event name
  </p>
  <input class="govuk-input govuk-input--error" id="event-name" name="eventName" type="text">
</div>
```

## Accessibility

All components:
- Work with assistive technologies
- Meet WCAG 2.2 AA
- Support keyboard navigation
- Provide ARIA attributes
