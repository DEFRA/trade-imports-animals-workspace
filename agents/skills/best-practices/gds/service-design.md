# GDS Service Design

Based on [GOV.UK Service Manual](https://www.gov.uk/service-manual/design).

## 13 Characteristics of Good Services

1. **Complete user journey** - start to finish, seamless
2. **Minimal steps** - postcode lookups, pre-populated fields
3. **No dead ends** - always clear next step
4. **Easy human support** - phone, email, face-to-face
5. **Hidden complexity** - users see one unified service
6. **Discoverable** - findable via natural searches
7. **Clear purpose** - what it does, eligibility, timelines, costs
8. **Transparent decisions** - explain algorithms, allow challenges
9. **Consistent** - uniform styles, data, language across channels
10. **Familiar conventions** - use established patterns
11. **Universal accessibility** - no exclusion through design
12. **Respectful** - balance security with usability
13. **User-centric framing** - reflect what user wants to do

## Service Scoping

**Avoid extremes:** Too broad = confusing; Too narrow = incomplete
**Align with user perspective:** Tasks users would recognise
**One task per transaction:** Only combine if users perceive as one
**Ignore org constraints:** Users shouldn't need to understand government structure

## Naming Services

**Good names:**
- Use words users use
- Based on analytics and research
- Describe a task, not technology
- Are verbs: Register to vote, Renew your passport

**Avoid:**
- Department/agency names
- Brand-driven names
- Names that change with policy

## Inclusive Design

### Legal Requirements
Equality Act 2010, Welsh language scheme

### Common Barriers
| Barrier | Problem |
|---------|---------|
| Channel limitations | Restricts communication methods |
| Inflexible deadlines | Excludes unstable circumstances |
| Limited evidence types | Harms marginalised populations |
| Poor referrals | Discourages future engagement |

## Form Structure

### Core Principles
- Justify every question
- Start with eligibility screening
- Conditional branching - users only see relevant questions

### One Thing Per Page
Start with single-purpose pages:
- One piece of information
- One decision
- One question

**Benefits:** Mobile-friendly, auto-save, per-question analytics, error recovery

## Designing Good Questions

### Prefer Closed Questions
- "Do you live at more than one address?" (good)
- "Tell us about your living arrangements" (avoid)

### Allow Uncertainty
- Option for "I'm not sure" or "I don't know"

### Help Text
Only when research shows need. Keep brief - users rarely read >3 lines.

### Error Messages
- Tolerant validation
- Specific per field
- Instruct how to fix, not what went wrong

## Writing for UI

### Core Principles
- Minimise cognitive load
- Start minimal - add help only when research justifies

### Keep It Short
| Avoid | Use |
|-------|-----|
| This is the total cost | Total cost |
| You have entered the wrong password | Wrong password |
| apply now | apply |

### Tone
- Approachable, not familiar
- "Sorry" only for serious failures
- No apologies in validation errors
- Avoid "please", "please note"
- Never use humour

### Accessibility
- Don't reference colours/positions
- Clear link purpose from text
- Avoid "click here"

### Contractions
**Use:** you're, we'll
**Avoid:** should've, could've, can't, don't

## Confirmation Pages

Required elements:
1. Reference number
2. Next steps - what and when
3. Contact information
4. Relevant links
5. Feedback link
6. Transaction record (PDF option)

## Emails and Text Messages

### Transactional (no permission needed)
Direct responses to user actions

### Subscription (explicit permission)
Always provide unsubscribe

### Security
- Exclude sensitive info
- Avoid requesting personal data
- Only GOV.UK domain links
- Skip attachments and tracking
- Include sender ID and contact

### Writing
- Personalise with names
- Single key message
- Clear deadlines
- Explain consequences
