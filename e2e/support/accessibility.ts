import { AxeBuilder } from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const HTML_PREVIEW_LENGTH = 160;
const WCAG_22_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Every page an end-to-end test visits must have no WCAG 2.2 AA violation axe can detect. */
export async function expectNoAccessibilityViolations(page: Page): Promise<void> {
    const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA_TAGS).analyze();
    const violations = results.violations.map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
            html: node.html.slice(0, HTML_PREVIEW_LENGTH),
            problem: node.failureSummary ?? "",
        })),
    }));

    expect(violations).toEqual([]);
}
