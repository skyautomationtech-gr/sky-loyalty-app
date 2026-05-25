/**
 * Syncs app data to Google Sheets via Google Apps Script Web App.
 */

// TODO: Replace with your Google Apps Script Web App URL (the one that ends with /exec)
// Current ID provided: 1gFMzXGdgswqSi9-vVkYfd21uq-qa8G1SfPziXadddHiHbtWoCCHPQXeJ
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/1gFMzXGdgswqSi9-vVkYfd21uq-qa8G1SfPziXadddHiHbtWoCCHPQXeJ/exec';

/**
 * Sends data to Google Sheets webhook.
 * @param sheetName The name of the target sheet
 * @param data The data object to send
 */
export const sendToSheets = async (sheetName: string, data: any) => {
  if (!SHEETS_WEBHOOK) {
    console.warn('Google Sheets Webhook URL not set. Skipping sync.');
    return;
  }

  try {
    // We use fetch with mode: 'no-cors' as suggested for Apps Script web apps 
    // when we don't need to read the response body and want to avoid CORS preflight issues.
    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheet: sheetName,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
    console.log('Synced to Google Sheets:', sheetName);
  } catch (error) {
    console.error('Sheets sync error:', error);
    // Don't block the app if sheets fails
  }
};
