const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = __dirname;
const ZIP = path.join(ROOT, "function.zip");
const FN_NAME = "tekkzy-inject-preview-bridge";
const BUCKET = "products.tekkzy.com";
const ACCOUNT = "922184331501";
const ROLE_NAME = "tekkzy-inject-preview-bridge-role";

function sh(cmd, args) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: true,
    maxBuffer: 20_000_000,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `${cmd} ${args.join(" ")}`);
  }
  return r.stdout;
}

function aws(args) {
  return sh("aws", args);
}

const py = path.join(ROOT, "lambda_function.py");
if (fs.existsSync(ZIP)) fs.unlinkSync(ZIP);
sh("powershell", [
  "-NoProfile",
  "-Command",
  `Compress-Archive -Path '${py.replace(/'/g, "''")}' -DestinationPath '${ZIP.replace(/'/g, "''")}' -Force`,
]);

let roleArn = `arn:aws:iam::${ACCOUNT}:role/${ROLE_NAME}`;
try {
  roleArn = aws(["iam", "get-role", "--role-name", ROLE_NAME, "--query", "Role.Arn", "--output", "text"]).trim();
  console.log("role exists", roleArn);
} catch {
  const trustPath = path.join(ROOT, "trust.json");
  fs.writeFileSync(
    trustPath,
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "lambda.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
  );
  roleArn = aws([
    "iam",
    "create-role",
    "--role-name",
    ROLE_NAME,
    "--assume-role-policy-document",
    `file://${trustPath}`,
    "--query",
    "Role.Arn",
    "--output",
    "text",
  ]).trim();
  aws([
    "iam",
    "attach-role-policy",
    "--role-name",
    ROLE_NAME,
    "--policy-arn",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  ]);
  const policyPath = path.join(ROOT, "policy.json");
  fs.writeFileSync(
    policyPath,
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:GetObject", "s3:PutObject", "s3:HeadObject"],
          Resource: `arn:aws:s3:::${BUCKET}/*`,
        },
      ],
    }),
  );
  aws([
    "iam",
    "put-role-policy",
    "--role-name",
    ROLE_NAME,
    "--policy-name",
    "s3-html-patch",
    "--policy-document",
    `file://${policyPath}`,
  ]);
  console.log("created role, waiting for IAM…");
  sh("powershell", ["-NoProfile", "-Command", "Start-Sleep -Seconds 12"]);
}

let bucketRegion = aws([
  "s3api",
  "get-bucket-location",
  "--bucket",
  BUCKET,
  "--query",
  "LocationConstraint",
  "--output",
  "text",
]).trim();
if (!bucketRegion || bucketRegion === "None" || bucketRegion === "null") bucketRegion = "us-east-1";
console.log("bucket region", bucketRegion);

let fnArn;
try {
  fnArn = aws([
    "lambda",
    "get-function",
    "--function-name",
    FN_NAME,
    "--region",
    bucketRegion,
    "--query",
    "Configuration.FunctionArn",
    "--output",
    "text",
  ]).trim();
  aws([
    "lambda",
    "update-function-code",
    "--function-name",
    FN_NAME,
    "--region",
    bucketRegion,
    "--zip-file",
    `fileb://${ZIP}`,
  ]);
  // ensure runtime/handler
  aws([
    "lambda",
    "update-function-configuration",
    "--function-name",
    FN_NAME,
    "--region",
    bucketRegion,
    "--runtime",
    "python3.12",
    "--handler",
    "lambda_function.handler",
    "--timeout",
    "60",
    "--memory-size",
    "256",
  ]);
  console.log("updated function", fnArn);
} catch {
  fnArn = aws([
    "lambda",
    "create-function",
    "--function-name",
    FN_NAME,
    "--region",
    bucketRegion,
    "--runtime",
    "python3.12",
    "--handler",
    "lambda_function.handler",
    "--role",
    roleArn,
    "--timeout",
    "60",
    "--memory-size",
    "256",
    "--zip-file",
    `fileb://${ZIP}`,
    "--query",
    "FunctionArn",
    "--output",
    "text",
  ]).trim();
  console.log("created function", fnArn);
}

try {
  aws([
    "lambda",
    "wait",
    "function-updated-v2",
    "--function-name",
    FN_NAME,
    "--region",
    bucketRegion,
  ]);
} catch {
  sh("powershell", ["-NoProfile", "-Command", "Start-Sleep -Seconds 5"]);
}

try {
  aws([
    "lambda",
    "add-permission",
    "--function-name",
    FN_NAME,
    "--region",
    bucketRegion,
    "--statement-id",
    "s3-products-html-put",
    "--action",
    "lambda:InvokeFunction",
    "--principal",
    "s3.amazonaws.com",
    "--source-arn",
    `arn:aws:s3:::${BUCKET}`,
    "--source-account",
    ACCOUNT,
  ]);
  console.log("permission added");
} catch (e) {
  const msg = String(e.message || e);
  if (msg.includes("already exists") || msg.includes("ResourceConflict")) {
    console.log("permission already exists");
  } else {
    console.warn("permission warn:", msg);
  }
}

let existing = {};
try {
  const raw = aws(["s3api", "get-bucket-notification-configuration", "--bucket", BUCKET]);
  existing = raw.trim() ? JSON.parse(raw) : {};
} catch {
  existing = {};
}

const lambdaConfigs = (existing.LambdaFunctionConfigurations || []).filter(
  (c) => c.Id !== "tekkzy-inject-preview-bridge-html",
);
lambdaConfigs.push({
  Id: "tekkzy-inject-preview-bridge-html",
  LambdaFunctionArn: fnArn,
  Events: ["s3:ObjectCreated:*"],
  Filter: {
    Key: {
      FilterRules: [{ Name: "suffix", Value: ".html" }],
    },
  },
});

const notification = { ...existing, LambdaFunctionConfigurations: lambdaConfigs };
delete notification.ResponseMetadata;
const notifPath = path.join(ROOT, "notification.json");
fs.writeFileSync(notifPath, JSON.stringify(notification, null, 2));
aws([
  "s3api",
  "put-bucket-notification-configuration",
  "--bucket",
  BUCKET,
  "--notification-configuration",
  `file://${notifPath}`,
]);
console.log("S3 notification configured");
console.log("DONE");
