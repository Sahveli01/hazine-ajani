export function deploymentLabel(commit: string | undefined): string {
  if (commit === undefined || commit === "") return "Build yerel";
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) return "Build doğrulanamadı";
  return `Build ${commit.slice(0, 7).toLowerCase()}`;
}
