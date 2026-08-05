# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/features/additional-details-scope.spec.ts >> Additional details scope >> the unweaned-animals question shows only when a triggering commodity line exists
- Location: tests/e2e/features/additional-details-scope.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.waitFor: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('textbox', { name: 'Government Gateway user ID' }) to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e3]:
    - link "GOV.UK" [ref=e7] [cursor=pointer]:
      - /url: https://www.gov.uk/
      - img "GOV.UK" [ref=e8]
    - region "Service information" [ref=e21]:
      - link "Import notification service" [ref=e25] [cursor=pointer]:
        - /url: /
  - generic [ref=e26]:
    - generic [ref=e29]:
      - generic [ref=e30]:
        - img [ref=e31]
        - generic [ref=e34]: test.user11@defra.gov.uk
      - generic [ref=e35]: "|"
      - link "Sign out" [ref=e36] [cursor=pointer]:
        - /url: /auth/sign-out
    - link "Back" [ref=e37] [cursor=pointer]:
      - /url: /
    - main [ref=e38]:
      - generic [ref=e40]:
        - generic [ref=e41]:
          - strong [ref=e42]: Draft
          - text: GBN-AG-26-HM2YX0
        - heading "Overview" [level=1] [ref=e43]
        - heading "Your commodities" [level=2] [ref=e44]
        - generic [ref=e45]:
          - generic [ref=e47]:
            - heading "Animals" [level=3] [ref=e49]
            - generic [ref=e52]:
              - term [ref=e53]: Total number of animals in this consignment
              - definition [ref=e54]: "0"
          - generic [ref=e56]:
            - heading "Packages/boxes" [level=3] [ref=e58]
            - generic [ref=e61]:
              - term [ref=e62]: Total number of packages in this consignment
              - definition [ref=e63]: "0"
        - heading "1. About the consignment" [level=2] [ref=e64]
        - list [ref=e65]:
          - listitem [ref=e66]:
            - generic [ref=e67]:
              - link "Where is this consignment coming from?" [ref=e68] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/origin
              - generic [ref=e69]: Country of origin, region of origin code, your internal reference
            - strong [ref=e71]: Completed
          - listitem [ref=e72]:
            - generic [ref=e73]:
              - link "What are you importing?" [ref=e74] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/commodities
              - generic [ref=e75]: The commodities, species and numbers of animals you are importing
            - strong [ref=e77]: In progress
          - listitem [ref=e78]:
            - generic [ref=e79]:
              - link "Main reason for importing" [ref=e80] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/import-reason
              - generic [ref=e81]: Why you are importing the animals and their purpose in the internal market
            - strong [ref=e83]: Not yet started
        - heading "2. Commodity details" [level=2] [ref=e84]
        - list [ref=e85]:
          - listitem [ref=e86]:
            - generic [ref=e87]:
              - link "Additional commodity details" [ref=e88] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/additional-details
              - generic [ref=e89]: What the animals are certified for and whether any are unweaned
            - strong [ref=e91]: Not yet started
          - listitem [ref=e92]:
            - generic [ref=e93]:
              - link "Animal identification details" [ref=e94] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/commodities/identification
              - generic [ref=e95]: Identification details for the animals in each commodity
            - strong [ref=e97]: Not yet started
        - heading "3. Movement" [level=2] [ref=e98]
        - list [ref=e99]:
          - listitem [ref=e100]:
            - generic [ref=e101]:
              - link "Arrival details" [ref=e102] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/port-of-entry
              - generic [ref=e103]: The port of entry, when the consignment will arrive and how the animals will travel
            - strong [ref=e105]: Not yet started
          - listitem [ref=e106]:
            - generic [ref=e107]:
              - link "Transporter" [ref=e108] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/transporters
              - generic [ref=e109]: Who transports the animals to their destination
            - strong [ref=e111]: Not yet started
        - heading "4. Addresses" [level=2] [ref=e112]
        - list [ref=e113]:
          - listitem [ref=e114]:
            - generic [ref=e115]:
              - link "Roles and addresses" [ref=e116] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/addresses
              - generic [ref=e117]: The consignor, consignee, importer and the places of origin and destination
            - strong [ref=e119]: Not yet started
          - listitem [ref=e120]:
            - generic [ref=e121]:
              - link "Contact address" [ref=e122] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/consignment/contact/select
              - generic [ref=e123]: Who we should contact about this notification
            - strong [ref=e125]: Not yet started
        - heading "5. Documents" [level=2] [ref=e126]
        - list [ref=e127]:
          - listitem [ref=e128]:
            - generic [ref=e129]:
              - link "Uploaded documents" [ref=e130] [cursor=pointer]:
                - /url: /notifications/GBN-AG-26-HM2YX0/accompanying-documents
              - generic [ref=e131]: Certificates, permits and other documents for the consignment
            - generic [ref=e132]: Optional
        - heading "6. Check and submit" [level=2] [ref=e133]
        - list [ref=e134]:
          - listitem [ref=e135]:
            - generic [ref=e136]:
              - generic [ref=e137]: Check and submit
              - generic [ref=e138]: Check your answers before you submit the notification
            - generic [ref=e139]: Cannot start yet
        - button "Return to dashboard" [ref=e140] [cursor=pointer]
  - contentinfo [ref=e141]:
    - generic [ref=e154]:
      - generic [ref=e155]:
        - heading "Support links" [level=2] [ref=e156]
        - list [ref=e157]:
          - listitem [ref=e158]:
            - link "Privacy" [ref=e159] [cursor=pointer]:
              - /url: https://www.gov.uk/help/privacy-notice
          - listitem [ref=e160]:
            - link "Cookies" [ref=e161] [cursor=pointer]:
              - /url: https://www.gov.uk/help/cookies
          - listitem [ref=e162]:
            - link "Accessibility statement" [ref=e163] [cursor=pointer]:
              - /url: https://www.gov.uk/help/accessibility-statement
        - img [ref=e164]
        - generic [ref=e166]:
          - text: All content is available under the
          - link "Open Government Licence v3.0" [ref=e167] [cursor=pointer]:
            - /url: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
          - text: ", except where otherwise stated"
      - link "© Crown copyright" [ref=e169] [cursor=pointer]:
        - /url: https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/
```

# Test source

```ts
  1   | import { Page, Locator, errors } from '@playwright/test';
  2   | import { SignInPage } from '@page-objects/auth/sign-in-page';
  3   | 
  4   | const SIGN_IN_FORM_PROBE_MS = 5_000;
  5   | 
  6   | function requireBaseUrl(envVar: 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL' | 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL'): string {
  7   |   const baseUrl = process.env[envVar];
  8   |   if (!baseUrl) {
  9   |     throw new Error(`${envVar} is not set. Ensure Playwright config applies project base URLs before running tests.`);
  10  |   }
  11  |   return baseUrl;
  12  | }
  13  | 
  14  | export class BasePage {
  15  |   constructor(protected readonly page: Page) {}
  16  | 
  17  |   get linkHome(): Locator {
  18  |     return this.page.getByRole('link', { name: 'Home' });
  19  |   }
  20  | 
  21  |   get linkAbout(): Locator {
  22  |     return this.page.getByRole('link', { name: 'About' });
  23  |   }
  24  | 
  25  |   user(email: string = 'test.user11@defra.gov.uk'): Locator {
  26  |     return this.page.getByText(email);
  27  |   }
  28  | 
  29  |   get linkSignOut(): Locator {
  30  |     return this.page.getByRole('link', { name: 'Sign out' });
  31  |   }
  32  | 
  33  |   async navigateToFrontend(path: string = '/'): Promise<void> {
  34  |     const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
  35  |     await this.page.goto(`${baseUrl}${path}`);
  36  |   }
  37  | 
  38  |   async navigateToAdminPortal(path: string = '/'): Promise<void> {
  39  |     const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL');
  40  |     await this.page.goto(`${baseUrl}${path}`);
  41  |   }
  42  | 
  43  |   protected async signInWhenRequested(attemptSignIn: boolean): Promise<void> {
  44  |     if (!attemptSignIn) return;
  45  |     const signInPage = new SignInPage(this.page);
  46  |     // Under concurrent load the auth stub can be slow; the caller may retry
  47  |     // after a goto that landed directly on a post-auth page. Only sign in if
  48  |     // the sign-in form is actually present.
  49  |     try {
> 50  |       await signInPage.inputUserId.waitFor({
      |                                    ^ Error: locator.waitFor: Test timeout of 30000ms exceeded.
  51  |         state: 'visible',
  52  |         timeout: SIGN_IN_FORM_PROBE_MS,
  53  |       });
  54  |     } catch (error) {
  55  |       if (error instanceof errors.TimeoutError) return;
  56  |       throw error;
  57  |     }
  58  |     await signInPage.signIn();
  59  |     const transientError = this.page.getByRole('heading', {
  60  |       level: 1,
  61  |       name: 'Sorry, we are unable to sign you in.',
  62  |     });
  63  |     if (await transientError.isVisible()) {
  64  |       await this.page.getByRole('link', { name: 'try again' }).click();
  65  |       await signInPage.inputUserId.waitFor();
  66  |       await signInPage.signIn();
  67  |     }
  68  |   }
  69  | }
  70  | 
  71  | export class NotificationPage extends BasePage {
  72  |   constructor(
  73  |     page: Page,
  74  |     readonly slug: string,
  75  |   ) {
  76  |     super(page);
  77  |   }
  78  | 
  79  |   expectedUrl(journeyId: string): string {
  80  |     const suffix = this.slug ? `/${this.slug}` : '';
  81  |     return `/notifications/${journeyId}${suffix}`;
  82  |   }
  83  | 
  84  |   journeyIdFromUrl(): string {
  85  |     const match = new URL(this.page.url()).pathname.match(/^\/notifications\/([^/]+)/);
  86  |     if (!match) {
  87  |       throw new Error(`No journey id in notification URL: ${this.page.url()}`);
  88  |     }
  89  |     return match[1];
  90  |   }
  91  | 
  92  |   currentJourneyUrl(slug: string = this.slug): string {
  93  |     const suffix = slug ? `/${slug}` : '';
  94  |     return `/notifications/${this.journeyIdFromUrl()}${suffix}`;
  95  |   }
  96  | 
  97  |   async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
  98  |     await this.navigateToFrontend(this.expectedUrl(journeyId));
  99  |     await this.signInWhenRequested(attemptSignIn);
  100 |   }
  101 | }
  102 | 
```