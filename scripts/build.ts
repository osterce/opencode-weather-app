const target = process.env.BUN_TARGET?.trim();
const outfile = process.env.BUILD_OUTFILE?.trim() || "weather";

const isWindows = target ? target.includes("windows") : process.platform === "win32";
const isDarwin = target ? target.includes("darwin") : process.platform === "darwin";
const producedFile = isWindows && !outfile.toLowerCase().endsWith(".exe") ? `${outfile}.exe` : outfile;

function run(command: string[]): void {
  const result = Bun.spawnSync(command, { stdio: ["inherit", "inherit", "inherit"] });
  if (result.exitCode !== 0) {
    process.exit(result.exitCode ?? 1);
  }
}

run(["bun", "test"]);

const buildArgs = ["bun", "build", "--compile", "./src/index.ts", "--outfile", outfile];
if (target) {
  buildArgs.push(`--target=${target}`);
}
run(buildArgs);

if (isDarwin && process.platform === "darwin") {
  const sign = Bun.spawnSync(["codesign", "--force", "--sign", "-", producedFile], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (sign.exitCode !== 0) {
    console.warn(`No se pudo firmar ${producedFile} de forma ad-hoc (código ${sign.exitCode}).`);
  }
}
