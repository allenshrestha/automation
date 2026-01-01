# PLAYWRIGHT LOCATOR STANDARDS - 2025

## 🎯 PHILOSOPHY

**Accessibility First, Test IDs Last**

Our locators should mirror how real users interact with the application:
1. **Role** - What is it? (button, link, textbox, checkbox)
2. **Label** - What does it say? (form labels, aria-labels)
3. **Text** - What unique text does it contain?
4. **Test ID** - Last resort fallback only

---

## 📋 LOCATOR PRIORITY ORDER

### **1. getByRole() - ALWAYS TRY FIRST**

```typescript
// ✅ BEST - Semantic, accessible, resilient
this.page.getByRole('button', { name: /submit|save/i })
this.page.getByRole('link', { name: /view details/i })
this.page.getByRole('textbox', { name: /email/i })
this.page.getByRole('checkbox', { name: /agree to terms/i })
this.page.getByRole('tab', { name: /transactions/i })
this.page.getByRole('heading', { name: /account details/i })
```

**Available Roles:**
- `button`, `link`, `textbox`, `checkbox`, `radio`
- `heading`, `list`, `listitem`, `table`, `row`, `cell`
- `tab`, `tabpanel`, `dialog`, `alert`, `navigation`
- `region`, `banner`, `contentinfo`, `complementary`
- `search`, `main`, `article`, `section`

### **2. getByLabel() - FOR FORM FIELDS**

```typescript
// ✅ EXCELLENT for forms - uses <label> or aria-label
this.page.getByLabel(/email.*address/i)
this.page.getByLabel(/password/i)
this.page.getByLabel(/account.*number/i)
this.page.getByLabel(/date.*of.*birth/i)
```

### **3. getByText() - FOR UNIQUE TEXT**

```typescript
// ✅ GOOD when text is unique and stable
this.page.getByText('Welcome back, John')
this.page.getByText(/total.*balance/i)
```

⚠️ **Warning:** Text changes break tests. Use regex for flexibility.

### **4. getByPlaceholder() - FOR INPUTS**

```typescript
// ⚠️ OKAY but labels are better
this.page.getByPlaceholder('Enter your email')
```

### **5. getByTestId() - LAST RESORT ONLY**

```typescript
// ❌ FALLBACK ONLY - Use as .or() chain
this.page.getByRole('button', { name: /submit/i })
  .or(this.page.getByTestId('submit-button'))
```

---

## ✅ GOOD PATTERNS

### **Pattern: Locator Getter with Fallback**

```typescript
/**
 * Get submit button
 * Returns Locator for chaining and test assertions
 */
getSubmitButton(): Locator {
  return this.page.getByRole('button', { name: /submit|save|confirm/i })
    .or(this.page.locator('button[type="submit"]'))
    .or(this.page.getByTestId('submit-button'));
}
```

### **Pattern: Form Input with Label**

```typescript
/**
 * Get email input field
 */
getEmailInput(): Locator {
  return this.page.getByLabel(/email.*address/i)
    .or(this.page.getByRole('textbox', { name: /email/i }))
    .or(this.page.getByPlaceholder(/email/i))
    .or(this.page.getByTestId('email-input'));
}
```

### **Pattern: Navigation Link**

```typescript
/**
 * Get accounts navigation link
 */
getAccountsNavLink(): Locator {
  return this.page.getByRole('navigation')
    .getByRole('link', { name: /accounts/i });
}
```

### **Pattern: Tab Navigation**

```typescript
/**
 * Get transactions tab
 */
getTransactionsTab(): Locator {
  return this.page.getByRole('tab', { name: /transactions/i })
    .or(this.page.getByTestId('tab-transactions'));
}
```

### **Pattern: Alert/Message**

```typescript
/**
 * Get success alert
 */
getSuccessAlert(): Locator {
  return this.page.getByRole('alert')
    .filter({ hasText: /success|complete/i });
}

/**
 * Get error alert
 */
getErrorAlert(): Locator {
  return this.page.getByRole('alert')
    .filter({ hasText: /error|fail/i });
}
```

### **Pattern: Modal/Dialog**

```typescript
/**
 * Get confirmation dialog
 */
getConfirmDialog(): Locator {
  return this.page.getByRole('dialog', { name: /confirm/i })
    .or(this.page.getByTestId('confirm-modal'));
}

/**
 * Get dialog close button
 */
getDialogCloseButton(): Locator {
  return this.getConfirmDialog()
    .getByRole('button', { name: /close|cancel/i });
}
```

### **Pattern: List Items**

```typescript
/**
 * Get transaction items from list
 */
getTransactionItems(): Locator {
  return this.page.getByRole('listitem')
    .filter({ has: this.page.getByText(/transaction/i) });
}

/**
 * Get first transaction
 */
async getFirstTransaction(): Promise<Locator> {
  return this.getTransactionItems().first();
}

/**
 * Get transaction by index
 */
getTransactionByIndex(index: number): Locator {
  return this.getTransactionItems().nth(index);
}
```

### **Pattern: Table Navigation**

```typescript
/**
 * Get table rows
 */
getTableRows(): Locator {
  return this.page.getByRole('row');
}

/**
 * Get cell by row and column
 */
getTableCell(rowIndex: number, columnName: string): Locator {
  return this.page.getByRole('row')
    .nth(rowIndex)
    .getByRole('cell', { name: new RegExp(columnName, 'i') });
}
```

---

## ❌ BAD PATTERNS TO AVOID

### **Anti-Pattern 1: TestId First**

```typescript
// ❌ BAD
getSubmitButton(): Locator {
  return this.page.getByTestId('submit-button');
}

// ✅ GOOD
getSubmitButton(): Locator {
  return this.page.getByRole('button', { name: /submit/i })
    .or(this.page.getByTestId('submit-button'));
}
```

### **Anti-Pattern 2: CSS Selectors**

```typescript
// ❌ BAD - Brittle, not accessible
this.page.locator('.submit-btn.primary')
this.page.locator('#emailInput')
this.page.locator('div > button:nth-child(2)')

// ✅ GOOD
this.page.getByRole('button', { name: /submit/i })
this.page.getByLabel(/email/i)
this.page.getByRole('button', { name: /save/i })
```

### **Anti-Pattern 3: XPath**

```typescript
// ❌ BAD - Fragile, hard to read
this.page.locator('//button[@data-testid="submit"]')
this.page.locator('//div[contains(@class, "modal")]/button')

// ✅ GOOD
this.page.getByRole('button', { name: /submit/i })
this.page.getByRole('dialog').getByRole('button')
```

### **Anti-Pattern 4: Not Returning Locators**

```typescript
// ❌ BAD - Can't be used in assertions
async clickSubmit() {
  await this.page.getByRole('button', { name: /submit/i }).click();
}

// ✅ GOOD - Returns Locator
getSubmitButton(): Locator {
  return this.page.getByRole('button', { name: /submit/i });
}

// Usage in page:
await this.getSubmitButton().click();

// Usage in test:
await expect(page.getSubmitButton()).toBeEnabled();
await expect(page.getSubmitButton()).toHaveText('Submit');
```

### **Anti-Pattern 5: String Selector Objects**

```typescript
// ❌ BAD - Old pattern
private selectors = {
  submitButton: '[data-testid="submit-button"]',
  emailInput: '[data-testid="email-input"]',
};

async submitForm() {
  await this.page.locator(this.selectors.submitButton).click();
}

// ✅ GOOD - Locator getters
getSubmitButton(): Locator {
  return this.page.getByRole('button', { name: /submit/i });
}

getEmailInput(): Locator {
  return this.page.getByLabel(/email/i);
}

async submitForm() {
  await this.getSubmitButton().click();
}
```

---

## 🎯 CASE-BY-CASE GUIDELINES

### **When Element Has No Role**

```typescript
// If element truly has no semantic role, add it in the app!
// <div data-testid="account-balance">$1,000.00</div> ❌

// <div role="status" aria-label="Account Balance">$1,000.00</div> ✅

// Then use:
this.page.getByRole('status', { name: /account.*balance/i })
```

### **When Multiple Elements Have Same Role**

```typescript
// Use .filter() or .nth()
this.page.getByRole('button', { name: /delete/i })
  .filter({ hasText: /permanently/i });

this.page.getByRole('button', { name: /submit/i }).first();
this.page.getByRole('button', { name: /submit/i }).nth(1);
```

### **When Text Changes Dynamically**

```typescript
// Use regex with flexible patterns
this.page.getByRole('heading', { name: /welcome.*/i })
this.page.getByText(/balance.*\$[\d,]+\.?\d*/i)
```

### **When Working with Forms**

```typescript
// Always prefer getByLabel
getFirstNameInput(): Locator {
  return this.page.getByLabel(/first.*name/i, { exact: false });
}

getPhoneInput(): Locator {
  return this.page.getByLabel(/phone/i)
    .or(this.page.getByPlaceholder(/\(\d{3}\)/)); // (555) format
}
```

---

## 🔍 DEBUGGING LOCATORS

### **Use Playwright Inspector**

```bash
# Debug mode - pause and inspect
PWDEBUG=1 npm test

# Codegen - generate locators
npx playwright codegen https://your-app.com
```

### **Test Locators in Browser Console**

```javascript
// In browser dev tools
document.querySelectorAll('[role="button"]')
document.querySelectorAll('[aria-label*="submit"]')
```

### **Playwright's Locator Viewer**

```typescript
// In your test
await page.pause(); // Opens inspector
```

---

## 📊 LOCATOR STRENGTH RANKING

| Locator Type | Strength | Reason |
|-------------|----------|---------|
| `getByRole()` | ⭐⭐⭐⭐⭐ | Semantic, accessible, resilient |
| `getByLabel()` | ⭐⭐⭐⭐⭐ | Perfect for forms, accessible |
| `getByText()` | ⭐⭐⭐⭐ | Good if text is stable |
| `getByPlaceholder()` | ⭐⭐⭐ | Okay for inputs |
| `getByTitle()` | ⭐⭐⭐ | Rare use case |
| `getByAltText()` | ⭐⭐⭐ | Images only |
| `getByTestId()` | ⭐⭐ | Fallback only |
| CSS/XPath | ⭐ | Avoid if possible |

---

## ✍️ NAMING CONVENTIONS

### **Locator Getter Methods**

```typescript
// Pattern: get[Element][Type]
getSubmitButton(): Locator
getUsernameInput(): Locator
getAccountsNavLink(): Locator
getSuccessAlert(): Locator
getConfirmDialog(): Locator
getTransactionItems(): Locator // plural for lists
```

### **Action Methods**

```typescript
// Use verb + noun
async clickSubmit()
async fillEmail(email: string)
async selectAccount(accountId: string)
async checkTerms()
async uploadFile(filePath: string)
```

### **Query Methods**

```typescript
// Use get + return type
async getAccountBalance(): Promise<number>
async getCurrentUser(): Promise<string>
async getTransactions(): Promise<Transaction[]>
async hasErrors(): Promise<boolean>
async isLoggedIn(): Promise<boolean>
```

---

## 🚀 MIGRATION STRATEGY

### **Step 1: Identify Current Pattern**

```typescript
// BEFORE - String selectors
private selectors = {
  submitBtn: '[data-testid="submit"]'
};
```

### **Step 2: Create Locator Getter**

```typescript
// AFTER - Locator getter
getSubmitButton(): Locator {
  return this.page.getByRole('button', { name: /submit/i })
    .or(this.page.getByTestId('submit'));
}
```

### **Step 3: Update Usage**

```typescript
// BEFORE
await this.page.locator(this.selectors.submitBtn).click();

// AFTER
await this.getSubmitButton().click();
```

### **Step 4: Remove Old Selector**

```typescript
// Delete the selector object entry
// Remove: submitBtn: '[data-testid="submit"]'
```

---

## 📚 ADDITIONAL RESOURCES

- [Playwright Locators Docs](https://playwright.dev/docs/locators)
- [ARIA Roles Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [Web Accessibility](https://www.w3.org/WAI/fundamentals/accessibility-intro/)

---

## ✅ CHECKLIST FOR CODE REVIEWS

When reviewing Page Object changes:

- [ ] All locators use `getByRole/getByLabel` first
- [ ] `getByTestId` is fallback only (`.or()` chain)
- [ ] No CSS selectors (except in `.or()` for legacy)
- [ ] No XPath selectors
- [ ] Locator getters return `Locator` type
- [ ] No `page.waitForTimeout()` calls
- [ ] Methods use locator getters, not inline locators
- [ ] Consistent naming conventions
- [ ] JSDoc comments on public methods
- [ ] No deprecated `PageHelper` methods

---

**Last Updated:** January 2025  
**Version:** 2.0  
**Framework:** Playwright + TypeScript