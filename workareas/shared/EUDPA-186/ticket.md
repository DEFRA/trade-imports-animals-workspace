# EUDPA-186: Filtering the address book

## Metadata
- **Type:** Story
- **Status:** In Dev
- **Priority:** Medium
- **Labels:** 
- **Parent:** EUDPA-58
- **Assignee:** TarunKumar Palisetty

## Description

<p><b>As a</b> Trader<br/>
<b>I want</b> to filter my organisation's address book<br/>
<b>So that</b> I can quickly find an address without paging through the whole list</p>

<div class="panel" style="background-color: #deebff;border-width: 1px;"><div class="panelContent" style="background-color: #deebff;">
<p><b>Description</b></p>

<p>Addresses belong to the organisation, so the list can be long - every address<br/>
every colleague has ever saved. Paging through it is slow.</p>

<p>This story adds a search to the Address book page.</p>

<p>Depends on <a href="https://eaflood.atlassian.net/browse/EUDPA-287" class="external-link" rel="nofollow noreferrer">EUDPA-287</a> for the<br/>
page and the list endpoint. Impacted by<br/>
<a href="https://eaflood.atlassian.net/browse/EUDPA-271" class="external-link" rel="nofollow noreferrer">EUDPA-271</a>.</p>
</div></div>

<p><b>Acceptance Criteria</b></p>

<p><b>AC1 - Search the address book</b></p>

<p><b>Given</b> I am on the Address book page<br/>
<b>Then</b> I should see a search field<br/>
<b>When</b> I enter a search term and submit<br/>
<b>Then</b> I should see only the addresses that match<br/>
<b>And</b> I should see how many results were found<br/>
<b>And</b> I should be able to clear the search and return to the full list</p>

<p><b>AC2 - What is searched</b></p>

<p><b>Given</b> I search the address book<br/>
<b>When</b> my term matches any of the following on an address</p>
<ul>
	<li>name or organisation name</li>
	<li>town or city</li>
	<li>postcode</li>
	<li>country</li>
</ul>


<p><b>Then</b> that address should appear in the results</p>

<p><b>AC3 - Search is not case sensitive and matches partial words</b></p>

<p><b>Given</b> an address named "Green Valley Livestock Farm"<br/>
<b>When</b> I search for <tt>green valley</tt><br/>
<b>Then</b> that address should appear in the results<br/>
<b>And</b> searching for <tt>GREEN</tt> should also return it</p>

<p><b>AC4 - No results</b></p>

<p><b>Given</b> I search for a term that matches nothing<br/>
<b>Then</b> I should see a message telling me no addresses match<br/>
<b>And</b> I should see my search term so I can correct it<br/>
<b>And</b> I should be able to clear the search</p>

<p><b>AC5 - Results are organisation-scoped</b></p>

<p><b>Given</b> I search the address book<br/>
<b>Then</b> I should only see addresses belonging to my organisation</p>

<p><b>AC6 - Deleted addresses are not returned</b></p>

<p><b>Given</b> an address has been deleted<br/>
<b>When</b> I search for it by name<br/>
<b>Then</b> it should not appear in the results</p>

<p><b>AC7 - Results paginate</b></p>

<p><b>Given</b> my search returns more than 25 addresses<br/>
<b>Then</b> I should see the first 25<br/>
<b>And</b> I can page through the rest<br/>
<b>And</b> paging should keep my search term</p>

<div class="panel" style="background-color: #eae6ff;border-width: 1px;"><div class="panelContent" style="background-color: #eae6ff;">
<p><b>Tech notes</b></p>
<ul>
	<li>Extends the list endpoint from 
    <span class="jira-issue-macro" data-jira-key="EUDPA-287" >
                <a href="https://eaflood.atlassian.net/browse/EUDPA-287" class="jira-issue-macro-key issue-link"  title="Adding a new address via address book" >
            <img class="icon" src="https://eaflood.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium" />
            EUDPA-287
        </a>
                                                    <span class="aui-lozenge aui-lozenge-subtle aui-lozenge-current jira-macro-single-issue-export-pdf">IN QA</span>
            </span>
 -<br/>
  <tt>GET /organisation/{orgId}/addresses?q={term</tt>} - rather than adding a<br/>
  separate search endpoint. Same org scoping, same server-side page size (25,<br/>
  from config). Search must not introduce a second pagination rule.</li>
	<li>Search server-side, not by filtering a fully-loaded list in the browser. The<br/>
  whole point is that the list is too big to load.</li>
	<li>MongoDB text index across <tt>name</tt>, <tt>townOrCity</tt>, <tt>postcode</tt> and<br/>
  <tt>countryCode</tt>. Confirm the field list with UX - AC2 is an inference from the<br/>
  current ticket's "name, address or country".</li>
	<li>Search must be org-scoped in the query itself, not by filtering results after<br/>
  the fact.</li>
	<li>Use the <tt>govuk-frontend</tt> search input. No custom component.</li>
	<li><b>There is no filter-by-type</b> - addresses are untyped, so the service cannot<br/>
  filter on a role (D21). Text search is the only filter.</li>
</ul>
</div></div>

<div class="panel" style="background-color: #fffae6;border-width: 1px;"><div class="panelContent" style="background-color: #fffae6;">
<p><b>Prototype reference - the removed type filter</b></p>

<p>The screenshot below is the prototype's "Filter by Operator type" screen. This ticket does <b>not</b> build a type filter: addresses are untyped, so there is nothing to filter by role. Kept for reference while the type decision is open - whether operator types are eventually added to the address book, or the prototype drops them, is not yet decided.</p>

<p><span class="image-wrap" style=""><img src="https://eaflood.atlassian.net/rest/api/3/attachment/content/469917" width="548" style="border: 0px solid black" /></span></p>
</div></div>

## Acceptance Criteria

<!-- Extract from description above - look for "AC:", "Acceptance Criteria:", numbered lists, Given/When/Then -->

## Comments (1)

### TarunKumar Palisetty (2026-08-06)
PR for the change
[https://github.com/DEFRA/trade-imports-address-book/pull/2|https://github.com/DEFRA/trade-imports-address-book/pull/2|smart-link] 

[https://github.com/DEFRA/trade-imports-ins-frontend/pull/17|https://github.com/DEFRA/trade-imports-ins-frontend/pull/17|smart-link] 

## Confluence References


