# EUDPA-209: Update govuk parent layout to use govuk-grid-column-full

## Metadata
- **Type:** Story
- **Status:** In Dev
- **Priority:** Medium
- **Labels:** Skeleton
- **Parent:** EUDPA-133
- **Assignee:** TarunKumar Palisetty

## Description

<p>Update all view pages to use <tt>govuk-grid-column-full</tt> in the parent layout</p>

<hr />

<p><b>Description:</b></p>

<p>Currently the content column width (<tt>govuk-grid-column-*</tt>) is duplicated across and the <tt>appHeading</tt> component, making site-wide layout changes error-prone. This story is to update the parent layout shared <tt>layouts/page.njk</tt> to <tt>govuk-grid-column-full</tt> so width is defined in one place.</p>



<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p>Refinement Notes</p>



<ol>
	<li>Should every current `govuk-grid-column-two-thirds` wrapper in view templates be removed, or only the duplicated parent/app heading ownership?</li>
	<li>Are there specific pages that must remain constrained to two-thirds width?</li>
</ol>


<ol>
	<li>Should this ticket include visual regression/manual browser checks, or only template/component test coverage?</li>
</ol>
</div></div>

## Acceptance Criteria

<!-- Extract from description above - look for "AC:", "Acceptance Criteria:", numbered lists, Given/When/Then -->

## Comments (0)



## Confluence References


