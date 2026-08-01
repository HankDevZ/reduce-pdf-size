# AdSense 申请就绪 — 执行进度与交接

最后更新：2026-08-01

本文档用于跨会话交接。目标是让 reducepdfsize.net 达到可以提交 Google AdSense 申请的状态。
新会话从本文档开始即可继续，不需要重新审计。

---

## 1. 当前状态一览

| 项目 | 状态 |
|---|---|
| 站点 | https://reducepdfsize.net （Cloudflare Workers，源码在 `site/`） |
| 域名注册 | 2026-07-30（**极新**，这是审核风险之一） |
| 内容页 | 3 个（首页 + 2 篇实测文章） |
| 支撑页 | 5 个（about / privacy / terms / source / contact） |
| 测试 | `npm test` 16 项全绿 |
| Lint | 干净 |
| 可否提交申请 | **否**，仍有 4 个 Blocker 未清 |

已完成：内容体系的地基（可复现基准测试 + 2 篇数据驱动文章）。
未开始：全部技术类 Blocker（CSP、隐私政策、Cookie 同意、ads.txt）。

---

## 2. AdSense 审计结论

完整审计基于 `adsense-site-auditor` skill 的 73 条要求 ID（skill 已安装在 `~/.claude/skills/adsense-site-auditor/`）。

审计时统计：**Pass 45 / Fail 10 / Unknown 7 / N/A 11 = 73**。

### 2.1 Blocker（必须清掉才能申请）

| ID | 问题 | 状态 |
|---|---|---|
| `ADS-OWN-03` | **CSP 直接封锁 AdSense**。`site/worker/index.ts:45-47` 下发的 CSP 未放行任何 Google 广告域名 | ❌ 未处理 |
| `ADS-SITE-02` | 三种所有权验证方式当前均不可用（广告代码被 CSP 拦、`/ads.txt` 404、meta 未部署） | ❌ 未处理 |
| `ADS-PRIV-01` | 隐私政策未披露广告相关数据收集；原文还写着 "does not include advertisements" | ❌ 未处理 |
| `ADS-ELIG-03` | 汇总项，上述修完自动转 Pass | ❌ 未处理 |

CSP 拦截是**实测确认**的，不是推断。在线上页面注入广告脚本会触发真实 CSP 违规：

```
pagead2.googlesyndication.com/pagead/js/adsbygoogle.js  → script-src-elem 拦截
tpc.googlesyndication.com (iframe)                      → frame-src 拦截
```

### 2.2 High

| ID | 问题 | 状态 |
|---|---|---|
| `ADS-CONTENT-03` / `ADS-PUB-11` | 内容体量不足（低价值内容判定的最大风险） | 🟡 **进行中**：1 → 3 个内容页，目标 9–13 |
| `ADS-PRIV-04` | 无 Cookie 同意机制，EEA/UK 首屏即写入 `_ga` | ❌ 未处理 |
| `ADS-PRIV-02` | 未声明第三方广告 Cookie / 信标 | ❌ 未处理 |
| `ADS-SITE-01` | 域名仅数天，几乎确定尚未被索引 | ⏳ 需要时间，非代码问题 |

### 2.3 Medium

| ID | 问题 | 状态 |
|---|---|---|
| `ADS-TXT-02` | 未发布 ads.txt（**获批后**才能做，需要 pub-ID） | ⏸ 阻塞中 |
| `ADS-PRIV-10` | 无个性化广告披露与用户控制入口 | ❌ 未处理 |
| — | Cloudflare Insights 信标未披露（当前被 CSP 拦截未执行，放宽 CSP 时会开始采集） | ❌ 未处理 |

### 2.4 审计中确认良好的部分（不需要动）

- 爬虫可达性 7/7：Mediapartners-Google / AdsBot-Google / Googlebot / 空 UA 均 200，响应体一致
- 隐私声明与实现一致：压缩全程网络请求全部同源，PDF 确实不上传（实测验证）
- 无欺骗性 UX、无弹窗、无自动下载、重定向最长 1 跳
- 结构化数据完备，SSR 完整（禁用 JS 也有全文）
- 无任何违禁/受限内容（G 节 16 项、H 节 8 项全部通过）

---

## 3. 已完成的工作

### 3.1 可复现压缩基准测试体系 `site/benchmark/`

```
site/benchmark/
├── README.md              方法论 + 已知局限 + 待写选题
├── build-corpus.mjs       9 份语料的确定性生成器
├── run-benchmark.mjs      9 × 3 全矩阵测量，输出 results.json / results.md
├── verify-args.mjs        参数漂移守卫（已接入 npm test）
├── lib/pdf-writer.mjs     零依赖 PDF 构造器 + Ghostscript 元数据归一化
├── lib/ghostscript.mjs    Ghostscript 运行器（**参数唯一真源**）
├── corpus/manifest.json   9 份输入的 SHA-256（入库；PDF 本身已 gitignore）
└── results/               results.json + results.md
```

三条可信性保证：

1. **引擎相同** — `public/ghostscript/gs.wasm` 与 `node_modules/@jspawn/ghostscript-wasm/gs.wasm` SHA-256 完全一致（`4dceaac9…4161`）。引擎为 **GPL Ghostscript 9.56.0**。
2. **参数相同** — `verify-args.mjs` 解析 `public/pdf-worker.js` 逐项比对，已接入 `npm test`，生产参数一改测试即红。
3. **输入可复现** — 固定种子生成，任何机器重跑字节一致。

### 3.2 已发布文章

| 路由 | 标题 | 词数 |
|---|---|---:|
| `/compression-levels` | PDF Compression Levels Compared | 1295 |
| `/why-pdf-wont-compress` | Why Your PDF Will Not Compress | 917 |

### 3.3 跑出来的关键实测发现（可复用于后续文章）

**① Smallest Size 不一定最小。** 300dpi 扫描件上 `/screen` 像素只有 `/ebook` 的 ¼，文件却更大，因为编码器从 JPEG 换成了无损 Flate：

| 档位 | 最大图像 | 编码 | 流大小 |
|---|---:|---|---:|
| `/printer` | 2480×3508 | DCTDecode | 670.1 KB |
| `/ebook` | 1240×1754 | DCTDecode | **273.6 KB** |
| `/screen` | 595×842 | **FlateDecode** | 361.0 KB |

**② 真实文本 PDF 压缩后体积翻倍。** 同样 12 页文字，输出完全一样（16.7 KB），差别只在输入：

| | 输入 | 输出 | 结果 |
|---|---:|---:|---|
| `03` 原始未压缩流 | 39.4 KB | 16.7 KB | −57.5% |
| `09` Flate 压缩流（真实情况） | **8.13 KB** | 16.7 KB | 三档全拒 |

> ⚠️ 这一条曾经写错过。最初语料只有 `03`，其内容流未压缩，导致 57.5% 被误当成典型值写进文章（当时写的是"下限"，方向反了）。后来补测 `09` 才发现真实情况相反。**新增语料时务必确认它像真实导出工具那样压缩内容流。**

**③ 交互式表单域会被摧毁。** `05-form-fields.pdf` 进去带 `/AcroForm`，出来没有了。这是 `/terms` 里那句"Complex forms… may not be preserved exactly"的硬证据。

**④ 图片去重可量化。** 10 个图像对象 → 1 个，`/ebook` 下 89.6% 降幅完全来自去重，无降采样参与。

**⑤ 小文件必然变大。** 3.43 KB 表单三档分别变成 6.87 / 6.88 / 9.54 KB，固定开销大于全部内容。

---

## 4. 新会话必须知道的约定

违反这些会导致测试失败或数据与文案脱节。

### 4.1 文章里的测量数字一律不许手打

`site/app/benchmark.ts` 从 `benchmark/results/results.json` 派生所有数值。文章这样写：

```tsx
{formatBytes(rowFor(SCAN_FILE, "ebook")!.outputBytes)}
```

连「影响了 N 份文档」里的 N 也是 `SMALLEST_NOT_SMALLEST.length` 算出来的。重跑基准 → 页面自动更新。测试会遍历 `results.json`，断言每条未被拒结果的百分比都出现在页面上。

### 4.2 新增页面必须同步 5 处

1. `site/app/<route>/page.tsx`
2. `site/app/sitemap.xml/route.ts` — 加路径
3. `site/app/components/SiteFooter.tsx` — 加链接（保证站内可达）
4. `site/app/llms.txt/route.ts` + `llms-full.txt/route.ts`
5. `site/tests/rendered-html.test.mjs` — `publicPages` 映射 + sitemap 断言数组 + `Array(N)`

### 4.3 测试的硬约束

- **标题 20–60 字符**，**描述 70–160 字符**，且全站唯一（测试强制）
- 每页恰好 1 个 `<h1>`
- `llms-full.txt` 测试断言 `^### ` 恰好 6 个（= 6 条 FAQ）。**新增章节只能用 `## `**
- 文章页 JSON-LD 用 `TechArticle` + `BreadcrumbList` + `Person`，复用首页已有的 `#maintainer` / `#website` / `#web-application` 节点 ID

### 4.4 CSS 注意

`.legal-article p { margin-bottom: 20px }` 依赖 **margin 折叠**：`h2` 的 48px 上边距会吞掉它，所以既有法务页视觉不变。改动这块要重新目视确认。

数据表用 `.data-table` + `.data-table-wrap`（后者负责横向滚动）。**页面本身在 375px 下不得横向滚动**，已验证。

### 4.5 语料元数据归一化

Ghostscript 会写入墙钟时间戳和每次一换的 UUID，分布在 **Info 字典和 XMP 包两处**。`normalizeGhostscriptMetadata()` 用等长替换钉死（等长才不破坏 xref 偏移）。派生型语料（如 `07`）必须调用它，否则每次重建哈希都变。

---

## 5. 下一步（按优先级）

### 优先级 1：继续写内容（当前唯一在推进的 High）

还需 6–10 篇。以下选题的数据**已经测出来了**，直接可写：

| 选题 | 路由建议 | 现成数据 |
|---|---|---|
| **压缩到底改了 PDF 哪些部分**（推荐下一篇） | `/what-compression-changes` | `05` 的 AcroForm `yes→no`、`-dCompatibilityLevel=1.6`、`-dSubsetFonts`、`-dDetectDuplicateImages` 实测 |
| 扫描件 PDF 压缩 | `/compress-scanned-pdf` | `01` 全套编码数据；需同时把首页对应版块缩成摘要+链接 |
| 压到 1MB / 500KB / 300KB 能不能做到 | `/target-file-size` | 全矩阵结果 |

以下需要新写内容（无现成数据）：

| 选题 | 说明 |
|---|---|
| 加密 / 密码保护 PDF 为什么被拒 | 依据 `PdfCompressor.tsx:90` 的 `/Encrypt` 检测；**要坦白只采样首尾各 2MB，检测非穷尽** |
| 数字签名 PDF 为何压缩必然失效 | 依据 `PdfCompressor.tsx:95`；讲 `/ByteRange` 字节偏移原理 |
| 邮件附件体积上限对照 | 需标注核实日期，建立复核机制 |
| 求职投递 / 在线表单体积限制 | 同上，数据会过期 |
| 浏览器本地压缩 vs 服务器压缩 | 要如实写代价：16MB wasm 下载、内存不足有专门错误分支 |
| 系统自带 PDF 压缩方式 | 坦白承认有时不需要本站 |

**内容发布纪律（重要）：**
- 不要用 AI 批量生成。价值在实测数据和代码依据，那部分生成不出来。
- **不要同一天全部上线。** 全部 `lastmod` 相同 + 域名极新 = 明显的批量铺站特征。建议 6–8 周分批，正好和等待索引的窗口重合。
- 每篇必须有独立存在理由。能合并而不损失信息的就该合并。

### 优先级 2：申请前清掉技术 Blocker

**注意：现在改 CSP 没有立即收益** —— 在拿到 pub-ID 真正放广告代码之前，放行广告域名只是白白削弱当前的安全头。建议临申请前再做。

**① CSP** — 改 `site/worker/index.ts:45-47`，需放行：

```
script-src  += https://pagead2.googlesyndication.com https://partner.googleadservices.com
               https://tpc.googlesyndication.com https://www.googletagservices.com
               https://fundingchoicesmessages.google.com
img-src     -> 'self' data: https:        （广告素材来自任意域名，白名单会导致空白）
connect-src += https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net
               https://csi.gstatic.com https://ep1.adtrafficquality.google
               https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com
frame-src    = https://googleads.g.doubleclick.net https://tpc.googlesyndication.com
               https://www.google.com https://fundingchoicesmessages.google.com
```

`frame-ancestors 'none'` 和 `x-frame-options: DENY` 保留（限制的是本站被嵌入，不影响广告 iframe 嵌入本站）。
**同时要改 `site/tests/rendered-html.test.mjs:88` 附近的 CSP 断言**，否则测试红。
改完后 Cloudflare Insights 信标会开始执行 → 需同步在隐私政策披露或在 Cloudflare 后台关闭。

**② 隐私政策** — 改 `site/app/privacy/page.tsx`，新增广告数据披露章节，并修订现有的 "does not include advertisements" 等措辞（上线广告后会变成失实陈述）。

**③ Cookie 同意** — 接入 Google 认证 CMP（AdSense 后台内置的 Funding Choices 最省事），并在 `FirebaseAnalytics.tsx` 初始化前实现 Consent Mode v2 默认拒绝：

```ts
gtag('consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied',
  ad_personalization: 'denied', analytics_storage: 'denied',
  region: ['EEA','GB'], wait_for_update: 500,
});
```

当前 `FirebaseAnalytics.tsx:66` 在 load 后无条件初始化，无地区判断、无同意门控。

**④ ads.txt** — 获批后新建 `site/app/ads.txt/route.ts`（照 `robots.txt/route.ts` 的写法）：

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

### 优先级 3：索引与时间

- 提交 Google Search Console，开始积累索引（**尚未做**）
- 域名 2026-07-30 注册。建议内容补足后再积累 4–8 周自然流量才提交申请

---

## 6. 常用命令

```bash
cd site

npm test                      # 构建 + 参数守卫 + 16 项渲染测试
npm run lint
npm run benchmark:verify      # 只跑参数漂移守卫
npm run benchmark:build       # 重建 9 份语料
npm run benchmark             # 重跑全矩阵，刷新 results/
```

验证语料可复现：

```bash
cp benchmark/corpus/manifest.json /tmp/expected.json
EXPECT_MANIFEST=/tmp/expected.json node benchmark/build-corpus.mjs
```

本地预览（预览沙箱读不到本机 npm，只能这样起）：

```bash
PORT=4401 npm run start
```

---

## 7. 需要人工决策 / 无法由代码完成

审计中标为 `Unknown` 的 7 项，都需要站主本人确认或账号权限：

- `ADS-ELIG-01` 申请人是否满 18 岁
- `ADS-ELIG-02` 是否已存在 AdSense 账号（有的话应在原账号内「添加站点」，不要新建）
- `ADS-SITE-01` AdSense 后台站点状态
- `ADS-PROG-01` / `ADS-PROG-04` 流量来源合规性确认
- `ADS-PUB-09` 站点/账号映射
- `ADS-PRIV-08` GA4 属性的 Google 信号 / 广告个性化设置

---

## 8. 变更文件清单（本轮）

```
 M site/.gitignore                        + /benchmark/corpus/*.pdf
 M site/app/components/SiteFooter.tsx     + 两篇文章链接
 M site/app/content.ts                    + FAQ 第 2 条加内链
 M site/app/globals.css                   + 段落间距修复、表格、面包屑、命令块
 M site/app/llms-full.txt/route.ts        + 实测结论 + 规范页面
 M site/app/llms.txt/route.ts             + 两篇文章条目
 M site/app/page.tsx                      + 质量版块指向文章 1
 M site/app/sitemap.xml/route.ts          + 两条路由
 M site/package.json                      + benchmark 脚本，verify 接入 test
 M site/tests/rendered-html.test.mjs      + 2 页 + 2 个测试
?? site/app/benchmark.ts                  数据视图层
?? site/app/compression-levels/           文章 1
?? site/app/why-pdf-wont-compress/        文章 2
?? site/benchmark/                        基准测试体系
```

尚未提交（全部为未 commit 状态）。
