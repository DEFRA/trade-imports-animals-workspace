# GDS Styles

Based on [GOV.UK Design System](https://design-system.service.gov.uk/styles/).

## Typeface

**Primary:** GDS Transport (service.gov.uk)
**Alternative:** Helvetica or Arial (other subdomains)

## Colours

### Text
| Colour | Hex | Usage |
|--------|-----|-------|
| Primary | `#0b0c0c` | Main body |
| Secondary | `#505a5f` | Supporting |

### Links
| State | Hex |
|-------|-----|
| Default | `#1d70b8` |
| Hover | `#003078` |
| Visited | `#4c2c92` |
| Active | `#0b0c0c` |

### Functional
| Colour | Hex | Usage |
|--------|-----|-------|
| Focus | `#ffdd00` | Focus indicator only |
| Error | `#d4351c` | Error messages |
| Success | `#00703c` | Success messages |
| Border | `#b1b4b6` | Standard borders |

Use Sass variables (e.g., `$govuk-brand-colour`) not hex values.

## Headings

### Standard Pages
| Element | Class |
|---------|-------|
| h1 | `govuk-heading-l` |
| h2 | `govuk-heading-m` |
| h3 | `govuk-heading-s` |

### Content-Heavy Pages
| Element | Class |
|---------|-------|
| h1 | `govuk-heading-xl` |
| h2 | `govuk-heading-l` |
| h3 | `govuk-heading-m` |

Use sentence case for all headings.

## Paragraphs

| Class | Size | Usage |
|-------|------|-------|
| `govuk-body-l` | 24px | Lead paragraphs (max one/page) |
| `govuk-body` | 19px | Standard (default) |
| `govuk-body-s` | 16px | Secondary |

Keep most text at 19px.

## Layout

- Mobile-first
- Single-column default
- Max width: 1020px
- ~75 characters per line

### Grid
| Class | Width |
|-------|-------|
| `govuk-grid-column-full` | 100% |
| `govuk-grid-column-two-thirds` | ~67% |
| `govuk-grid-column-one-half` | 50% |
| `govuk-grid-column-one-third` | ~33% |
| `govuk-grid-column-one-quarter` | 25% |

```html
<div class="govuk-grid-row">
  <div class="govuk-grid-column-two-thirds">Main</div>
  <div class="govuk-grid-column-one-third">Sidebar</div>
</div>
```

## Spacing

Responsive scale (adapts at 640px):

| Unit | Small | Large |
|------|-------|-------|
| 0-3 | Same | Same |
| 4 | 15px | 20px |
| 5 | 15px | 25px |
| 6 | 20px | 30px |
| 7 | 25px | 40px |
| 8 | 30px | 50px |
| 9 | 40px | 60px |

### Override Classes
```html
<p class="govuk-body govuk-!-margin-bottom-6">Text</p>
<p class="govuk-body govuk-!-static-margin-bottom-6">Consistent 30px</p>
```

## Utility Classes

### Display
| Class | Effect |
|-------|--------|
| `govuk-!-display-block` | Block |
| `govuk-!-display-none` | Hide |
| `govuk-visually-hidden` | Hidden but accessible |

## Do

- Use GOV.UK colour palette
- Use Sass variables
- Design mobile-first
- Sentence case headings
- 19px body text
- Responsive spacing

## Don't

- Reassign colour meanings
- Modify button styles
- Change form input borders
- Use colours outside palette
- Create custom heading styles
