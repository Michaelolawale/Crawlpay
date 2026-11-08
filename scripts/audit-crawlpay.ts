import { runAuditPipeline } from '../src/services/auditRunner';

async function main() {
  const target = 'https://crawlpay.vercel.app';
  console.log(`\n======================================================`);
  console.log(`   AUDITING CRAWLPAY LIVE DEPLOYMENT: ${target}`);
  console.log(`======================================================\n`);

  try {
    const report = await runAuditPipeline(target, 'quick', false);

    console.log('--- 1. OVERALL SCORES ---');
    console.log(`Overall Health Score : ${report.scores.overall}%`);
    console.log(`Technical Score      : ${report.scores.technical}%`);
    console.log(`Content Score        : ${report.scores.content}%`);
    console.log(`Performance Vitals   : ${report.scores.performance}%`);
    console.log(`Mobile Score         : ${report.scores.mobile}%`);
    console.log(`AEO Score            : ${report.scores.aeo}%`);
    console.log(`GEO Score            : ${report.scores.geo}%`);

    console.log('\n--- 2. SITE SUMMARY DETECTED ---');
    console.log(JSON.stringify(report.siteSummary, null, 2));

    console.log('\n--- 3. DETECTED STACK ---');
    console.log(JSON.stringify(report.detectedStack, null, 2));

    console.log('\n--- 4. PRIORITIZED FINDINGS ---');
    console.log(`Total Findings: ${report.prioritizedGroups.length}`);
    for (const group of report.prioritizedGroups) {
      console.log(`\n[${group.severity.toUpperCase()}] ${group.checkId}`);
      console.log(`  Root Cause: ${group.rootCauseKey}`);
      console.log(`  Affected count: ${group.affectedCount}`);
      if (group.stackFix) {
        console.log(`  Suggested Fix: ${group.stackFix.slice(0, 100)}...`);
      }
    }

    console.log('\n--- 5. WHAT PASSED ---');
    console.log(report.whatPassed);

    console.log('\n--- 6. NOT CHECKED / OUT OF SCOPE ---');
    for (const item of report.notChecked) {
      console.log(`- ${item}`);
    }

  } catch (err: any) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  }
}

main();
