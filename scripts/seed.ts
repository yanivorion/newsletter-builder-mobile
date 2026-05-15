// Seed a demo newsletter so the deployed site has something to render.

const demo = {
  pageSettings: {
    outerBackgroundColor: "#F5F5F5",
    outerPadding: 0,
    innerBackgroundColor: "#FFFFFF",
    innerBorderWidth: 0,
    innerBorderRadius: 12,
  },
  sections: [
    {
      id: "sec-header",
      type: "header",
      background: { type: "gradient", gradientStart: "#04D1FC", gradientEnd: "#17A298", gradientAngle: 135 },
      padding: { top: 32, bottom: 32, left: 24, right: 24 },
      height: "auto",
      blocks: [
        { id: "b-title", type: "title", text: "BASE44 · NEWSLETTER PoC", fontSize: 14, color: "#FFFFFF", letterSpacing: "0.18em", textAlign: "center", padding: 0 },
        { id: "b-spacer-1", type: "spacer", height: 16 },
        { id: "b-text-1", type: "text", content: "Hello from the Base44 vertical slice.\n\nIf you can read this rendered as styled HTML, the renderer + entity wiring works.", fontFamily: "Poppins", fontSize: 18, color: "#FFFFFF", lineHeight: 1.5, textAlign: "center", padding: 0 },
      ],
    },
    {
      id: "sec-text",
      type: "section",
      background: { type: "solid", color: "#FFFFFF" },
      padding: { top: 32, bottom: 32, left: 32, right: 32 },
      height: "auto",
      blocks: [
        { id: "b-title-2", type: "title", text: "WHAT THIS PROVES", fontSize: 12, color: "#0F172A", letterSpacing: "0.18em", textAlign: "left", padding: 0 },
        { id: "b-spacer-2", type: "spacer", height: 12 },
        { id: "b-text-2", type: "text", content: "The same block components render in a Vite SPA on Base44 hosting. No Next.js, no Vercel, no Supabase. The newsletter document lives in a Base44 entity and is fetched at runtime through the SDK.", fontFamily: "Poppins", fontSize: 16, color: "#334155", lineHeight: 1.6, textAlign: "left", padding: 0 },
        { id: "b-divider-1", type: "divider", color: "#E2E8F0", thickness: 1, marginTop: 16, marginBottom: 16 },
        { id: "b-button", type: "button", text: "View on Base44", url: "https://base44.com", backgroundColor: "#04D1FC", textColor: "#0B1220", fontSize: 14, paddingH: 28, paddingV: 12, borderRadius: 8, align: "left" },
      ],
    },
    {
      id: "sec-footer",
      type: "footer",
      background: { type: "solid", color: "#0F172A" },
      padding: { top: 24, bottom: 24, left: 24, right: 24 },
      height: "auto",
      blocks: [
        { id: "b-company", type: "companyInfo", text: "Base44 · Validation App · Wix", color: "#94A3B8", fontSize: 12, align: "center" },
      ],
    },
  ],
};

// Avoid duplicate seeds
const existing = await base44.entities.Newsletter.list();
const already = existing.find((n: any) => n.name === "Welcome — demo newsletter");
if (already) {
  console.log(`already seeded (id=${already.id}); skipping`);
} else {
  const created = await base44.entities.Newsletter.create({
    name: "Welcome — demo newsletter",
    description: "Starter newsletter exercising header / text / button / divider / footer blocks.",
    state: demo,
    is_template: true,
  });
  console.log(`seeded id=${created.id}`);
}

console.log("---list---");
for (const n of await base44.entities.Newsletter.list()) {
  console.log(`  ${n.id}  ${n.name}  (${(n.state?.sections ?? []).length} sections)`);
}
