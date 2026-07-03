export const meta = {
  name: 'ctf-24h-round',
  description: 'Web CTF 24h loop 的单轮有状态 workflow：初始化/读取 manifest → 执行一轮推进 → 写 checkpoint → 返回 CONTINUE/DONE/EXHAUSTED',
  phases: [
    { title: '阶段一：读取 checkpoint' },
    { title: '阶段二：单轮自动推进' },
    { title: '阶段三：Agent 攻击网推进' },
    { title: '阶段四：写回与停止判断' },
  ],
}

// ================================================================
// args 规范：
//   string             → target URL/domain
//   object.target      → 目标 URL/domain
//   object.caseName    → case 名；默认从 target 生成
//   object.manifest    → ai_manifest.json 路径；有则优先使用
//   object.maxActions  → ctf_autopilot 单轮最多动作数，默认 4
//   object.execute     → 是否执行 allowlist 动作，默认 true
//   object.stopOnExhausted → 全路径耗尽时停止，默认 true
// ================================================================

const rawTarget = typeof args === 'string' ? args : args?.target || ''
const target = rawTarget || 'https://target.example/'
const safeTarget = target
  .replace(/^https?:\/\//, '')
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
const caseName = typeof args === 'object' && args?.caseName ? args.caseName : safeTarget || 'ctf-target'
const manifest =
  typeof args === 'object' && args?.manifest
    ? args.manifest
    : `cases/${caseName}/ai_manifest.json`
const maxActions = typeof args === 'object' && args?.maxActions ? args.maxActions : 4
const execute = !(typeof args === 'object' && args?.execute === false)
const stopOnExhausted = !(typeof args === 'object' && args?.stopOnExhausted === false)

phase('阶段一：读取 checkpoint')

const checkpoint = await agent(
  `你是 Claude Code /loop 中的一轮 Web CTF controller。当前目标不是一次性跑完 24 小时，而是完成一个有界 round，写 checkpoint，然后返回明确状态。全流程无人值守，不等待人工审批；平台权限/审批由 Claude Code 或 Codex 启动参数负责。

## 输入

- Target: ${target}
- Case name: ${caseName}
- Manifest path: ${manifest}
- Max actions: ${maxActions}
- Execute allowlist actions: ${execute}

## 必读

1. 读取 \`AI-USAGE.md\`
2. 读取 \`boards/ctf-website/AI-USAGE.md\`
3. 读取 \`kb/ctf-website/techniques/attack-network.md\`

## 初始化 / 恢复

如果 \`${manifest}\` 不存在：

\`\`\`bash
python3 scripts/ctf-website/ctf_intake.py "${caseName}" --url "${target}" --root .
\`\`\`

然后定位实际生成的 \`cases/*/ai_manifest.json\`。如果 case 名因日期前缀不同导致路径不一致，以脚本输出为准，并在本轮报告中说明。

如果 manifest 已存在，先读取它的 \`autopilot.last_round_id\`、\`next_actions\`、\`evidence\`、\`dead_ends\`，不要从头开始。

## 输出

返回 JSON，不要 Markdown：

{
  "manifest": "<实际 manifest 路径>",
  "case": "<case>",
  "checkpoint_loaded": true,
  "last_round_id": "<如果有>",
  "known_next_actions": [],
  "known_dead_ends": []
}`,
  { label: 'checkpoint', phase: '阶段一：读取 checkpoint' },
)

phase('阶段二：单轮自动推进')

const autopilot = await agent(
  `基于上一阶段 checkpoint，执行一轮确定性 autopilot。不要开启无限循环；只跑一轮。

## 优先命令

\`\`\`bash
python3 scripts/ctf-website/ctf_autopilot.py ${manifest} --max-actions ${maxActions} ${execute ? '--execute' : ''}
\`\`\`

如果 manifest 路径与 checkpoint 输出不同，改用 checkpoint 中的实际路径。

## 要求

1. 命令失败时读取错误，修正路径或依赖问题后重试一次。
2. 不要把真实请求/响应输出到最终回答；原始证据写入 \`exports/ctf-website/<case>/\`。
3. 总结本轮 autopilot 的 executed/planned/agent_required/error 动作。

## 输出

返回 JSON，不要 Markdown：

{
  "manifest": "<实际 manifest 路径>",
  "executed": [],
  "planned": [],
  "agent_required": [],
  "errors": []
}`,
  { label: 'autopilot-round', phase: '阶段二：单轮自动推进' },
)

phase('阶段三：Agent 攻击网推进')

const attackRound = await agent(
  `现在作为 Web CTF Agent 做一轮有界攻击网推进。你不是只做提示词总结，要实际读取文件、运行安全探测命令、保存证据。

## 输入

Target: ${target}
Case: ${caseName}
Manifest: ${manifest}
Autopilot result:
${autopilot}

## 约束

1. 每发现一个信号（JWT、SQLi、SSRF、LFI、SSTI、CVE、upload、auth 等）先运行：
   \`python3 scripts/ctf-website/kb_router.py "<signal>"\`
   然后读取排名靠前的 KB 技术文件。
2. 按 \`kb/ctf-website/techniques/attack-network.md\` 多路径推进。
3. 本轮最多选择 2 条最高优先路径深入验证，避免无限发散。
4. 所有证据落盘：
   - raw request: \`exports/ctf-website/<case>/requests/\`
   - notes: \`notes/ctf-website/<case>/\`
   - report fragments: \`reports/ctf-website/<case>/\`
5. 如果拿到 flag 或等价通关证据，写入本地 report，并在 \`ai_manifest.json\` 的 evidence 中记录 artifact 路径。
6. 如果当前路径需要登录态、验证码、浏览器态或额外权限，不要等待人工；记录到 dead_ends 或 next_round_focus，然后自动切换其他攻击网路径。
7. 只有全部路径耗尽或 24h 预算耗尽才返回 EXHAUSTED；否则继续返回 CONTINUE。

## 输出

返回 JSON，不要 Markdown：

{
  "status": "CONTINUE|DONE|EXHAUSTED",
  "reason": "",
  "manifest": "<实际 manifest 路径>",
  "evidence_added": [],
  "dead_ends_added": [],
  "signals_seen": [],
  "next_round_focus": []
}`,
  { label: 'attack-network-round', phase: '阶段三：Agent 攻击网推进' },
)

phase('阶段四：写回与停止判断')

const final = await agent(
  `整合本轮结果并写回 manifest/notes。必须只输出一个明确 loop 状态。不要把“等待人工确认/人工审批”作为状态；无人值守执行失败时，记录证据并切换路径。

## 输入

Checkpoint:
${checkpoint}

Autopilot:
${autopilot}

Attack round:
${attackRound}

## 写回要求

1. 读取实际 \`ai_manifest.json\`。
2. 如果 attack round 有 \`evidence_added\` / \`dead_ends_added\` / \`next_round_focus\`，合并到 manifest。
3. 在 case 或 reports 目录写一份本轮摘要，例如 \`reports/ctf-website/<case>/loop-round-<timestamp>.md\`。
4. 输出状态：
   - DONE：已拿到 flag / 已生成完整复现报告。
   - EXHAUSTED：预算耗尽、全路径耗尽、目标长期不可达或关键依赖缺失且无替代路径。
   - CONTINUE：仍有 next_round_focus 或 pending hypotheses。
5. stopOnExhausted 当前为 ${stopOnExhausted}；如果 false，即使路径暂时耗尽也生成新的 recon/fingerprint/route-discovery 焦点并返回 CONTINUE。

## 最终输出格式

只输出以下格式，不要额外解释：

STATUS: CONTINUE|DONE|EXHAUSTED
MANIFEST: <path>
CASE: <case>
ROUND_REPORT: <path>
REASON: <one-line reason>
NEXT: <one-line next focus or empty>`,
  { label: 'loop-status', phase: '阶段四：写回与停止判断' },
)

return {
  target,
  caseName,
  manifest,
  checkpoint,
  autopilot,
  attackRound,
  final,
}
