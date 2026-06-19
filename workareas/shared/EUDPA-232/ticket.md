# EUDPA-232: Consignment Address page

## Metadata
- **Type:** Story
- **Status:** In Dev
- **Priority:** Lowest
- **Labels:** CAP-04.2, CORE-CAP-04.1
- **Parent:** EUDPA-107
- **Assignee:** Ian Griffiths

## Description

<p><b>As</b> a Trader<br/>
<b>I want</b> to view the available operator sections for my consignment<br/>
<b>So that</b> I can understand which parties will need to be provided</p>


<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p><b>Description</b></p>

<p>This story builds on Skeleton | Addresses landing page. It introduces the operator sections that will be displayed on the Addresses page.</p>

<p>As <ins>County Parish Holding (CPH) information</ins> is now included within the Addresses page, the standalone CPH page is no longer required. The journey should therefore navigate directly to the Port of Entry page.</p>
</div></div>





<p><ins><b>Acceptance Criteria</b></ins> </p>


<p><b>AC1 – Display operator options on Addresses page</b></p>

<p><b>Given</b> I have navigated from the accompanying documents page<br/>
<b>When</b> the Addresses page loads<br/>
<b>Then</b> I should see the following operator sections:</p>

<ul>
	<li>Place of origin</li>
	<li>Consignor or exporter</li>
	<li>Consignee</li>
	<li>Importer</li>
	<li>Place of destination</li>
	<li>County Parish Holding number (CPH)</li>
</ul>


<p><b>And</b> the option to add an operator is visible </p>





<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/461687" alt="chrome-capture-2026-06-10.png" width="622" style="border: 0px solid black" /></span></p>



<p><b>AC2 – Continue journey</b></p>


<p><b>When</b> I click Save and continue<br/>
<b>Then</b> I am navigated to the next page in the journey (<a href="https://eaflood.atlassian.net/browse/EUDPA-120" title="smart-link" class="external-link" rel="nofollow noreferrer">https://eaflood.atlassian.net/browse/EUDPA-120</a> )</p>

<p>Note - County Parish Holding (CPH) information is now included on the Addresses page. The standalone CPH page is no longer required and should be removed from the journey. Users should therefore navigate directly from Addresses to Port of Entry</p>




<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p>Refinement Notes</p>
</div></div>

## Acceptance Criteria

<!-- Extract from description above - look for "AC:", "Acceptance Criteria:", numbered lists, Given/When/Then -->

## Comments (0)



## Confluence References


