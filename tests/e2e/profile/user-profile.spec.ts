import { test as profileTest, expect as profileExpect } from '../../fixtures';
import { logger as profileLogger } from '@lib/core/logger';
import { Config as ProfileConfig } from '@lib/core/config';

profileTest.describe('User Profile - Management', () => {
  profileTest('should display user personal information', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const firstNameDisplay = profileSettingsPage.page
      .getByLabel(/first.*name/i)
      .or(profileSettingsPage.page.getByText(/first.*name/i));
    
    await profileExpect(firstNameDisplay).toBeVisible();

    const emailDisplay = profileSettingsPage.page
      .getByLabel(/email/i)
      .or(profileSettingsPage.page.getByText(/email/i));
    
    await profileExpect(emailDisplay).toBeVisible();

    profileLogger.info('Personal information displayed');
  });

  profileTest('should update phone number', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const editButton = profileSettingsPage.page
      .getByRole('button', { name: /edit/i });
    
    await editButton.click();

    const phoneInput = profileSettingsPage.page
      .getByLabel(/phone/i)
      .or(profileSettingsPage.page.getByPlaceholder(/phone/i));
    
    const newPhone = '555-987-6543';
    await phoneInput.fill(newPhone);

    const saveButton = profileSettingsPage.page
      .getByRole('button', { name: /save/i });
    
    await saveButton.click();

    const successMessage = profileSettingsPage.page
      .getByRole('alert')
      .or(profileSettingsPage.page.getByText(/saved|updated/i));
    
    await profileExpect(successMessage).toBeVisible();

    profileLogger.info({ newPhone }, 'Phone number updated');
  });

  profileTest('should change password successfully', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const securityTab = profileSettingsPage.page
      .getByRole('tab', { name: /security/i });
    
    if (await securityTab.count() > 0) {
      await securityTab.click();
    }

    const changePasswordButton = profileSettingsPage.page
      .getByRole('button', { name: /change.*password/i });
    
    if (await changePasswordButton.count() > 0) {
      await changePasswordButton.click();

      const currentPasswordInput = profileSettingsPage.page
        .getByLabel(/current.*password/i)
        .or(profileSettingsPage.page.getByPlaceholder(/current/i));
      
      await currentPasswordInput.fill(ProfileConfig.PASSWORD);

      const newPasswordInput = profileSettingsPage.page
        .getByLabel(/new.*password/i)
        .or(profileSettingsPage.page.getByPlaceholder(/new.*password/i));
      
      const tempPassword = 'NewSecurePassword123!';
      await newPasswordInput.fill(tempPassword);

      const confirmPasswordInput = profileSettingsPage.page
        .getByLabel(/confirm.*password/i)
        .or(profileSettingsPage.page.getByPlaceholder(/confirm/i));
      
      await confirmPasswordInput.fill(tempPassword);

      const submitButton = profileSettingsPage.page
        .getByRole('button', { name: /submit|save|change/i });
      
      await submitButton.click();

      const successMessage = profileSettingsPage.page
        .getByRole('alert')
        .or(profileSettingsPage.page.getByText(/changed|updated/i));
      
      await profileExpect(successMessage).toBeVisible();

      // Change back to original
      await changePasswordButton.click();
      await currentPasswordInput.fill(tempPassword);
      await newPasswordInput.fill(ProfileConfig.PASSWORD);
      await confirmPasswordInput.fill(ProfileConfig.PASSWORD);
      await submitButton.click();

      profileLogger.info('Password changed successfully');
    }
  });

  profileTest('should reject weak password', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const securityTab = profileSettingsPage.page
      .getByRole('tab', { name: /security/i });
    
    if (await securityTab.count() > 0) {
      await securityTab.click();
    }

    const changePasswordButton = profileSettingsPage.page
      .getByRole('button', { name: /change.*password/i });
    
    if (await changePasswordButton.count() > 0) {
      await changePasswordButton.click();

      const currentPasswordInput = profileSettingsPage.page
        .getByLabel(/current.*password/i);
      
      await currentPasswordInput.fill(ProfileConfig.PASSWORD);

      const newPasswordInput = profileSettingsPage.page
        .getByLabel(/new.*password/i);
      
      await newPasswordInput.fill('12345'); // Weak password

      const confirmPasswordInput = profileSettingsPage.page
        .getByLabel(/confirm.*password/i);
      
      await confirmPasswordInput.fill('12345');

      const submitButton = profileSettingsPage.page
        .getByRole('button', { name: /submit|save/i });
      
      await submitButton.click();

      const errorMessage = profileSettingsPage.page
        .getByText(/weak|strength|requirements/i)
        .or(profileSettingsPage.page.getByRole('alert'));
      
      await profileExpect(errorMessage).toBeVisible();

      profileLogger.info('Weak password rejected');
    }
  });

  profileTest('should configure notification preferences', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const notificationsTab = profileSettingsPage.page
      .getByRole('tab', { name: /notifications/i });
    
    if (await notificationsTab.count() > 0) {
      await notificationsTab.click();
    }

    const emailCheckbox = profileSettingsPage.page
      .getByLabel(/email.*notifications/i)
      .or(profileSettingsPage.page.getByRole('checkbox', { name: /email/i }));
    
    if (await emailCheckbox.count() > 0) {
      await emailCheckbox.check();

      const saveButton = profileSettingsPage.page
        .getByRole('button', { name: /save/i });
      
      await saveButton.click();

      const successMessage = profileSettingsPage.page
        .getByRole('alert')
        .or(profileSettingsPage.page.getByText(/saved|updated/i));
      
      await profileExpect(successMessage).toBeVisible();

      profileLogger.info('Notification preferences configured');
    }
  });
});