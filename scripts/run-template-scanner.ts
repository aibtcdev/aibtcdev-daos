import { TemplateScanner } from '../utilities/template-scanner'; // Adjust path if necessary
import { ContractRegistry } from '../utilities/contract-registry';
import { defineAllDaoContractDependencies } from '../utilities/contract-dependencies';
// Ensure getAllKnownTemplateVariables is correctly imported if TemplateScanner relies on it being available globally
// or if the setup within TemplateScanner itself is not sufficient.
// import { getAllKnownTemplateVariables } from '../utilities/template-variables';

async function main() {
  // The setup of ContractRegistry and defining dependencies is now handled
  // directly within TemplateScanner.scanAllTemplates().
  // If getAllKnownTemplateVariables is needed by the scanner's setup, ensure it's accessible.

  console.log("Starting template scan...");
  // scanAllTemplates now handles its own registry setup.
  const issues = await TemplateScanner.scanAllTemplates();

  TemplateScanner.printReport(issues);
  // Note: saveReportAsJson is async, but we don't necessarily need to await it here
  // if we're fine with the script potentially exiting before the file is fully written in some edge cases.
  // For robustness, especially in CI, awaiting is better.
  await TemplateScanner.saveReportAsJson(issues, 'template-scan-report.json');

  if (issues.length > 0) {
    console.error("Template scan failed with issues.");
    process.exit(1);
  } else {
    console.log("Template scan completed successfully.");
    process.exit(0);
  }
}

main().catch(error => {
  console.error("An unexpected error occurred during template scan:", error);
  process.exit(1);
});
