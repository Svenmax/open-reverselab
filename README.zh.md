# ReverseLab

开源逆向工程实验环境 —— 178 篇知识库文章，100+ MCP 自动化工具，覆盖 CTF 渗透测试 / APK 逆向 / PE 二进制分析 / 加密协议破解 / 游戏作弊分析。Agent 原生设计，目录即约定。
<img width="1194" height="430" alt="image" src="https://github.com/user-attachments/assets/65085420-66bd-4c9a-b02d-8b4a55005d03" />

> [English version](README.md)

## 路由

```
信号 → kb_router(board=) → kb_read_file → 攻击链 → MCP 工具映射 → 执行
```

| 信号类型 | Board | KB 分类数/文件数 | MCP 工具族 |
|---------|-------|-----------------|-----------|
| HTTP/Web/API/CVE/Cloud/CAPTCHA | `ctf-website` | 26/118 | `http_probe` `run_ctf_tool` `kb_router` |
| APK/DEX/SO/Frida/Java | `apk-reverse` | 8/20 | `android_app_baseline` `android_crypto_unpack_recipe` `android_frida_*` |
| PE/x64/x86/malware/driver | `pe-reverse` | 9/22 | `triage_pe` `ghidra_headless_analyze` `make_x64dbg_breakpoint_script` `sample_full_workup` |
| Crypto/Protocol/Cheat/IoT/Radio | `general` | 5/17 | `die_scan` `ghidra_*` `rizin_*` `python_re_tool_*` |

## 知识库

```
kb/
├── ctf-website/techniques/   26 类 118 篇 — Web 攻击全表面
├── apk-reverse/techniques/    8 类 20 篇 — APK/DEX 逆向
├── pe-reverse/techniques/     9 类 22 篇 — PE 二进制分析
└── general/techniques/        5 类 17 篇 — 密码学/协议/内核/作弊/方法论
```

每篇技术文件结构：`场景 → 输入信号 → 方法 → 攻击链 → MCP 工具映射`

Agent 工作流：检测到信号 → `kb_router` 查技术 → `kb_read_file` 读 → 按 MCP 工具映射执行。

## 板块

| 板块 | 触发信号 |
|------|---------|
| `boards/ctf-website` | URL, HTTP, JWT, SQLi, SSRF, CVE, API, CSP, OAuth, CAPTCHA, Cloudflare, ReDoS, Slowloris, DoS, Paywall |
| `boards/android` | APK, DEX, adb, Frida, jadx, smali, SO, native |
| `boards/windows` | PE, EXE, DLL, x64dbg, Ghidra, Procmon, packer, malware |
| `boards/general` | AES/DES/RSA, protobuf, game cheat, EAC/BE/Vanguard, firmware, JTAG, SDR |
| `boards/misc` | MCP 配置, skill 安装, 环境自检 |

## 目录约定

```
samples/      → 原始样本 + _quarantine/ + unpacked/
exports/      → 工具输出（triage/IOC/YARA/Sigma/Procmon/Ghidra summary）
patches/      → patch 产物（不修改原始样本）
notes/        → 分析笔记
reports/      → 最终报告
scripts/      → 自动化脚本
projects/     → Ghidra 项目文件
templates/    → 笔记/报告/规则模板
kb/           → 可复用攻击知识库
tools/        → 工具链
cases/        → 轻量索引，不复制大文件
```

## 安装

Windows 新手优先双击根目录的 `START_HERE.bat` 或 `START_HERE.cmd`。它会自动检查
Python / uv / Git / `reverse_lab_tools` MCP、生成核心 wrappers，给出缺失项安装建议，
真实调用 MCP 核心工具，并写入 `reports/misc/first-run-report.json` 与
`reports/misc/mcp-smoke-report.json`。

想让 AI 代装时，复制 [给 AI 的安装提示词](templates/prompts/ai-install.zh.md) 给 Codex 或 Claude Code。
不知道从哪里开始时，先看 [START.md](START.md)。

```powershell
git clone https://github.com/LING71671/open-reverselab.git
cd open-reverselab
python scripts/misc/first_run_check.py       # 确认目录和 reverse_lab_tools MCP
uv run --project tools/skills/mcp/ReverseLabToolsMCP python scripts/misc/mcp_smoke_check.py --write-report
.\scripts\misc\bootstrap.ps1                 # 生成核心脚本 wrappers
.\scripts\misc\install_tools.ps1 -CTF       # Web 工具
.\scripts\misc\install_tools.ps1 -Android   # APK 工具
.\scripts\misc\install_tools.ps1 -Windows   # PE 工具
.\scripts\misc\install_tools.ps1 -Common    # Ghidra + Maven
```

## Agent 快速打开

1. 克隆到一个固定本地目录，例如 `<workspace>/open-reverselab`。
2. Windows：双击 `START_HERE.bat` 或 `START_HERE.cmd` 完成首次检查。
3. Claude Code：先 `cd <workspace>/open-reverselab`，再启动会话。
4. Codex APP：直接打开现有的 `open-reverselab` 文件夹。
5. AI 代装：复制 [templates/prompts/ai-install.zh.md](templates/prompts/ai-install.zh.md) 里的提示词。
6. 创建任务：`python scripts/misc/new_task.py --board ctf-website --name <name>`。
7. 每次换机器或重配 MCP 后，运行 `uv run --project tools/skills/mcp/ReverseLabToolsMCP python scripts/misc/mcp_smoke_check.py --write-report`，确认 MCP 真实可调用。

## 迭代模式

```
打靶 (Playwright/浏览器自动化)    提取增量                写/改 制品             同步 open-reverseLab
─────────────────────────  →  ──────────────  →  ──────────────────────  →  ───────────────────
攻破 Lab / CTF               判断是否新增技巧        kb/   技术文档           git commit (案例不推)
截图验收                     仅增强有差异的点        scripts/ 自动化脚本      技术制品开源
                             无则不硬改             templates/ 模板
                                                   tools/   工具
```

**规则**：
1. 每个 Lab 攻破后判断是否有**新技巧**，有则落成制品，无则不硬写
2. 制品优先追加/插入，保持原文风格不变
3. 案例细节留私库，通用化技术写入制品后同步开源

## 链路

启动时 Agent 沿此链路加载上下文：

```
CLAUDE.md → AGENTS.md → AI-USAGE.md → boards/<board>/AI-USAGE.md
```

搭配 [codex-session-patcher](https://github.com/ryfineZ/codex-session-patcher) 一键配置项目级 `.codex/` 环境与 MCP 服务器。

## 免责声明

### 〇、定义

- **"本项目"** — 本仓库（`open-reverseLab`），包括其全部文件、源代码、编译产物、脚本、知识库文章、文档、模板、配置文件，以及在仓库历史中任何时刻存在于任何分支、标签、发布版或提交记录中的任何其他内容。
- **"版本"** — 本项目的任何状态，可通过或可检索自 git 提交哈希、分支名称、标签名称、发布标识、归档文件（ZIP、TAR 等）、容器镜像、包管理器条目、CI/CD 构建产物、预发布版本（alpha、beta、RC）、快照或任何其他分发格式获取，无论由本项目维护者发布还是由任何第三方发布。
- **"使用者"** — 任何访问、下载、克隆、执行、查阅、引用或以其他方式接触本项目或任何衍生作品的个人、法人、组织、自动化系统（包括但不限于机器人、CI/CD 流水线、自动化扫描服务、AI/ML 训练流水线及智能体系统）或任何其他主体，无论是全部还是部分，无论是直接还是通过任何中间系统、服务或个人间接进行。
- **"衍生作品"** — 基于或派生自本项目的任何作品，无论是全部还是部分，无论修改程度如何或分发媒介为何。包括但不限于：fork、克隆、修改副本、再分发、二进制重编译、容器镜像、包管理器分发、插件系统、API 封装、嵌入子集（即使仅包含一个函数、类、脚本或代码片段）、翻译版本、包含本项目代码的学术作品，以及任何集成、引用、链接或封装本项目或其任何部分的作品。

### 一、适用范围

**本声明追溯适用于且前瞻适用于本项目的所有版本和所有衍生作品，并约束所有使用者，无任何例外。** 以任何形式或任何程度访问或使用本项目或任何衍生作品，即视为使用者无条件同意受本声明全部条款的约束。若使用者不同意本声明的全部或部分内容，使用者须立即停止一切访问和使用，并须永久删除使用者拥有或控制的全部本项目及任何衍生作品的副本。

### 二、法律合规——全部司法管辖区

2.1 本项目及所有衍生作品的使用须严格遵守所涉及的一切司法管辖区的全部适用法律、法规、规章和监管要求，包括但不限于：
   - （一）使用者所在或住所地国家/地区的法律；
   - （二）任何目标系统、设备、网络或数据所在或注册地国家/地区的法律；
   - （三）任何服务器、中继、代理或中间基础设施物理所在地或合法注册地国家/地区的法律；
   - （四）所有适用的国际法律、条约和公约；
   - （五）所有适用的出口管制与制裁制度，包括但不限于美国《出口管理条例》（EAR）、《国际武器贸易条例》（ITAR）、美国财政部外国资产控制办公室（OFAC）管理的法规、欧盟《两用物项条例》（2021/821）、英国《出口管制法》、《瓦森纳安排》以及任何其他司法管辖区的同等法律；
   - （六）所有适用的数据保护与隐私法律，包括但不限于 GDPR（欧盟/欧洲经济区）、CCPA/CPRA（加利福尼亚州）、《中华人民共和国个人信息保护法》（PIPL）、PDPA（新加坡）、LGPD（巴西）以及任何其他司法管辖区的同等法律。

2.2 使用者全权负责判断哪些法律适用，并全权负责在使用本项目之前获取一切必要的许可、授权、批准及法律意见。

2.3 **不存在任何地域例外。** 本项目可从某一特定国家或地区访问这一事实，不构成在该国家或地区使用即合法的陈述。使用者须自行独立核实合法性。

### 三、仅限授权用途

3.1 本项目的提供**仅限于**以下用途：
   - （一）已获得目标系统所有者或合法运营者明确的、书面的、事先授权的安全测试（渗透测试、漏洞评估、红队演练）；
   - （二）在受控、授权的环境中进行的 CTF（Capture The Flag）竞赛及类似的教育性网络安全练习；
   - （三）遵守所有适用伦理审查和机构批准要求的善意学术研究与发表；
   - （四）个人学习与自学；
   - （五）对使用者合法拥有所有权或已获得合法所有者明确的、书面的、事先授权的软件、固件或设备的逆向工程、分析与安全研究。

3.2 **授权须为明确、书面且事先取得。** 默示的、追溯的或口头的授权均不充分。举证授权已取得的责任由使用者承担。

3.3 任何超出第 3.1 条所列用途的使用均属未经授权的禁止行为。

### 四、禁止用途

4.1 使用者**不得**将本项目或任何衍生作品用于以下任何行为：
   - （一）未经授权访问、干扰或破坏任何系统、网络、设备或数据；
   - （二）开发、分发或运营恶意软件（恶意程序、勒索软件、间谍软件、rootkit、僵尸网络等）；
   - （三）窃取、泄露或未经授权收集数据或知识产权；
   - （四）规避版权保护、数字权利管理（DRM）或访问控制机制，适用法律明确允许的除外；
   - （五）欺诈、身份盗用、网络钓鱼或任何形式的欺骗；
   - （六）骚扰、跟踪、人肉搜索或任何形式的非法监视；
   - （七）破坏、拒绝服务攻击或服务中断；
   - （八）违反美国《计算机欺诈与滥用法》（CFAA, 18 U.S.C. § 1030）、英国《1990 年计算机滥用法》、《中华人民共和国网络安全法》、欧盟《关于攻击信息系统的第 2013/40/EU 号指令》或任何司法管辖区任何同等法律的任何活动；
   - （九）涉及或针对受联合国、美国、欧盟、英国或任何其他适用当局全面制裁、禁运或贸易限制的国家、地区、实体或个人的任何活动；
   - （十）违反任何适用法律、法规或第三方权利的任何其他活动。

4.2 本清单为非穷尽列举。特定活动未列入本清单不意味其获得授权。

### 五、无担保

5.1 本项目按"现状"提供，不作任何形式的明示或默示担保，包括但不限于适销性、特定用途适用性、所有权、不侵权、准确性、完整性、安全性、可用性以及无缺陷或无漏洞的担保。

5.2 本项目的作者、贡献者和维护者不担保本项目无错误、安全、合法合规或适用于任何特定目的。使用者承担使用本项目的全部风险。

### 六、责任限制与赔偿

6.1 在适用法律允许的最大范围内，本项目的作者、贡献者、维护者或任何与项目相关的人士或实体在任何情况下均不对因使用或无法使用本项目或任何衍生作品而引起或与之相关的任何直接、间接、附带、特殊、惩戒性、惩罚性或结果性损害（包括但不限于数据丢失、利润损失、业务中断、系统损坏、声誉损害、法律处罚或监管制裁）承担责任，无论基于合同、侵权（包括过失）、严格责任或任何其他法律理论，即使已被告知发生此类损害的可能性。

6.2 **使用者同意赔偿、为项目相关方抗辩并使其免受损害**，以弥补因使用者的使用、滥用或分发本项目或任何衍生作品，或使用者违反本声明或任何适用法律而引起或与之相关的任何及所有索赔、要求、诉讼、程序、责任、损害、损失、成本和费用（包括合理的律师费）。

### 七、衍生作品

7.1 **强制保留。** 任何衍生作品须在显著且易于发现的位置（至少：根目录 README 或同等主要文档文件）完整包含本声明，不得修改、删除或删节。

7.2 **标明来源。** 任何衍生作品须清晰且醒目地说明其与本项目的关系，包括提供原始项目仓库的链接（`https://github.com/LING71671/open-reverselab`），以及声明该衍生作品未经本项目作者认可或与项目作者无关。

7.3 **不得弱化。** 衍生作品的创作或分发不免除衍生作品的作者、分发者或使用者遵守本声明任何条款的义务。本声明全部条款对衍生作品的适用效力与对原始项目的适用效力相同。

7.4 **再许可。** 对衍生作品的任何许可授权须与本声明保持一致，且不得意图凌驾、限缩或废止本声明的任何条款。

7.5 **告知义务。** 向第三方分发本项目或衍生作品的任何人，须在分发之时或之前采取合理措施将本声明提请接收方注意。

### 八、第三方组件

本项目可能包含、引用、调用或捆绑第三方软件、库、工具或数据。此类第三方组件受其各自的许可和免责声明约束。本项目作者对第三方组件不作任何陈述或担保，也不承担因其使用而产生的任何责任。使用者须独立审查并遵守所有第三方条款。

### 九、无认可

任何使用者使用本项目或任何衍生作品，不意味本项目作者、贡献者或维护者予以认可、赞助、关联或批准。使用者不得表示或暗示存在任何此类认可。

### 十、可分性

若本声明中的任何条款被有管辖权的法院或仲裁庭认定为无效、不合法或不可执行，该条款应予分割，其余条款继续完全有效。该无效条款应以最能接近原条款意图和经济效果的有效条款替代。

### 十一、管辖法律与争议解决

本声明受适用法律管辖并依其解释，不适用冲突法原则。因本声明或本项目使用引起或与之相关的任何争议，应依照适用的程序法解决。使用者接受适用法律确定的管辖法院的管辖。

### 十二、修订

本项目维护者保留随时修订本声明的权利。使用者访问或使用时有效的声明版本为适用版本。使用者有责任定期查阅本声明。修订后继续使用即构成对修订条款的接受。

### 十三、优先语言

本声明以英文和中文发布。若两个语言版本之间存在任何冲突或歧义，以英文版本为准。

### 十四、完整协议

本声明构成使用者与项目作者之间就本声明主题事项的完整谅解，并取代所有先前或同期的口头或书面通信、协议和谅解。

### 十五、存续

本声明中因其性质应在使用终止或停止后继续有效的全部条款——包括但不限于关于责任、赔偿、担保免责和管辖法律的条款——应无限期存续。

## 许可

GPL-3.0-only. 详见 [LICENSE](LICENSE)。
