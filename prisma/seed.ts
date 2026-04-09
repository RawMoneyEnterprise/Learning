import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Test user (for E2E tests) ────────────────────────────────────────────
  const testPasswordHash = await hash("TestPassword123!", 12);
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@example.com",
      passwordHash: testPasswordHash,
    },
  });
  console.log("Created test user: test@example.com / TestPassword123!");


  // Create a demo company
  const company = await prisma.company.upsert({
    where: { slug: "DEMO" },
    update: {},
    create: {
      name: "Demo Company",
      slug: "DEMO",
    },
  });

  console.log(`Created company: ${company.name} (${company.id})`);

  // Create a demo project
  const project = await prisma.project.upsert({
    where: { id: "demo-project-1" },
    update: {},
    create: {
      id: "demo-project-1",
      companyId: company.id,
      name: "Platform Build",
      description: "Building the alternative Paperclip platform",
    },
  });

  console.log(`Created project: ${project.name}`);

  // Create a demo agent
  const agent = await prisma.agent.upsert({
    where: { id: "demo-agent-1" },
    update: {},
    create: {
      id: "demo-agent-1",
      companyId: company.id,
      name: "Backend Engineer",
      role: "backend_engineer",
      title: "Senior Backend Engineer",
      capabilities: "Builds API routes, Prisma schemas, and business logic",
    },
  });

  console.log(`Created agent: ${agent.name}`);

  // Create a demo issue
  const issue = await prisma.issue.upsert({
    where: { identifier: "DEMO-1" },
    update: {},
    create: {
      companyId: company.id,
      projectId: project.id,
      title: "Initial project setup",
      description: "Set up the monorepo, dependencies, and CI pipeline.",
      status: "done",
      priority: "high",
      issueNumber: 1,
      identifier: "DEMO-1",
    },
  });

  console.log(`Created issue: ${issue.identifier} - ${issue.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
