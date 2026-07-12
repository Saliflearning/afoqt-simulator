import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const projectRoot = process.cwd();

function loadTsModule(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (specifier === "./types") return {};
      throw new Error(`Unsupported import in test harness: ${specifier}`);
    },
    console,
    process,
    Date,
    Math,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(transpiled, sandbox, { filename: absolutePath });
  return module.exports;
}

const { QUESTIONS } = loadTsModule("lib/questions.ts");
const { sm2Update, defaultCardState, qualityFromResult } = loadTsModule("lib/sm2.ts");

test("question IDs are unique and answers stay within choice bounds", () => {
  const ids = new Set();

  for (const question of QUESTIONS) {
    assert.ok(question.id, "question id is required");
    assert.ok(!ids.has(question.id), `duplicate question id: ${question.id}`);
    ids.add(question.id);
    assert.ok(question.choices.length >= 2, `${question.id} should have at least two choices`);
    assert.ok(
      Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.choices.length,
      `${question.id} has an out-of-range answer index`,
    );
  }
});

test("known audited arithmetic questions use corrected answer keys", () => {
  const expectedAnswers = new Map([
    ["ar-07", 0],
    ["ar-12", 4],
    ["ar-14", 1],
  ]);

  for (const [id, expectedAnswer] of expectedAnswers) {
    const question = QUESTIONS.find((entry) => entry.id === id);
    assert.ok(question, `expected question ${id} to exist`);
    assert.equal(question.answer, expectedAnswer, `${id} has the wrong corrected answer index`);
  }
});

test("explanations do not contain unresolved low-confidence editing markers", () => {
  const bannedPatterns = [/\bwait\b/i, /\brecalculate\b/i, /\bactually\b/i];
  const flagged = QUESTIONS.filter((question) => bannedPatterns.some((pattern) => pattern.test(question.why)));

  assert.equal(
    flagged.length,
    0,
    `questions still contain unresolved explanation markers: ${flagged.map((question) => question.id).join(", ")}`,
  );
});

test("SM-2 scheduling promotes and resets cards correctly", () => {
  const firstReview = sm2Update(defaultCardState("demo"), 4);
  assert.equal(firstReview.repetitions, 1);
  assert.equal(firstReview.interval, 1);

  const secondReview = sm2Update(firstReview, 4);
  assert.equal(secondReview.repetitions, 2);
  assert.equal(secondReview.interval, 6);

  const failedReview = sm2Update(secondReview, 1);
  assert.equal(failedReview.repetitions, 0);
  assert.equal(failedReview.interval, 1);
});

test("qualityFromResult maps correctness and speed into stable review bands", () => {
  assert.equal(qualityFromResult(false, 1000, 10000), 0);
  assert.equal(qualityFromResult(false, 8000, 10000), 1);
  assert.equal(qualityFromResult(true, 1000, 10000), 5);
  assert.equal(qualityFromResult(true, 4000, 10000), 4);
  assert.equal(qualityFromResult(true, 9000, 10000), 3);
});
