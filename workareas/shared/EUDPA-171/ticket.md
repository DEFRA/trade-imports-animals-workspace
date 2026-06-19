# EUDPA-171: Amend notification

## Metadata
- **Type:** Story
- **Status:** In Dev
- **Priority:** Medium
- **Labels:** Skeleton
- **Parent:** EUDPA-68
- **Assignee:** Hamid Jemei

## Description

<p><b>As a</b> Trader<br/>
<b>I want</b> to amend a previously submitted notification<br/>
<b>So that</b> I can correct information and resubmit where required</p>


<hr />

<p><b>Description</b></p>

<p>This story allows traders to amend a previously submitted notification by without needing to create a <b>new version of the existing GBN</b></p>

<p>Out of scope: notification locking, hiding amend button based on business rules </p>


<p><ins>Useful Aetefacts</ins></p>

<p>UX Link - <a href="https://notification-service-prototype-d3f240cf1e48.herokuapp.com/v1-baseline/dashboard" class="external-link" rel="nofollow noreferrer">https://notification-service-prototype-d3f240cf1e48.herokuapp.com/v1-baseline/dashboard</a>  </p>

<p>User Flow link - <a href="https://lucid.app/lucidchart/1a4400d0-5b9f-434e-bf70-0802128d4457/edit?viewport_loc=-1465%2C558%2C4658%2C2492%2C0_0&amp;invitationId=inv_fd0a342a-e90f-4ba3-a978-7d77d4103baa" class="external-link" rel="nofollow noreferrer">https://lucid.app/lucidchart/1a4400d0-5b9f-434e-bf70-0802128d4457/edit?viewport_loc=-1465%2C558%2C4658%2C2492%2C0_0&amp;invitationId=inv_fd0a342a-e90f-4ba3-a978-7d77d4103baa</a></p>



<p><ins>AGN-LA State Machine</ins></p>

<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/459506" alt="Screenshot 2026-06-01 at 23.28.06.png" width="321" style="border: 0px solid black" /></span></p>

<hr />

<p><ins><b>Acceptance Criteria</b></ins> </p>


<p><b>AC1 – Display amend option via</b> <ins><b>dashboard</b></ins></p>

<p><b>Given</b> I am on the dashboard<br/>
<b>And</b> the notification is in a status of <ins>submitted</ins><br/>
<b>Then</b> I should see the “Amend” action against each notification </p>




<p><b>AC2 – Display amend option via</b> <ins><b>notification view</b></ins> <b>screen</b> </p>

<p><b>Given</b> I have selected View for a notification from the dashboard<br/>
<b>And</b> the notification is in a status of <ins>submitted</ins><br/>
<b>Then</b> I should see amend action </p>


<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/459505" alt="Screenshot 2026-05-22 at 09.58.04.png" width="517" style="border: 0px solid black" /></span></p>


<p><b>AC3 – Display amend option via notification view screen</b> </p>

<p><b>Given</b> I have selected to “Amend” a notification (via dashboard or notification view screen)<br/>
<b>Then</b> I am taken to the notification view page (<a href="https://eaflood.atlassian.net/browse/EUDPA-134" title="smart-link" class="external-link" rel="nofollow noreferrer">https://eaflood.atlassian.net/browse/EUDPA-134</a> <br/>
<b>And</b> the notification status should be “Amend”<br/>
<b>And</b> I should see a Change link for each page within the notification journey<br/>
<b>And</b> every amendment i make to the notification should be persisted on selecting 'Save and Continue</p>




<p><b>AC4 – Display CTAs on the notification view page</b></p>

<p><b>Given</b> I have selected amend (via dashboard or view notification screen)<br/>
<b>When</b> I am navigated to the view notification page <br/>
<b>Then</b> the following buttons are displayed:</p>



<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/459653" alt="Screenshot 2026-06-02 at 14.29.42.png" width="521" style="border: 0px solid black" /></span></p>



<p><b>AC4 – Resubmit notification</b> </p>

<p><b>Given</b> I am on the view notification page<br/>
<b>And</b> the notification is in Amend status<br/>
<b>When</b> I select Confirm and submit<br/>
<b>Then</b> I should be taken to the declaration page<br/>
<b>And</b> when I submit the declaration<br/>
<b>Then</b> the notification status should update to Submitted</p>



<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/463535" alt="Screenshot 2026-06-16 at 16.05.05.png" width="702" style="border: 0px solid black" /></span></p>




<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p>Out of scope</p>

<p>Any business rules to hide change links based on date of arrival (soft locking) <br/>
Cancelling an amendment </p>
</div></div>

## Acceptance Criteria

<!-- Extract from description above - look for "AC:", "Acceptance Criteria:", numbered lists, Given/When/Then -->

## Comments (1)

### Syed Islam (2026-05-21)
Given the proposed integration with PIMS will update on amend events, we need to re-visit the need to show the trader the versioning number - [~accountid:635ffa757d4645af4f033f9c] to confirm if this req can be dropped 

User will still be able to amend as per business rules 

[~accountid:712020:f440cc12-4d45-4ee5-86ca-4a3fd83f06ef] user needs to be able to cancel out of an amend without having to re-submit 

## Confluence References


