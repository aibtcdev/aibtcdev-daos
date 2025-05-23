import { TemplateScanner } from "../utilities/template-scanner";

async function main() {
  console.log("Starting template scan...");
  const issues = await TemplateScanner.scanAllTemplates();
  TemplateScanner.printReport(issues);
  await TemplateScanner.saveReportAsJson(issues, "template-scan-report.json");
  if (issues.length > 0) {
    console.error("Template scan failed with issues.");
    process.exit(1);
  } else {
    console.log("Template scan completed successfully.");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("An unexpected error occurred during template scan:", error);
  process.exit(1);
});
