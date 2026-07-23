# EUDPA-73: Skeleton: Search a notification 

## Metadata
- **Type:** Story
- **Status:** In Dev
- **Priority:** Medium
- **Labels:** CAP-0.3
- **Parent:** EUDPA-68
- **Assignee:** TarunKumar Palisetty

## Description

<p><b>As a</b> Trader<br/>
<b>I want</b> to search for a notification from the dashboard<br/>
<b>So that</b> I can quickly find a specific consignment.</p>


<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p><b>Description</b></p>

<p>This story introduces a basic search function on the dashboard to help traders find notifications more easily.</p>

<p>The initial implementation provides a simple search capability only. It is intended as a tactical solution and will be replaced by the strategic unified dashboard in a future release</p>
</div></div>



<p><b>Acceptance Criteria</b> </p>

<p><b>AC1 – Search by complete notification reference</b></p>

<p><b>Given</b> I am on the GBN-AGN dashboard<br/>
<b>And</b> a notification exists with a GBN-AGN reference<br/>
<b>When</b> I enter the complete GBN-AGN reference into the Keyword or reference search field<br/>
<b>Then</b> I should see only the matching notification in the search results</p>


<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/468622" alt="image-20260709-125027.png" width="666" style="border: 0px solid black" /></span></p>




<p><b>AC2 – No matching notification found</b></p>

<p><b>Given</b> I am on the GBN-AGN dashboard<br/>
<b>When</b> I enter a value into the Keyword or reference search field<br/>
<b>And</b> no notification exists that matches the search term entered<br/>
<b>Then</b> I should see the message “No notifications found”<br/>
<b>And</b> no notifications should be displayed in the results list</p>




<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p>notes</p>
</div></div>

## Acceptance Criteria

<!-- Extract from description above - look for "AC:", "Acceptance Criteria:", numbered lists, Given/When/Then -->

## Comments (1)

### Martyn Nevers (2026-07-17)
Once search is in place, update eligible flaky tests to search for notifications with the expected status instead of selecting randomly, e.g.:

{{tests/e2e/pages/notification-dashboard.spec.ts:}}

{noformat}  test('displays actions on the first notification card', async ({ pages }) => {
    // TODO: once dashboard filtering exists, add per-notification-status tests — actions may vary by status.
    const firstCard = pages.notificationDashboard.notificationCard(0);

    await expect(firstCard.actions.view).toBeVisible();
    //await expect(firstCard.actions.copyAsNew).toBeVisible();
  });{noformat}

## Confluence References


