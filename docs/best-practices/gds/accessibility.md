# GDS Accessibility

Based on [GOV.UK Design System](https://design-system.service.gov.uk/accessibility/).

## WCAG Principles (POUR)

| Principle | Meaning |
|-----------|---------|
| **Perceivable** | Information presentable to users |
| **Operable** | Navigation and components function |
| **Understandable** | Information and operations comprehensible |
| **Robust** | Works with various user agents and AT |

## Universal Design Principles

| Principle | Description |
|-----------|-------------|
| Equitable use | Design for diverse abilities |
| Flexibility | Accommodate preferences |
| Simple and intuitive | Easy to understand |
| Perceptible information | Accessible to all senses |
| Tolerance for error | Minimal mistake consequences |
| Low effort | Minimal physical/cognitive load |
| Appropriate sizing | Adequate interaction space |

## Progressive Enhancement

1. Start with semantic HTML
2. Ensure content accessible without CSS
3. JavaScript enhancements with accessible fallbacks

## Compliance

**Target:** WCAG 2.2 Level AA for all styles, components, patterns, content

**Beyond baseline (AAA):** Pursue when capacity exists and doesn't impact priorities

## Testing

### Automated (~30% of issues)
- WAVE browser plugin
- Axe browser plugin
- jest-axe, @axe-core/puppeteer
- Browser accessibility reports
- Developer tools inspection

### Manual
- Screen readers (NVDA, JAWS, VoiceOver)
- Screen magnifiers
- High contrast modes
- Speech recognition
- Keyboard-only navigation

### Checklist
- [ ] All interactive elements keyboard accessible
- [ ] Focus order logical
- [ ] Focus indicators visible
- [ ] Images have alt text
- [ ] Form fields have labels
- [ ] Errors announced to screen readers
- [ ] Colour contrast 4.5:1 for text
- [ ] Content understandable without colour
- [ ] Works at 400% zoom
- [ ] Content reflows on small screens

## Assistive Technologies

| Technology | Examples |
|------------|----------|
| Screen readers | NVDA, JAWS, VoiceOver, TalkBack |
| Screen magnifiers | ZoomText, Windows Magnifier |
| Speech recognition | Dragon, Voice Control |
| Alternative input | Switch devices, eye tracking |

## Common Issues

### Forms
- Missing/incorrect labels
- Errors not associated with fields
- Required fields not indicated
- Missing autocomplete attributes

### Navigation
- Skip links missing/broken
- Focus not managed after updates
- Keyboard traps
- Inconsistent navigation

### Content
- Missing heading structure
- Images without alt text
- Links unclear out of context
- Complex language

### Visual
- Insufficient colour contrast
- Information by colour alone
- Text cannot be resized
- Content doesn't reflow

## Implementation Checklist

- [ ] Semantic HTML used correctly
- [ ] ARIA only when necessary
- [ ] All functionality works with keyboard
- [ ] Focus management correct
- [ ] Screen reader testing completed
- [ ] Colour contrast meets requirements
- [ ] Works at 400% zoom
- [ ] Error handling accessible
- [ ] Loading states announced
- [ ] Timeouts give adequate warning

## Legal Requirements

- Public Sector Bodies Accessibility Regulations 2018
- Equality Act 2010
- WCAG 2.2 Level AA
